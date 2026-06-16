import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Loader2, Shield, Plus, Trash2, Lock } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
export default function AdminManagement() {
    const adminMeQuery = trpc.adminAuth.me.useQuery();
    const isEmailPasswordAdmin = !!adminMeQuery.data?.email;
    // Só carregar lista de admins se for admin email/senha
    const { data: admins, isLoading, refetch } = trpc.adminAuth.list.useQuery(undefined, {
        enabled: isEmailPasswordAdmin,
    });
    const promoteByEmailMut = trpc.adminAuth.promoteByEmail.useMutation();
    const deactivateByEmailMut = trpc.adminAuth.deactivateByEmail.useMutation();
    const [emailInput, setEmailInput] = useState("");
    const [promotingEmail, setPromotingEmail] = useState(null);
    const [deactivatingEmail, setDeactivatingEmail] = useState(null);
    async function handlePromoteByEmail() {
        if (!emailInput.trim()) {
            toast.error("Digite um email válido");
            return;
        }
        setPromotingEmail(emailInput);
        try {
            await promoteByEmailMut.mutateAsync({ email: emailInput });
            toast.success("Admin ativado com sucesso");
            setEmailInput("");
            refetch();
        }
        catch (error) {
            if (error.message?.includes("nao encontrado")) {
                toast.error("Admin não encontrado. Ele precisa se registrar primeiro.");
            }
            else {
                toast.error("Erro ao ativar admin");
            }
            console.error(error);
        }
        finally {
            setPromotingEmail(null);
        }
    }
    async function handleDeactivateByEmail(email) {
        // Impedir que o admin desative a si mesmo
        if (email === adminMeQuery.data?.email) {
            toast.error("Você não pode desativar sua própria conta");
            return;
        }
        // Confirmar antes de desativar
        if (!confirm(`Tem certeza que deseja desativar ${email}? Ele não conseguirá fazer login.`)) {
            return;
        }
        setDeactivatingEmail(email);
        try {
            await deactivateByEmailMut.mutateAsync({ email });
            toast.success("Admin desativado com sucesso");
            refetch();
        }
        catch (error) {
            toast.error("Erro ao desativar admin");
            console.error(error);
        }
        finally {
            setDeactivatingEmail(null);
        }
    }
    // Se for admin Manus OAuth, mostrar mensagem diferente
    if (!isEmailPasswordAdmin) {
        return (_jsxs("div", { className: "space-y-6 p-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-semibold text-foreground mb-2", children: "Gerenciar Admins" }), _jsx("p", { className: "text-muted-foreground", children: "Controle quem tem acesso ao painel administrativo" })] }), _jsxs(Card, { className: "border-border/60 bg-blue-50/50", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Lock, { className: "w-5 h-5 text-primary" }), "Acesso via Manus OAuth"] }) }), _jsxs(CardContent, { className: "text-sm text-muted-foreground space-y-3", children: [_jsxs("p", { children: ["Voc\u00EA est\u00E1 autenticado via ", _jsx("strong", { children: "Manus OAuth" }), ". O gerenciamento de admins est\u00E1 dispon\u00EDvel apenas para admins registrados com email/senha."] }), _jsx("p", { children: "Para compartilhar acesso com outra pessoa:" }), _jsxs("ol", { className: "list-decimal list-inside space-y-2 ml-2", children: [_jsxs("li", { children: ["Compartilhe o link de registro: ", _jsxs("strong", { className: "text-foreground", children: [window.location.origin, "/admin/registro"] })] }), _jsx("li", { children: "A outra pessoa se registra com email e senha" }), _jsx("li", { children: "Ela faz login com email/senha e acessa o painel \"Gerenciar Admins\"" }), _jsx("li", { children: "L\u00E1 ela pode ativar outros admins digitando seus emails" })] })] })] })] }));
    }
    return (_jsxs("div", { className: "space-y-6 p-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-semibold text-foreground mb-2", children: "Gerenciar Admins" }), _jsx("p", { className: "text-muted-foreground", children: "Controle quem tem acesso ao painel administrativo" })] }), _jsxs(Card, { className: "border-border/60", children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Plus, { className: "w-5 h-5 text-primary" }), "Ativar Novo Admin"] }), _jsx(CardDescription, { children: "Digite o email de um admin registrado para ativ\u00E1-lo" })] }), _jsx(CardContent, { children: _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { type: "email", placeholder: "exemplo@email.com", value: emailInput, onChange: (e) => setEmailInput(e.target.value), onKeyDown: (e) => e.key === "Enter" && handlePromoteByEmail(), className: "flex-1 rounded-lg" }), _jsxs(Button, { onClick: handlePromoteByEmail, disabled: promotingEmail !== null || !emailInput.trim(), className: "rounded-lg gap-2", children: [promotingEmail ? (_jsx(Loader2, { className: "w-4 h-4 animate-spin" })) : (_jsx(Plus, { className: "w-4 h-4" })), "Ativar"] })] }) })] }), _jsxs(Card, { className: "border-border/60", children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Shield, { className: "w-5 h-5 text-primary" }), "Admins Ativos"] }), _jsxs(CardDescription, { children: [admins?.length ?? 0, " admin", admins && admins.length !== 1 ? "s" : "", " registrado", admins && admins.length !== 1 ? "s" : ""] })] }), _jsx(CardContent, { children: isLoading ? (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsxs("div", { className: "flex flex-col items-center gap-3", children: [_jsx(Loader2, { className: "w-6 h-6 text-primary animate-spin" }), _jsx("span", { className: "text-sm text-muted-foreground", children: "Carregando admins\u2026" })] }) })) : !admins || admins.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center py-12 text-center", children: [_jsx(AlertCircle, { className: "w-8 h-8 text-muted-foreground/40 mb-3" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Nenhum admin encontrado" })] })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { className: "border-border/40 hover:bg-transparent", children: [_jsx(TableHead, { className: "text-xs font-semibold text-muted-foreground", children: "Email" }), _jsx(TableHead, { className: "text-xs font-semibold text-muted-foreground", children: "Nome" }), _jsx(TableHead, { className: "text-xs font-semibold text-muted-foreground", children: "Status" }), _jsx(TableHead, { className: "text-xs font-semibold text-muted-foreground", children: "Cadastro" }), _jsx(TableHead, { className: "text-xs font-semibold text-muted-foreground text-right", children: "A\u00E7\u00F5es" })] }) }), _jsx(TableBody, { children: admins.map((admin) => (_jsxs(TableRow, { className: "border-border/40 hover:bg-muted/30", children: [_jsx(TableCell, { className: "text-sm font-medium text-foreground", children: admin.email }), _jsx(TableCell, { className: "text-sm text-muted-foreground", children: admin.nome || "—" }), _jsx(TableCell, { children: _jsx(Badge, { variant: admin.ativo ? "default" : "secondary", className: `rounded-full text-xs font-medium ${admin.ativo
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-red-100 text-red-800"}`, children: admin.ativo ? "Ativo" : "Inativo" }) }), _jsx(TableCell, { className: "text-sm text-muted-foreground", children: new Date(admin.criadoEm).toLocaleDateString("pt-BR") }), _jsx(TableCell, { className: "text-right", children: _jsx("div", { className: "flex items-center justify-end gap-2", children: admin.ativo && admin.email !== adminMeQuery.data?.email && (_jsx(Button, { size: "sm", variant: "outline", onClick: () => handleDeactivateByEmail(admin.email), disabled: deactivatingEmail === admin.email, className: "text-xs rounded-lg h-8 text-destructive hover:text-destructive", children: deactivatingEmail === admin.email ? (_jsx(Loader2, { className: "w-3 h-3 animate-spin" })) : (_jsxs(_Fragment, { children: [_jsx(Trash2, { className: "w-3 h-3" }), "Desativar"] })) })) }) })] }, admin.id))) })] }) })) })] }), _jsxs(Card, { className: "border-border/60 bg-blue-50/50", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-sm", children: "Como compartilhar acesso?" }) }), _jsxs(CardContent, { className: "text-sm text-muted-foreground space-y-2", children: [_jsxs("p", { children: ["1. Compartilhe o link de registro: ", _jsxs("strong", { className: "text-foreground", children: [window.location.origin, "/admin/registro"] })] }), _jsx("p", { children: "2. A outra pessoa se registra com email e senha" }), _jsx("p", { children: "3. Volte aqui e digite o email dela para ativ\u00E1-la como admin" }), _jsx("p", { children: "4. Pronto! Ela agora tem acesso ao painel administrativo" })] })] })] }));
}
