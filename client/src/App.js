import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Route, Switch } from "wouter";
import HomePage from "./pages/public/HomePage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminPage from "./pages/admin/AdminPage";
import NotFound from "./pages/NotFound";
import AvaliacaoPage from "./pages/public/AvaliacaoPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "./lib/trpc";
const queryClient = new QueryClient();
function App() {
    return (_jsx(trpc.Provider, { client: trpcClient, queryClient: queryClient, children: _jsx(QueryClientProvider, { client: queryClient, children: _jsxs(Switch, { children: [_jsx(Route, { path: "/", component: HomePage }), _jsx(Route, { path: "/admin/login", component: AdminLoginPage }), _jsx(Route, { path: "/admin", component: AdminPage }), _jsx(Route, { path: "/avaliacao/:slug", component: AvaliacaoPage }), _jsx(Route, { component: NotFound })] }) }) }));
}
export default App;
