import { CheckLine, Copy2Line, GithubLine } from "@mingcute/react";
import { useAuth } from "@/hooks/use-auth";
import logo from "@/assets/gitvalet-transparent.svg";
import logoDark from "@/assets/gitvalet-dark.svg";
import { open } from "@tauri-apps/plugin-shell";
import Button from "@/ui/button";

const WelcomePage = () => {
  const { login, deviceCode, status, error } = useAuth();

  const isPolling = deviceCode && status === "polling";

  return (
    <div className="flex h-screen p-4 dark:bg-stone-900 dark:text-stone-100">
      <div className="flex items-center w-max mx-auto h-full">
        <div className="max-w-xl w-full">
          <div className="px-20 h-full flex flex-col justify-center">
            <div className="flex items-center">
              <img src={logo} alt="" className="w-14 h-14" />
              <h1 className="text-5xl dark:text-orange-400 serif">GitValet</h1>
            </div>
            <p className="mt-2 dark:text-stone-500">
              Experience a refined approach to code management.
            </p>
            <hr className="border-dashed my-6 dark:border-stone-800" />
            <Button
              onClick={login}
              disabled={isPolling ?? false}
              className="w-full"
            >
              <GithubLine size={20} className="text-stone-500!" />
              <span>
                {isPolling
                  ? "Waiting for authorization ..."
                  : "Sign in with GitHub"}
              </span>
            </Button>

            {status === "error" ? (
              <div className="text-center mt-6 text-xs dark:text-red-400">
                {error}
              </div>
            ) : null}

            <div>
              {isPolling ? (
                // <div className="flex flex-col gap-2 p-4 border dark:border-stone-800 dark:bg-stone-800/30 mt-6 rounded-lg">
                <div className="flex flex-col mt-6 border-t border-dashed dark:border-stone-800 pt-4 pl-2">
                  <p className="font-medium text-sm mb-2">
                    Signing in with GitHub
                  </p>
                  <div className="pl-2">
                    <div className="pb-6 border-l dark:border-stone-800">
                      <div className="flex -ml-4 gap-3 items-center">
                        <div className="dark:text-stone-400 border-4 dark:border-stone-900 dark:bg-stone-800 text-xs font-medium w-7.5 h-7.5 flex justify-center items-center rounded-full">
                          1
                        </div>
                        <p className="text-sm dark:text-stone-400">
                          Copy the code:
                        </p>
                      </div>
                      <div className="pl-7 mt-2">
                        <div className="border rounded-xl p-2 px-4 dark:border-stone-800 w-max flex items-center gap-4">
                          <div className="text-3xl font-bold text-orange-400 tracking-wide">
                            {deviceCode.user_code}
                          </div>

                          <Button className="px-2.5 py-1 text-xs">
                            <Copy2Line
                              size={14}
                              className="dark:text-stone-500!"
                            />
                            <span>Copy</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="pb-6 border-l dark:border-stone-800">
                      <div className="flex -ml-4 gap-3 items-center">
                        <div className="dark:text-stone-400 border-4 dark:border-stone-900 dark:bg-stone-800 text-xs font-medium w-7.5 h-7.5 flex justify-center items-center rounded-full">
                          2
                        </div>

                        <p className="text-sm dark:text-stone-400">
                          Open this URL in your browser and enter the code:
                        </p>
                      </div>
                      <div className="pl-7 mt-2">
                        <div className="border rounded-xl py-2 px-4 dark:border-stone-800 w-max flex items-center gap-4">
                          <button
                            className="text-blue-400 underline text-sm cursor-pointer dark:hover:text-blue-500"
                            onClick={() => open(deviceCode.verification_uri)}
                          >
                            {deviceCode.verification_uri}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex -ml-4 gap-3 items-center">
                        <div className="dark:text-stone-400 border-4 dark:border-stone-900 dark:bg-emerald-500/10 text-xs font-medium w-7.5 h-7.5 flex justify-center items-center rounded-full">
                          <CheckLine
                            size={14}
                            className="dark:text-emerald-400!"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <div className="w-100 max-h-150 flex flex-col items-center justify-center border bg-orange-500 border-orange-400/20 rounded-2xl shadow-orange-500/5 shadow-2xl h-full">
          <img src={logoDark} alt="" className="w-60 h-60" />
          {/* <h1 className="text-4xl mt-10 dark:text-stone-900 italic serif">
            
          </h1> */}
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
