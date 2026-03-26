import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import AdminPage from "./pages/AdminPage";
import StorefrontPage from "./pages/StorefrontPage";

const queryClient = new QueryClient();

export default function App() {
  const path = window.location.pathname;
  const [currentPath, setCurrentPath] = useState(path);

  const navigate = (to: string) => {
    window.history.pushState({}, "", to);
    setCurrentPath(to);
  };

  return (
    <QueryClientProvider client={queryClient}>
      {currentPath.startsWith("/admin") ? (
        <AdminPage navigate={navigate} />
      ) : (
        <StorefrontPage navigate={navigate} />
      )}
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}
