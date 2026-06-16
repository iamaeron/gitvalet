import SetupPage from "@/views/onboarding/setup";
import { useRepositoryStore } from "@/stores/repository.stores";
import SelectDefaultBranch from "@/views/select-default-branch";
import MainLayout from "./main.layout ";

const AppLayout = () => {
  const repos = useRepositoryStore((state) => state.repos);
  const selectedRepo = useRepositoryStore((state) => state.selectedRepo);

  if (repos.length <= 0) {
    return (
      <main className="min-h-screen dark:bg-stone-900 dark:text-stone-400 text-sm">
        <SetupPage />
      </main>
    );
  }

  return selectedRepo && !selectedRepo.pickedBranch ? (
    <main className="min-h-screen dark:bg-stone-900 dark:text-stone-400 text-sm">
      <SelectDefaultBranch />
    </main>
  ) : (
    <MainLayout />
  );
};

export default AppLayout;
