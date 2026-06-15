use git2::{
    BranchType, Cred, FetchOptions, MergeOptions, PushOptions, RemoteCallbacks, Repository,
    Signature, StatusOptions,
};
use serde::{Deserialize, Serialize};
use std::{path::PathBuf, sync::{Arc, atomic::Ordering}};
use tauri::Emitter;

// ── Types ─────────────────────────────────────────────────────────────────────

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CommitEntry {
    pub hash: String,
    pub short_hash: String,
    pub author: String,
    pub email: String,
    pub date: i64,
    pub message: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FileStatus {
    pub path: String,
    pub status: String,
    pub staged: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct BranchInfo {
    pub name: String,
    pub is_current: bool,
    pub is_remote: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DiffLine {
    pub content: String,
    pub origin: char,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DiffHunk {
    pub header: String,
    pub lines: Vec<DiffLine>,
}

// ── Repository ────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn is_git_repo(path: PathBuf) -> bool {
    Repository::open(path).is_ok()
}

#[tauri::command]
pub fn init_repo(path: String) -> Result<String, String> {
    Repository::init(&path).map_err(|e| e.to_string())?;
    Ok(format!("Initialized repo at {}", path))
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct CloneProgress {
    pub phase: String,   // "receiving" | "resolving" | "done"
    pub received: usize, // objects received so far
    pub total: usize,    // total objects
    pub bytes: usize,    // bytes received
    pub percent: u32,    // 0-100
}

#[tauri::command]
pub fn clone_repo(
    app: tauri::AppHandle,
    state: tauri::State<crate::AuthState>,
    url: String,
    dest: String,
    token: Option<String>,
) -> Result<String, String> {
    state.clone_cancel.store(false, Ordering::SeqCst);
    let cancel_flag = Arc::clone(&state.clone_cancel);

    let mut callbacks = RemoteCallbacks::new();

    // Auth
    if let Some(t) = token {
        callbacks
            .credentials(move |_url, _username, _allowed| Cred::userpass_plaintext("oauth2", &t));
    }

    // Transfer progress — fires during object download
    let app_clone = app.clone();
    let cancel_transfer = Arc::clone(&cancel_flag);

    callbacks.transfer_progress(move |stats| {
        if cancel_transfer.load(Ordering::SeqCst) {
            return false;
        }

        let percent = if stats.total_objects() > 0 {
            (stats.received_objects() * 100 / stats.total_objects()) as u32
        } else {
            0
        };

        let _ = app_clone.emit(
            "clone:progress",
            CloneProgress {
                phase: "receiving".to_string(),
                received: stats.received_objects(),
                total: stats.total_objects(),
                bytes: stats.received_bytes(),
                percent,
            },
        );
        true // return false to cancel
    });

    let mut fetch_opts = FetchOptions::new();
    fetch_opts.remote_callbacks(callbacks);

    // Checkout progress — fires while writing files to disk
    let app_checkout = app.clone();
    let cancel_checkout = Arc::clone(&cancel_flag);
    let mut checkout = git2::build::CheckoutBuilder::new();
    let mut total_files: usize = 0;
    checkout.progress(move |_path, current, total| {
        if cancel_checkout.load(Ordering::SeqCst) {
            return;
        }

        if total > 0 && total_files != total {
            total_files = total;
        }
        let percent = if total > 0 {
            (current * 100 / total) as u32
        } else {
            0
        };
        let _ = app_checkout.emit(
            "clone:progress",
            CloneProgress {
                phase: "resolving".to_string(),
                received: current,
                total,
                bytes: 0,
                percent,
            },
        );
    });

    let mut builder = git2::build::RepoBuilder::new();
    builder.fetch_options(fetch_opts);
    builder.with_checkout(checkout);

    builder
        .clone(&url, std::path::Path::new(&dest))
        .map_err(|e| e.to_string())?;

    if cancel_flag.load(Ordering::SeqCst) {
        let _ = std::fs::remove_dir_all(&dest);
        let _ = app.emit("clone:cancelled", ());
        return Err("Clone cancelled".to_string());
    }

    // Emit done
    let _ = app.emit(
        "clone:progress",
        CloneProgress {
            phase: "done".to_string(),
            received: 0,
            total: 0,
            bytes: 0,
            percent: 100,
        },
    );

    Ok(format!("Cloned {} to {}", url, dest))
}

// ── Status & Staging ──────────────────────────────────────────────────────────

#[tauri::command]
pub fn get_status(path: String) -> Result<Vec<FileStatus>, String> {
    let repo = Repository::open(&path).map_err(|e| e.to_string())?;
    let mut opts = StatusOptions::new();
    opts.include_untracked(true).recurse_untracked_dirs(true);

    let statuses = repo.statuses(Some(&mut opts)).map_err(|e| e.to_string())?;

    let files = statuses
        .iter()
        .filter_map(|entry| {
            // FIX 2: entry.path() returns Option<&str>, use ? directly (valid in filter_map)
            let path = entry.path().unwrap().to_string();
            let s = entry.status();

            if s.contains(git2::Status::INDEX_NEW)
                || s.contains(git2::Status::INDEX_MODIFIED)
                || s.contains(git2::Status::INDEX_DELETED)
            {
                let status = if s.contains(git2::Status::INDEX_NEW) {
                    "added"
                } else if s.contains(git2::Status::INDEX_DELETED) {
                    "deleted"
                } else {
                    "modified"
                };
                return Some(FileStatus {
                    path,
                    status: status.to_string(),
                    staged: true,
                });
            }

            if s.contains(git2::Status::WT_MODIFIED) {
                return Some(FileStatus {
                    path,
                    status: "modified".to_string(),
                    staged: false,
                });
            }
            if s.contains(git2::Status::WT_NEW) {
                return Some(FileStatus {
                    path,
                    status: "untracked".to_string(),
                    staged: false,
                });
            }
            if s.contains(git2::Status::WT_DELETED) {
                return Some(FileStatus {
                    path,
                    status: "deleted".to_string(),
                    staged: false,
                });
            }

            None
        })
        .collect();

    Ok(files)
}

#[tauri::command]
pub fn stage_file(path: String, file: String) -> Result<(), String> {
    let repo = Repository::open(&path).map_err(|e| e.to_string())?;
    let mut index = repo.index().map_err(|e| e.to_string())?;
    index
        .add_path(std::path::Path::new(&file))
        .map_err(|e| e.to_string())?;
    index.write().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn stage_all(path: String) -> Result<(), String> {
    let repo = Repository::open(&path).map_err(|e| e.to_string())?;
    let mut index = repo.index().map_err(|e| e.to_string())?;
    index
        .add_all(["*"].iter(), git2::IndexAddOption::DEFAULT, None)
        .map_err(|e| e.to_string())?;
    index.write().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn unstage_file(path: String, file: String) -> Result<(), String> {
    let repo = Repository::open(&path).map_err(|e| e.to_string())?;
    let head = repo.head().map_err(|e| e.to_string())?;
    let head_commit = head.peel_to_commit().map_err(|e| e.to_string())?;
    let head_tree = head_commit.tree().map_err(|e| e.to_string())?;
    repo.reset_default(Some(head_tree.as_object()), [&file].iter())
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn discard_changes(path: String, file: String) -> Result<(), String> {
    let repo = Repository::open(&path).map_err(|e| e.to_string())?;
    let mut checkout = git2::build::CheckoutBuilder::new();
    checkout.force().path(&file);
    repo.checkout_head(Some(&mut checkout))
        .map_err(|e| e.to_string())?;
    Ok(())
}

// ── Diff ──────────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn get_diff(path: String, file: String, staged: bool) -> Result<Vec<DiffHunk>, String> {
    let repo = Repository::open(&path).map_err(|e| e.to_string())?;
    let mut opts = git2::DiffOptions::new();
    opts.pathspec(&file);

    let diff = if staged {
        let head = repo.head().ok().and_then(|h| h.peel_to_tree().ok());
        let index = repo.index().map_err(|e| e.to_string())?;
        repo.diff_tree_to_index(head.as_ref(), Some(&index), Some(&mut opts))
            .map_err(|e| e.to_string())?
    } else {
        repo.diff_index_to_workdir(None, Some(&mut opts))
            .map_err(|e| e.to_string())?
    };

    let mut hunks: Vec<DiffHunk> = Vec::new();

    diff.print(git2::DiffFormat::Patch, |_delta, hunk, line| {
        if let Some(h) = &hunk {
            let header = String::from_utf8_lossy(h.header()).to_string();
            if hunks
                .last()
                .map(|lh: &DiffHunk| lh.header != header)
                .unwrap_or(true)
            {
                hunks.push(DiffHunk {
                    header,
                    lines: vec![],
                });
            }
        }
        if let Some(current) = hunks.last_mut() {
            let content = String::from_utf8_lossy(line.content()).to_string();
            let origin = line.origin();
            if origin == '+' || origin == '-' || origin == ' ' {
                current.lines.push(DiffLine { content, origin });
            }
        }
        true
    })
    .map_err(|e| e.to_string())?;

    Ok(hunks)
}

// ── Commits ───────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn commit(
    path: String,
    message: String,
    author_name: String,
    author_email: String,
) -> Result<String, String> {
    let repo = Repository::open(&path).map_err(|e| e.to_string())?;
    let mut index = repo.index().map_err(|e| e.to_string())?;
    let tree_oid = index.write_tree().map_err(|e| e.to_string())?;
    let tree = repo.find_tree(tree_oid).map_err(|e| e.to_string())?;
    let sig = Signature::now(&author_name, &author_email).map_err(|e| e.to_string())?;
    let parent = repo.head().ok().and_then(|h| h.peel_to_commit().ok());
    let parents: Vec<&git2::Commit> = parent.iter().collect();
    let oid = repo
        .commit(Some("HEAD"), &sig, &sig, &message, &tree, &parents)
        .map_err(|e| e.to_string())?;
    Ok(oid.to_string())
}

#[tauri::command]
pub fn get_log(path: String, limit: usize) -> Result<Vec<CommitEntry>, String> {
    let repo = Repository::open(&path).map_err(|e| e.to_string())?;
    let mut revwalk = repo.revwalk().map_err(|e| e.to_string())?;
    revwalk.push_head().map_err(|e| e.to_string())?;
    revwalk
        .set_sorting(git2::Sort::TIME)
        .map_err(|e| e.to_string())?;

    let commits = revwalk
        .take(limit)
        .filter_map(|oid| {
            let oid = oid.ok()?;
            let commit = repo.find_commit(oid).ok()?;
            let author = commit.author();

            let author_name = author.name().unwrap_or("Unknown").to_string();
            let author_email = author.email().unwrap_or("").to_string();
            let date = commit.time().seconds(); // i64 unix timestamp

            let message = commit.summary().unwrap_or(None).unwrap_or("").to_string();
            let hash = oid.to_string();
            let short_hash = hash[..7].to_string();

            Some(CommitEntry {
                hash,
                short_hash,
                author: author_name,
                email: author_email,
                date,
                message,
            })
        })
        .collect();

    Ok(commits)
}

// ── Branches ──────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn get_branches(path: String) -> Result<Vec<BranchInfo>, String> {
    let repo = Repository::open(&path).map_err(|e| e.to_string())?;

    let current = repo
        .head()
        .ok()
        .as_ref()
        .and_then(|h| h.shorthand().ok()) // shorthand() -> Result<&str, Error>
        .unwrap_or("")
        .to_string();

    let branches = repo
        .branches(None)
        .map_err(|e| e.to_string())?
        .filter_map(|b| {
            let (branch, branch_type) = b.ok()?;
            // FIX 1: branch.name() returns Result<Option<&str>, Error>
            // unwrap the Result with ok(), then flatten the Option
            let name = branch.name().ok()??.to_string();
            Some(BranchInfo {
                is_current: name == current,
                is_remote: branch_type == BranchType::Remote,
                name,
            })
        })
        .collect();

    Ok(branches)
}

#[tauri::command]
pub fn create_branch(path: String, name: String) -> Result<(), String> {
    let repo = Repository::open(&path).map_err(|e| e.to_string())?;
    let head = repo.head().map_err(|e| e.to_string())?;
    let commit = head.peel_to_commit().map_err(|e| e.to_string())?;
    repo.branch(&name, &commit, false)
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn switch_branch(path: String, name: String) -> Result<(), String> {
    let repo = Repository::open(&path).map_err(|e| e.to_string())?;
    
    let clean_name = name.strip_prefix("origin/").unwrap_or(&name);
    let local_ref = format!("refs/heads/{}", clean_name);

    let obj = match repo.revparse_single(&local_ref) {
        Ok(object) => object, // Local branch exists! Use it.
        Err(_) => {
            let remote_ref = if name.starts_with("origin/") {
                format!("refs/remotes/{}", name)
            } else {
                format!("refs/remotes/origin/{}", name)
            };

            let remote_commit = repo.revparse_single(&remote_ref).map_err(|_| {
                format!(
                    "Branch '{}' could not be found locally or on the remote origin.",
                    clean_name
                )
            })?;

            let commit = remote_commit
                .as_commit()
                .ok_or("Remote reference is not a valid commit.")?;

            let mut local_branch = repo
                .branch(clean_name, commit, false)
                .map_err(|e| format!("Failed to create local tracking branch: {}", e))?;

            local_branch.set_upstream(Some(&remote_ref)).ok();

            repo.revparse_single(&local_ref).map_err(|e| e.to_string())?
        }
    };

    repo.checkout_tree(&obj, None).map_err(|e| e.to_string())?;

    repo.set_head(&local_ref).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn delete_branch(path: String, name: String) -> Result<(), String> {
    let repo = Repository::open(&path).map_err(|e| e.to_string())?;
    let mut branch = repo
        .find_branch(&name, BranchType::Local)
        .map_err(|e| e.to_string())?;
    branch.delete().map_err(|e| e.to_string())?;
    Ok(())
}

// ── Remote / Sync ─────────────────────────────────────────────────────────────

fn make_callbacks(token: Option<String>) -> RemoteCallbacks<'static> {
    let mut callbacks = RemoteCallbacks::new();
    if let Some(t) = token {
        callbacks
            .credentials(move |_url, _username, _allowed| Cred::userpass_plaintext("oauth2", &t));
    }
    callbacks
}

#[tauri::command]
pub fn fetch(path: String, token: Option<String>) -> Result<(), String> {
    let repo = Repository::open(&path).map_err(|e| e.to_string())?;
    let mut remote = repo.find_remote("origin").map_err(|e| e.to_string())?;
    let mut fetch_opts = FetchOptions::new();
    fetch_opts.remote_callbacks(make_callbacks(token));
    remote
        .fetch(&[] as &[&str], Some(&mut fetch_opts), None)
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn pull(path: String, token: Option<String>) -> Result<(), String> {
    let repo = Repository::open(&path).map_err(|e| e.to_string())?;
    let mut remote = repo.find_remote("origin").map_err(|e| e.to_string())?;
    let mut fetch_opts = FetchOptions::new();
    fetch_opts.remote_callbacks(make_callbacks(token));

    let head = repo.head().map_err(|e| e.to_string())?;
    let branch_name = head.shorthand().unwrap_or("main").to_string();

    remote
        .fetch(&[branch_name.as_str()], Some(&mut fetch_opts), None)
        .map_err(|e| e.to_string())?;

    let fetch_head = repo
        .find_reference("FETCH_HEAD")
        .map_err(|e| e.to_string())?;
    let fetch_commit = repo
        .reference_to_annotated_commit(&fetch_head)
        .map_err(|e| e.to_string())?;
    let (analysis, _) = repo
        .merge_analysis(&[&fetch_commit])
        .map_err(|e| e.to_string())?;

    if analysis.is_fast_forward() {
        let refname = format!("refs/heads/{}", branch_name);
        let mut reference = repo.find_reference(&refname).map_err(|e| e.to_string())?;
        reference
            .set_target(fetch_commit.id(), "Fast-forward pull")
            .map_err(|e| e.to_string())?;
        repo.set_head(&refname).map_err(|e| e.to_string())?;
        repo.checkout_head(Some(git2::build::CheckoutBuilder::default().force()))
            .map_err(|e| e.to_string())?;
    } else if analysis.is_normal() {
        repo.merge(
            &[&fetch_commit],
            Some(MergeOptions::new().fail_on_conflict(true)),
            None,
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub fn push(path: String, token: Option<String>, force: bool) -> Result<(), String> {
    let repo = Repository::open(&path).map_err(|e| e.to_string())?;
    let mut remote = repo.find_remote("origin").map_err(|e| e.to_string())?;

    let head = repo.head().map_err(|e| e.to_string())?;
    let branch_name = head.shorthand().unwrap_or("main").to_string();
    let refspec = if force {
        format!("+refs/heads/{}:refs/heads/{}", branch_name, branch_name)
    } else {
        format!("refs/heads/{}:refs/heads/{}", branch_name, branch_name)
    };

    let mut push_opts = PushOptions::new();
    push_opts.remote_callbacks(make_callbacks(token));
    remote
        .push(&[refspec.as_str()], Some(&mut push_opts))
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn add_remote(path: String, name: String, url: String) -> Result<(), String> {
    let repo = Repository::open(&path).map_err(|e| e.to_string())?;
    repo.remote(&name, &url).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_remotes(path: String) -> Result<Vec<String>, String> {
    let repo = Repository::open(&path).map_err(|e| e.to_string())?;
    let remotes = repo.remotes().map_err(|e| e.to_string())?;

    Ok(remotes
        .iter()
        .filter_map(|r| r.ok().flatten().map(|s| s.to_string()))
        .collect())
}
