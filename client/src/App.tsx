import { Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "./lib/trpc";

import HomePage from "./pages/public/HomePage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminPage from "./pages/admin/AdminPage";
import AvaliacaoPage from "./pages/public/AvaliacaoPage";
import NotFound from "./pages/NotFound";

/* 🔥 IMPORTANTE: fora do componente */
const queryClient = new QueryClient();

function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/admin/login" component={AdminLoginPage} />
          <Route path="/admin" component={AdminPage} />
          <Route path="/avaliacao/:slug" component={AvaliacaoPage} />
          <Route component={NotFound} />
        </Switch>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;