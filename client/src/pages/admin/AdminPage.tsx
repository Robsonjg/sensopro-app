import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Users,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { toast } from "sonner";  // ← ADICIONAR ESTA LINHA
import ExperimentosList from "./ExperimentosList";
import ExperimentoDetail from "./ExperimentoDetail";
import DashboardView from "./DashboardView";
import AdminManagement from "./AdminManagement";

type Section = "experimentos" | "dashboard" | "admins";

export default function AdminPage() {
  const [, setLocation] = useLocation();
  const [section, setSection] = useState<Section>("experimentos");
  const [selectedExpId, setSelectedExpId] = useState<number | null>(null);
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
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast.error("Erro ao fazer logout");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isLoading = adminMeQuery.isLoading || isLoggingOut;
  const admin = adminMeQuery.data;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Carregando…</span>
        </div>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  // Verificar se o admin tem permissão (todos os admins têm role "admin" na tabela admins)
  const isAdmin = true; // Já que veio da tabela admins, é admin por definição

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center animate-fade-in">
          <div className="w-14 h-14 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FlaskConical className="w-7 h-7 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Acesso restrito</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Sua conta não possui permissão de administrador.
          </p>
          <Button variant="outline" onClick={handleLogout} className="rounded-full">
            Sair
          </Button>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: "experimentos" as Section, label: "Experimentoss", icon: FlaskConical },
    { id: "dashboard" as Section, label: "Dashboard", icon: BarChart3 },
    { id: "admins" as Section, label: "Gerenciar Admins", icon: Users },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-sidebar text-sidebar-foreground flex flex-col z-50 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-6 h-16 border-b border-sidebar-border">
          <FlaskConical className="w-5 h-5 text-sidebar-primary" />
          <span
            className="font-semibold text-lg text-sidebar-foreground"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            SensoPro
          </span>
          <button
            className="ml-auto lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setSection(id);
                if (id !== "dashboard") setSelectedExpId(null);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                section === id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-xs font-semibold text-sidebar-primary">
              {admin.nome?.[0]?.toUpperCase() ?? admin.email?.[0]?.toUpperCase() ?? "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">{admin.nome || admin.email}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">{admin.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar mobile */}
        <header className="lg:hidden flex items-center gap-3 px-4 h-14 border-b border-border bg-white sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="text-muted-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <FlaskConical className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">SensoPro</span>
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {section === "experimentos" && !selectedExpId && (
            <ExperimentosList
              onSelect={(id) => {
                setSelectedExpId(id);
              }}
              onDashboard={(id) => {
                setSelectedExpId(id);
                setSection("dashboard");
              }}
            />
          )}
          {section === "experimentos" && selectedExpId && (
            <ExperimentoDetail
              experimento_id={selectedExpId}
              onBack={() => setSelectedExpId(null)}
            />
          )}
          {section === "dashboard" && (
            <DashboardView
              experimento_id={selectedExpId}
              onSelectExp={(id) => setSelectedExpId(id)}
            />
          )}
          {section === "admins" && (
            <AdminManagement />
          )}
        </main>
      </div>
    </div>
  );
}