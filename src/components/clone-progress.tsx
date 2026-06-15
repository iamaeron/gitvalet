import { useCloneProgress } from "@/hooks/use-clone-progress";
import Button from "@/ui/button";

const CloneProgress = ({ path }: { path: string }) => {
  const { progress, cancel } = useCloneProgress();

  return (
    <>
      {progress && (
        <div className="mt-4 rounded-lg border-orange-500/30 will-change-transform flex flex-col gap-1">
          <div className="p-4 dark:bg-stone-500/10 rounded-lg rounded-b-sm flex items-start justify-between">
            <div className="flex flex-col items-start justify-start">
              <span className="text-sm mb-1 font-semibold dark:text-stone-200">
                Saving to
              </span>
              <span className="text-xs block dark:text-stone-400 font-medium">
                {path}
              </span>
            </div>
            <Button
              onClick={cancel}
              className="text-xs text-rose-400! px-2 py-1 rounded-md"
            >
              Cancel
            </Button>
          </div>
          <div className="p-2 rounded-sm bg-orange-500/10">
            <div className="w-full dark:bg-orange-500/20 rounded-full h-1.75">
              <div
                className="bg-orange-500 shadow-[inset_0_1px_0_0_var(--color-orange-400),0_0_8px_0_var(--color-orange-600)] h-1.75 rounded-full transition-all duration-150"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
          <div className="dark:bg-stone-500/10 py-2 px-4 flex items-baseline rounded-lg rounded-t-sm font-medium dark:text-stone-400 justify-between text-xs">
            <span>
              {progress.phase === "receiving"
                ? `Receiving objects... ${progress.received}/${progress.total}`
                : `Checking out files... ${progress.percent}%`}
            </span>
            <span>{(progress.bytes / 1024 / 1024).toFixed(1)} MB received</span>
          </div>
        </div>
      )}
    </>
  );
};

export default CloneProgress;
