import { BranchInfo, getBranches } from "@/lib/git";
import { useEffect, useState } from "react";
import logoDark from "@/assets/gitvalet-dark.svg";
import { Select } from "@base-ui/react";
import Lineicons from "@lineiconshq/react-lineicons";
import { ChevronDownSolid } from "@lineiconshq/free-icons";
import { ArrowRightLine, CheckLine } from "@mingcute/react";
import Button from "@/ui/button";
import { useRepositoryStore } from "@/stores/repository.stores";

const SelectDefaultBranch = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [branchesList, setBranchesList] = useState<BranchInfo[]>([]);
  const [branch, setBranch] = useState<string | null>(null);
  const selectedRepo = useRepositoryStore((state) => state.selectedRepo);
  const changeBranch = useRepositoryStore((state) => state.changeBranch);

  useEffect(() => {
    const fetchBranches = async () => {
      if (selectedRepo) {
        try {
          const branches = await getBranches(selectedRepo.path);
          const isCurrent = branches.find((b) => b.is_current);

          setBranch(isCurrent?.name ?? "main");
          setBranchesList(branches);
        } catch (e) {
          console.log(e);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchBranches();
  }, []);

  const handleSaveBranch = async () => {
    if (!branch) return;

    await changeBranch(branch);
  };

  return (
    <div className="h-screen p-4 dark:bg-stone-900 dark:text-stone-100">
      <div className="px-20 max-w-2xl w-full mx-auto h-full flex-1 flex flex-col justify-center">
        <div className="">
          {/* <img src={logo} alt="" className="w-30 h-30" /> */}

          <div className="bg-orange-500 rounded-xl overflow-hidden w-max">
            <img src={logoDark} className="w-14 h-14" />
          </div>
          <div className="flex items-center text-5xl mt-4 mb-2 dark:text-orange-400 serif">
            {/* Welcome,
            <img
              src={user?.avatar_url}
              alt={user?.name}
              className="ml-3 mr-1 w-9 h-9 rounded-full object-fit"
            />
            <i>{user?.name}</i>. */}
            Choose your branch.
          </div>
          <p className="text-sm max-w-[45ch] dark:text-stone-400">
            Lastly, please choose the branch that you're currently working on
            this repository.
          </p>

          <div className="w-full">
            <hr className="my-6 border-t border-dashed dark:border-stone-800" />

            {/* <Field.Root className="mb-4">
              <Field.Label className="block text-sm dark:text-stone-400 font-medium mb-1.5">
                Name
              </Field.Label>
              <Field.Control
                placeholder="https://github.com/iamaeron/gitvalet"
                value={name}
                onValueChange={setName}
                render={(props) => (
                  <div className="dark:bg-stone-950/10 w-full will-change-transform flex items-center border transition-all dark:border-stone-700/50 dark:hover:border-stone-700 rounded-lg text-sm outline-2 -outline-offset-1 dark:outline-transparent dark:focus-within:outline-orange-500">
     
                    <input
                      {...props}
                      className="px-3 py-1.5 w-full outline-none dark:text-stone-400 dark:focus:text-stone-200 transition-all dark:placeholder:text-stone-700"
                    />
                  </div>
                )}
              />
            </Field.Root> */}

            {isLoading ? (
              <>
                <div className="h-5 mb-2 w-10 dark:bg-stone-600/30 rounded-md"></div>
                <div className="h-8.5 w-full dark:bg-stone-600/30 rounded-md"></div>
              </>
            ) : (
              <Select.Root value={branch} onValueChange={setBranch}>
                <Select.Label className="block text-sm dark:text-stone-400 font-medium mb-1.5">
                  Branch
                </Select.Label>
                <Select.Trigger className="group/button will-change-transform select-none relative rounded-lg text-sm border font-medium active:translate-y-px px-3 py-1.5 w-full dark:border-stone-700/50 flex outline-2 outline-transparent -outline-offset-1 focus:outline-orange-500 justify-between items-center dark:text-stone-400 dark:bg-stone-800/30 dark:hover:border-stone-600/70">
                  <Select.Value>{branch}</Select.Value>
                  <Lineicons
                    icon={ChevronDownSolid}
                    size={18}
                    className="dark:text-stone-500"
                  />
                </Select.Trigger>

                <Select.Portal>
                  <Select.Positioner
                    align="start"
                    alignItemWithTrigger={false}
                    sideOffset={4}
                  >
                    <Select.Popup className="min-w-(--anchor-width) dark:bg-stone-800 dark:border-stone-700/50 border border-transparent rounded-lg p-1 transition-[scale,opacity] duration-100 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0">
                      <Select.Arrow />
                      {branchesList.map((e) => (
                        <Select.Item
                          className="flex cursor-pointer dark:hover:text-stone-200 items-center p-2 text-sm font-medium dark:text-stone-400 dark:hover:bg-stone-700/30 rounded-md justify-between py-1 outline-2 outline-transparent focus-visible:outline-orange-500 group"
                          key={e.name}
                          value={e.name}
                        >
                          <Select.ItemText className="flex items-center gap-2">
                            {e.name}
                          </Select.ItemText>
                          <Select.ItemIndicator>
                            <CheckLine
                              size={18}
                              className="dark:text-stone-500!"
                            />
                          </Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.Popup>
                  </Select.Positioner>
                </Select.Portal>
              </Select.Root>
            )}

            <div className="flex mt-10 justify-end">
              <Button
                disabled={!branch}
                onClick={handleSaveBranch}
                // loading={isl}
                variant="filled"
              >
                <span>Save & Continue</span>
                <ArrowRightLine size={18} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectDefaultBranch;
