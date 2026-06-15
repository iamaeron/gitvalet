mod git;

use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::sync::Mutex;
use std::time::Duration;
use tauri::Emitter;
use tauri::Manager;
use std::sync::atomic::{AtomicBool, Ordering};

const CLIENT_ID: &str = "Ov23li4TUvossSgVDa1A";
const SCOPE: &str = "repo,user,read:org,user:email";

pub struct AuthState {
    pub token: Mutex<Option<String>>,
    pub clone_cancel: Arc<AtomicBool>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DeviceCodeResponse {
    pub device_code: String,
    pub user_code: String,
    pub verification_uri: String,
    pub expires_in: u64,
    pub interval: u64,
}

#[derive(Serialize, Deserialize, Debug)]
struct PollResponse {
    access_token: Option<String>,
    error: Option<String>,
    error_description: Option<String>,
}

#[tauri::command]
fn get_auth_token(state: tauri::State<AuthState>) -> Option<String> {
    state.token.lock().unwrap().clone()
}

#[tauri::command]
fn logout(state: tauri::State<AuthState>, app: tauri::AppHandle) {
    let mut token = state.token.lock().unwrap();
    *token = None;
    if let Ok(store) = tauri_plugin_store::StoreBuilder::new(&app, "gitvalet.json").build() {
        let _ = store.delete("github_token");
        let _ = store.save();
    }
}

#[tauri::command]
async fn request_device_code() -> Result<DeviceCodeResponse, String> {
    let client = reqwest::Client::new();
    let body = format!("client_id={}&scope={}", CLIENT_ID, SCOPE);
    let res = client
        .post("https://github.com/login/device/code")
        .header("Accept", "application/json")
        .header("Content-Type", "application/x-www-form-urlencoded")
        .body(body)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json::<DeviceCodeResponse>()
        .await
        .map_err(|e| e.to_string())?;
    Ok(res)
}

#[tauri::command]
async fn poll_for_token(
    app: tauri::AppHandle,
    device_code: String,
    interval: u64,
) -> Result<String, String> {
    let client = reqwest::Client::new();
    loop {
        tokio::time::sleep(Duration::from_secs(interval)).await;
        let body = format!(
            "client_id={}&device_code={}&grant_type=urn:ietf:params:oauth:grant-type:device_code",
            CLIENT_ID, device_code
        );
        let res = client
            .post("https://github.com/login/oauth/access_token")
            .header("Accept", "application/json")
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(body)
            .send()
            .await
            .map_err(|e| e.to_string())?
            .json::<PollResponse>()
            .await
            .map_err(|e| e.to_string())?;
        match res.error.as_deref() {
            Some("authorization_pending") => continue,
            Some("slow_down") => {
                tokio::time::sleep(Duration::from_secs(5)).await;
                continue;
            }
            Some("access_denied") => return Err("Access denied by user".to_string()),
            Some("expired_token") => {
                return Err("Device code expired. Please try again.".to_string())
            }
            Some(e) => return Err(e.to_string()),
            None => {
                if let Some(token) = res.access_token {
                    let state = app.state::<AuthState>();
                    *state.token.lock().unwrap() = Some(token.clone());
                    if let Ok(store) =
                        tauri_plugin_store::StoreBuilder::new(&app, "gitvalet.json").build()
                    {
                        let _ = store.set("github_token", token.clone());
                        let _ = store.save();
                    }
                    app.emit("auth:success", token.clone()).unwrap();
                    return Ok(token);
                }
            }
        }
    }
}

#[tauri::command]
fn cancel_clone(state: tauri::State<AuthState>) {
    state.clone_cancel.store(true, Ordering::SeqCst);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .manage(AuthState {
            token: Mutex::new(None),
            clone_cancel: Arc::new(AtomicBool::new(false)),
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .setup(|app| {
            if let Ok(store) =
                tauri_plugin_store::StoreBuilder::new(app.handle(), "gitvalet.json").build()
            {
                if let Some(token) = store.get("github_token") {
                    if let Some(token_str) = token.as_str() {
                        let state = app.state::<AuthState>();
                        *state.token.lock().unwrap() = Some(token_str.to_string());
                    }
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // auth
            get_auth_token,
            logout,
            request_device_code,
            poll_for_token,
            cancel_clone,
            // repo
            git::is_git_repo,
            git::init_repo,
            git::clone_repo,
            // status & staging
            git::get_status,
            git::stage_file,
            git::stage_all,
            git::unstage_file,
            git::discard_changes,
            // diff
            git::get_diff,
            // commits
            git::commit,
            git::get_log,
            // branches
            git::get_branches,
            git::create_branch,
            git::switch_branch,
            git::delete_branch,
            // remote
            git::fetch,
            git::pull,
            git::push,
            git::add_remote,
            git::get_remotes,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
