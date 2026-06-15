import { useEffect } from "react";
import { useAuth } from "./hooks/use-auth";
import AppLayout from "./layouts/app.layout";
import EditInfo from "./views/onboarding/edit-info";
import WelcomePage from "./views/onboarding/welcome";
import { useRepositoryStore } from "./stores/repository.stores";

function App() {
  const { user, status } = useAuth();
  const commitEmail = useRepositoryStore((state) => state.commitEmail);
  const commitName = useRepositoryStore((state) => state.commitName);
  const loadDetails = useRepositoryStore((state) => state.loadDetails);
  const isLoading = useRepositoryStore((state) => state.isLoading);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  if (status === "loading" || isLoading) {
    return (
      <main className="min-h-screen flex justify-center items-center dark:bg-stone-900 dark:text-stone-400 text-sm">
        Loading your space...
      </main>
    );
  }

  if (!user) {
    return <WelcomePage />;
  }

  if (user && !commitEmail && !commitName) {
    return <EditInfo />;
  }

  return <AppLayout />;
}

export default App;
