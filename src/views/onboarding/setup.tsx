import { ArrowRightLine } from "@mingcute/react";
import logo from "@/assets/gitvalet-dark.svg";
import Button from "@/ui/button";

import { Lineicons } from "@lineiconshq/react-lineicons";
import { Folder1Bulk, PlusSolid } from "@lineiconshq/free-icons";
import CloneRepoModal from "@/components/modals/clone-repo-modal";

const SetupPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-8 flex flex-col items-start max-w-lg mx-auto w-full">
        <div className="bg-orange-500 rounded-xl overflow-hidden w-max">
          <img src={logo} className="w-14 h-14" />
        </div>
        <h1 className="serif dark:text-orange-400 text-4xl mt-4">
          Let's get you set up.
        </h1>
        <p className="mt-2 max-w-[40ch]">
          Choose your starter working directory and verify your Git
          configurations to get started.
        </p>

        <div className="w-full">
          <hr className="my-6 border-t border-dashed dark:border-stone-800" />
          <div className="space-y-2">
            <Button className="justify-start w-full">
              <Lineicons
                icon={Folder1Bulk}
                size={18}
                className="dark:group-hover/button:text-orange-500! transition dark:text-stone-500!"
              />
              <span>Import a local repository</span>

              <ArrowRightLine
                size={18}
                className="ml-auto dark:group-hover/button:opacity-100 opacity-0 transition dark:text-stone-500!"
              />
            </Button>

            <CloneRepoModal />

            <div className="border-t dark:border-stone-800 my-8 relative">
              <div className="h-4 absolute left-0 top-1/2 -translate-y-1/2 w-30 bg-linear-to-r dark:from-stone-900 to-transparent"></div>
              <span className="dark:bg-stone-900 px-2 absolute top-1/2 left-1/2 -translate-1/2 uppercase dark:text-stone-600">
                Or
              </span>
              <div className="h-4 absolute right-0 top-1/2 -translate-y-1/2 w-30 bg-linear-to-r dark:to-stone-900 from-transparent"></div>
            </div>

            <Button className="justify-start w-full">
              <Lineicons
                icon={PlusSolid}
                size={18}
                className="dark:group-hover/button:text-orange-500! transition dark:text-stone-500!"
              />
              <span>Initialize a new repository</span>

              <ArrowRightLine
                size={18}
                className="ml-auto dark:group-hover/button:opacity-100 opacity-0 transition dark:text-stone-500!"
              />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupPage;
