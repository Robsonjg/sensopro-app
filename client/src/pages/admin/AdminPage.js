import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { BarChart3, FlaskConical, LogOut, Menu, X, Users, } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner"; // ← ADICIONAR ESTA LINHA
import ExperimentosList from "./ExperimentosList";
import ExperimentoDetail from "./ExperimentoDetail";
import DashboardView from "./DashboardView";
import AdminManagement from "./AdminManagement";
export default function AdminPage() {
    const [, setLocation] = useLocation();
    const [section, setSection] = useState("experimentos");
    const [selectedExpId, setSelectedExpId] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    // Usar o tRPC diretamente para admin (em vez do useAuth do Manus)
    const adminMeQuery = trpc.adminAuth.me.useQuery();
    const logoutMutation = trpc.adminAuth.logout.useMutation();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    // Verificar autenticação
    useEffect(() => {
        if (!adminMeQuery.isLoading && !adminMeQuery.data) {
            setLocation("/admin/login");
        }
    }, [adminMeQuery.data, adminMeQuery.isLoading, setLocation]);
    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await logoutMutation.mutateAsync();
            // Forçar redirecionamento para login
            window.location.href = "/admin/login";
        }
        catch (error) {
            console.error("Erro ao fazer logout:", error);
            toast.error("Erro ao fazer logout");
        }
        finally {
            setIsLoggingOut(false);
        }
    };
    const isLoading = adminMeQuery.isLoading || isLoggingOut;
    const admin = adminMeQuery.data;
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-background", children: _jsxs("div", { className: "flex flex-col items-center gap-3", children: [_jsx("div", { className: "w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" }), _jsx("span", { className: "text-sm text-muted-foreground", children: "Carregando\u2026" })] }) }));
    }
    if (!admin) {
        return null;
    }
    // Verificar se o admin tem permissão (todos os admins têm role "admin" na tabela admins)
    const isAdmin = true; // Já que veio da tabela admins, é admin por definição
    if (!isAdmin) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-background px-4", children: _jsxs("div", { className: "text-center animate-fade-in", children: [_jsx("div", { className: "w-14 h-14 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-6", children: _jsx(FlaskConical, { className: "w-7 h-7 text-destructive" }) }), _jsx("h1", { className: "text-xl font-semibold mb-2", children: "Acesso restrito" }), _jsx("p", { className: "text-muted-foreground text-sm mb-6", children: "Sua conta n\u00E3o possui permiss\u00E3o de administrador." }), _jsx(Button, { variant: "outline", onClick: handleLogout, className: "rounded-full", children: "Sair" })] }) }));
    }
    const navItems = [
        { id: "experimentos", label: "Experimentoss", icon: FlaskConical },
        { id: "dashboard", label: "Dashboard", icon: BarChart3 },
        { id: "admins", label: "Gerenciar Admins", icon: Users },
    ];
    return (_jsxs("div", { className: "min-h-screen flex bg-background", children: [sidebarOpen && (_jsx("div", { className: "fixed inset-0 bg-black/40 z-40 lg:hidden", onClick: () => setSidebarOpen(false) })), _jsxs("aside", { className: `fixed lg:sticky top-0 left-0 h-screen w-64 bg-sidebar text-sidebar-foreground flex flex-col z-50 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`, children: [_jsxs("div", { className: "flex items-center gap-2.5 px-6 h-16 border-b border-sidebar-border", children: [_jsx(FlaskConical, { className: "w-5 h-5 text-sidebar-primary" }), _jsx("span", { className: "font-semibold text-lg text-sidebar-foreground", style: { fontFamily: "'Playfair Display', serif" }, children: "SensoPro" }), _jsx("button", { className: "ml-auto lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground", onClick: () => setSidebarOpen(false), children: _jsx(X, { className: "w-4 h-4" }) })] }), _jsx("nav", { className: "flex-1 px-3 py-4 space-y-1", children: navItems.map(({ id, label, icon: Icon }) => (_jsxs("button", { onClick: () => {
                                setSection(id);
                                if (id !== "dashboard")
                                    setSelectedExpId(null);
                                setSidebarOpen(false);
                            }, className: `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${section === id
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"}`, children: [_jsx(Icon, { className: "w-4 h-4 flex-shrink-0" }), label] }, id))) }), _jsxs("div", { className: "px-4 py-4 border-t border-sidebar-border", children: [_jsxs("div", { className: "flex items-center gap-3 mb-3", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-xs font-semibold text-sidebar-primary", children: admin.nome?.[0]?.toUpperCase() ?? admin.email?.[0]?.toUpperCase() ?? "A" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-xs font-medium text-sidebar-foreground truncate", children: admin.nome || admin.email }), _jsx("p", { className: "text-xs text-sidebar-foreground/50 truncate", children: admin.email })] })] }), _jsxs("button", { onClick: handleLogout, className: "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all", children: [_jsx(LogOut, { className: "w-3.5 h-3.5" }), "Sair"] })] })] }), _jsxs("div", { className: "flex-1 flex flex-col min-w-0", children: [_jsxs("header", { className: "lg:hidden flex items-center gap-3 px-4 h-14 border-b border-border bg-white sticky top-0 z-30", children: [_jsx("button", { onClick: () => setSidebarOpen(true), className: "text-muted-foreground", children: _jsx(Menu, { className: "w-5 h-5" }) }), _jsx(FlaskConical, { className: "w-4 h-4 text-primary" }), _jsx("span", { className: "font-semibold text-sm", children: "SensoPro" })] }), _jsxs("main", { className: "flex-1 p-6 lg:p-8 overflow-auto", children: [section === "experimentos" && !selectedExpId && (_jsx(ExperimentosList, { onSelect: (id) => {
                                    setSelectedExpId(id);
                                }, onDashboard: (id) => {
                                    setSelectedExpId(id);
                                    setSection("dashboard");
                                } })), section === "experimentos" && selectedExpId && (_jsx(ExperimentoDetail, { experimentoId: selectedExpId, onBack: () => setSelectedExpId(null) })), section === "dashboard" && (_jsx(DashboardView, { experimentoId: selectedExpId, onSelectExp: (id) => setSelectedExpId(id) })), section === "admins" && (_jsx(AdminManagement, {}))] })] })] }));
}
