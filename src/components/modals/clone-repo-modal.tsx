import { Dialog, Field, ScrollArea } from "@base-ui/react";
import { cx } from "@/lib/cx";
import { pickFolder } from "@/lib/pick-folder";
import { cloneRepo, getRepoNameFromURL } from "@/lib/git";
import Button from "@/ui/button";
import {
  ArrowRightLine,
  CloseLine,
  GitBranchLine,
  Link3Line,
  Text2Line,
} from "@mingcute/react";
import { useRef, useState } from "react";
import Lineicons from "@lineiconshq/react-lineicons";
import { Folder1Bulk } from "@lineiconshq/free-icons";
import CloneProgress from "../clone-progress";
import { useCloneProgress } from "@/hooks/use-clone-progress";
import { useAuth } from "@/hooks/use-auth";
import { useRepositoryStore } from "@/stores/repository.stores";

const CloneRepoModal = () => {
  const [opened, setOpened] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [repositoryURL, setRepositoryURL] = useState<string>("");
  const [folderName, setfolderName] = useState<string>("");
  const { progress } = useCloneProgress();
  const { token } = useAuth();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const addRepository = useRepositoryStore((state) => state.addRepository);
  const setSelectedRepo = useRepositoryStore((state) => state.setSelectedRepo);

  const handleCloneRepo = async () => {
    const path = `${selectedFolder}/${folderName}`;

    scrollRef?.current?.scrollIntoView({ behavior: "smooth" });
    const res = await cloneRepo(repositoryURL, path, token || undefined);

    if ((res as string).includes("Cloned")) {
      await addRepository(path);
      await setSelectedRepo(path);
      setOpened(false);
    }
  };

  return (
    <Dialog.Root open={opened} onOpenChange={setOpened}>
      <Dialog.Trigger
        render={(triggerProps) => (
          <Button {...triggerProps} className="w-full justify-start">
            <GitBranchLine
              size={18}
              className="dark:group-hover/button:text-orange-500! transition dark:text-stone-500!"
            />
            <span>Clone via repository URL</span>
            <ArrowRightLine
              size={18}
              className="ml-auto dark:group-hover/button:opacity-100 opacity-0 transition dark:text-stone-500!"
            />
          </Button>
        )}
      />

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 min-h-dvh bg-black opacity-20 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 dark:opacity-50 supports-[-webkit-touch-callout:none]:absolute" />

        <Dialog.Popup className="fixed inset-0 m-auto flex h-fit max-h-[90vh] w-120 max-w-[calc(100vw-3rem)] flex-col bg-white dark:bg-stone-900 text-neutral-950 dark:text-white border border-neutral-950 dark:border-stone-800 rounded-xl shadow-[0.25rem_0.25rem_0] shadow-black/12 dark:shadow-none transition-[scale,opacity] duration-100 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0">
          <header className="flex items-center justify-between shadow-lg border-b dark:border-stone-800 px-4 py-3 shrink-0">
            <Dialog.Title className="text-[15px] font-semibold">
              Clone Repository
            </Dialog.Title>
            <Dialog.Close className="dark:text-stone-500 p-0.5 rounded-md dark:hover:text-stone-400 active:translate-y-px will-change-transform transition-all dark:hover:bg-stone-800">
              <CloseLine size={18} />
            </Dialog.Close>
          </header>

          <ScrollArea.Root className="w-full">
            <ScrollArea.Viewport className="w-full max-h-[calc(90vh-50px)] overflow-y-auto">
              <ScrollArea.Content>
                <main className="p-4">
                  <div className="flex flex-col gap-1">
                    <h1 className="my-2 text-sm font-semibold dark:text-stone-200">
                      Repository
                    </h1>
                    <Field.Root>
                      <Field.Label className="block text-sm dark:text-stone-400 font-medium mb-1.5">
                        URL
                      </Field.Label>
                      <Field.Control
                        placeholder="https://github.com/iamaeron/gitvalet"
                        value={repositoryURL}
                        onValueChange={(value) => {
                          setRepositoryURL(value);
                          setfolderName(getRepoNameFromURL(value));
                        }}
                        render={(props) => (
                          <div className="dark:bg-stone-950/10 w-full will-change-transform flex items-center pl-2.5 border transition-all dark:border-stone-700/50 dark:hover:border-stone-700 rounded-lg text-sm outline-2 -outline-offset-1 dark:outline-transparent dark:focus-within:outline-orange-500">
                            <Link3Line
                              size={18}
                              className="dark:text-stone-500!"
                            />
                            <input
                              {...props}
                              className="px-2.5 py-1.5 w-full outline-none dark:text-stone-400 dark:focus:text-stone-200 transition-all dark:placeholder:text-stone-700"
                            />
                          </div>
                        )}
                      />
                    </Field.Root>

                    <hr className="my-4 border-t border-dashed dark:border-stone-800" />
                    <h1 className="mb-2 text-sm font-semibold dark:text-stone-200">
                      Project Details
                    </h1>

                    <Field.Root>
                      <Field.Label className="block text-sm dark:text-stone-400 font-medium mb-1.5">
                        Name
                      </Field.Label>
                      <Field.Control
                        placeholder="GitValet"
                        render={(props) => (
                          <div className="dark:bg-stone-950/10 w-full will-change-transform flex items-center pl-2.5 border transition-all dark:border-stone-700/50 dark:hover:border-stone-700 rounded-lg text-sm outline-2 -outline-offset-1 dark:outline-transparent dark:focus-within:outline-orange-500">
                            <Text2Line
                              size={18}
                              className="dark:text-stone-500!"
                            />
                            <input
                              {...props}
                              disabled={!repositoryURL}
                              value={folderName}
                              onChange={(e) => setfolderName(e.target.value)}
                              className="px-2.5 py-1.5 w-full outline-none dark:text-stone-400 dark:focus:text-stone-200 transition-all dark:placeholder:text-stone-700"
                            />
                          </div>
                        )}
                      />
                    </Field.Root>

                    <Field.Root className="mt-2">
                      <Field.Label className="block text-sm dark:text-stone-400 font-medium mb-1.5">
                        Clone at
                      </Field.Label>
                      <Field.Control
                        render={() => (
                          <button
                            onClick={() =>
                              pickFolder((selectedDirectory) =>
                                setSelectedFolder(selectedDirectory),
                              )
                            }
                            className="dark:bg-stone-950/10 px-2.5 gap-2.5 pr-1 py-1 w-full will-change-transform flex items-center pl-2.5 border transition-all dark:border-stone-700/50 dark:hover:border-stone-700 rounded-lg text-sm outline-2 -outline-offset-1 dark:outline-transparent dark:focus:outline-orange-500"
                          >
                            <Lineicons
                              icon={Folder1Bulk}
                              size={18}
                              className="dark:text-stone-500!"
                            />
                            <p
                              className={cx(
                                "flex-1 text-left",
                                selectedFolder
                                  ? "dark:text-stone-400"
                                  : "dark:text-stone-700",
                              )}
                            >
                              {selectedFolder
                                ? selectedFolder
                                : "No selected folder"}
                            </p>
                            <span className="gap-2 dark:hover:border-stone-600/70 rounded-md text-xs px-2 py-0.75 border dark:border-stone-700/50 dark:text-stone-400 dark:bg-stone-800/30 items-center flex">
                              <span>Choose</span>
                            </span>
                          </button>
                        )}
                      />
                    </Field.Root>
                  </div>

                  <CloneProgress path={selectedFolder ?? ""} />
                  <div ref={scrollRef}></div>

                  <div className="mt-6 flex justify-end gap-2">
                    <Dialog.Close
                      render={(closeProps) => (
                        <Button {...closeProps}>Cancel</Button>
                      )}
                    />
                    <Button
                      onClick={handleCloneRepo}
                      loading={progress !== null}
                      disabled={!selectedFolder || !repositoryURL}
                      variant="filled"
                    >
                      Clone Repository
                    </Button>
                  </div>
                </main>
              </ScrollArea.Content>
            </ScrollArea.Viewport>

            <ScrollArea.Scrollbar
              orientation="vertical"
              className="flex select-none touch-none p-0.5 bg-transparent w-2"
            >
              <ScrollArea.Thumb className="flex-1 bg-stone-300 dark:bg-stone-700 rounded-full relative" />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default CloneRepoModal;
