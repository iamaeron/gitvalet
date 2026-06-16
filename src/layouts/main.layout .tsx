import { useAuth } from "@/hooks/use-auth";
import { useRepositoryStore } from "@/stores/repository.stores";
import { Select } from "@base-ui/react";
import logo from "@/assets/gitvalet-dark.svg";
import {
  Book1Outlined,
  ChevronDownOutlined,
  ChevronDownSolid,
  Folder1Bulk,
  Folder1Duotone,
  HourglassBulk,
  HourglassOutlined,
  MonitorCodeBulk,
  MonitorCodeOutlined,
  RefreshCircle1ClockwiseOutlined,
} from "@lineiconshq/free-icons";
import Lineicons from "@lineiconshq/react-lineicons";
import {
  Book2Line,
  DownLine,
  GitBranch2Line,
  GitBranchLine,
  LineFill,
  LineLine,
} from "@mingcute/react";
import Button from "@/ui/button";

const MainLayout = () => {
  const { user } = useAuth();
  const selectedRepo = useRepositoryStore((state) => state.selectedRepo);

  return (
    <div className="min-h-screen dark:bg-[#171311] dark:text-stone-400 text-sm">
      <div className="h-13 px-5 flex items-center">
        <div className="flex-1">
          <div className="flex items-center gap-6">
            <div className="bg-orange-500 rounded-lg overflow-hidden w-max">
              <img src={logo} className="w-8 h-8" />
            </div>
            <div className="space-x-2 flex items-center font-medium">
              <Lineicons
                icon={Folder1Bulk}
                size={20}
                className="dark:text-stone-500!"
              />
              <span className="dark:text-stone-200">{selectedRepo?.name}</span>
            </div>
          </div>
        </div>
        <div className="flex-2 flex justify-center items-center">
          <button className="px-2.5 py-1 rounded-lg dark:hover:bg-stone-800/50">
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5 items-center">
                <GitBranchLine size={18} className="dark:text-stone-500!" />
                <p className="font-medium dark:text-stone-400">
                  {selectedRepo?.currentBranch}
                </p>
              </div>
              <DownLine size={18} className="ml-2 dark:text-stone-500" />
            </div>
          </button>
        </div>
        <div className="flex-1 flex justify-end items-center">
          <Button className="px-2.5 py-1">
            <span>Fetch</span>
            <Lineicons
              icon={RefreshCircle1ClockwiseOutlined}
              size={18}
              className="dark:text-stone-500!"
            />
          </Button>
        </div>
      </div>
      <div className="flex h-[calc(100vh-52px)]">
        <aside className="flex flex-col items-center p-4 pt-0">
          <hr className="mt-2 mb-4 border-dashed dark:border-stone-800 border-t w-full" />
          <div className="flex-1 flex flex-col items-center gap-1">
            <button className="p-1.5 border dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-500! rounded-lg">
              <Lineicons icon={MonitorCodeOutlined} size={24} />
            </button>

            <button className="p-1.5 dark:hover:bg-stone-800/50 border border-transparent rounded-lg">
              <Lineicons
                icon={HourglassOutlined}
                size={24}
                className="dark:text-stone-500!"
              />
            </button>
          </div>
          <img
            src={user?.avatar_url}
            alt=""
            className="w-8 h-8 rounded-full object-fit"
          />
        </aside>

        <div className="w-70 flex h-full pb-2">
          <div className="flex-1 p-2 max-h-full rounded-lg border dark:bg-stone-900 dark:border-stone-700/40">
            <header className="px-1">
              <p>Changes</p>
            </header>
          </div>
        </div>

        <div className="flex-1 h-full flex p-2 pt-0">
          <div className="flex-1 p-2 max-h-full rounded-lg border dark:bg-stone-900/80 dark:border-stone-700/30 overflow-y-auto"></div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
