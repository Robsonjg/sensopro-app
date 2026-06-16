import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
export default function AdminConvitePage() {
    const [, setLocation] = useLocation();
    const params = new URLSearchParams(window.location.search);
    const codigo = params.get("codigo") || "";
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [confirmaSenha, setConfirmaSenha] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState(false);
    const [credenciaisRegistradas, setCredenciaisRegistradas] = useState(null);
    const validateConviteQuery = trpc.adminAuth.validateConvite.useQuery({ codigo }, { enabled: !!codigo });
    const acceptMutation = trpc.adminAuth.acceptConviteAndRegister.useMutation();
    const loginMutation = trpc.adminAuth.login.useMutation();
    // Se convite é inválido
    useEffect(() => {
        if (validateConviteQuery.isError) {
            const error = validateConviteQuery.error;
            setErro(error.message || "Convite inválido ou expirado");
        }
    }, [validateConviteQuery.isError, validateConviteQuery.error]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro("");
        if (!nome || !email || !senha || !confirmaSenha) {
            setErro("Todos os campos são obrigatórios");
            return;
        }
        if (senha !== confirmaSenha) {
            setErro("As senhas não coincidem");
            return;
        }
        if (senha.length < 6) {
            setErro("A senha deve ter pelo menos 6 caracteres");
            return;
        }
        setIsLoading(true);
        try {
            await acceptMutation.mutateAsync({
                codigo,
                email,
                senha,
                nome,
            });
            setSucesso(true);
            setCredenciaisRegistradas({ email, senha });
        }
        catch (err) {
            const error = err;
            setErro(error.message || "Erro ao registrar");
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleEntrarPainel = async () => {
        if (!credenciaisRegistradas)
            return;
        setIsLoading(true);
        try {
            await loginMutation.mutateAsync({
                email: credenciaisRegistradas.email,
                senha: credenciaisRegistradas.senha
            });
            setLocation("/admin");
        }
        catch (err) {
            const error = err;
            setErro(error.message || "Erro ao entrar no painel");
            setIsLoading(false);
        }
    };
    if (!codigo) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4", children: _jsx(Card, { className: "w-full max-w-md", children: _jsxs("div", { className: "p-6", children: [_jsxs(Alert, { variant: "destructive", children: [_jsx(AlertCircle, { className: "h-4 w-4" }), _jsx(AlertDescription, { children: "Convite inv\u00E1lido ou n\u00E3o fornecido" })] }), _jsx(Button, { onClick: () => setLocation("/"), className: "w-full mt-4", children: "Voltar para Home" })] }) }) }));
    }
    if (validateConviteQuery.isLoading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin text-red-600" }) }));
    }
    if (validateConviteQuery.isError) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4", children: _jsx(Card, { className: "w-full max-w-md", children: _jsxs("div", { className: "p-6", children: [_jsxs(Alert, { variant: "destructive", children: [_jsx(AlertCircle, { className: "h-4 w-4" }), _jsx(AlertDescription, { children: erro })] }), _jsx(Button, { onClick: () => setLocation("/"), className: "w-full mt-4", children: "Voltar para Home" })] }) }) }));
    }
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4", children: _jsx(Card, { className: "w-full max-w-md", children: _jsxs("div", { className: "p-6", children: [_jsx("h1", { className: "text-2xl font-bold mb-2 text-center", children: "Criar Conta Admin" }), _jsx("p", { className: "text-gray-600 text-center mb-6", children: "Voc\u00EA foi convidado para ser administrador do SensoPro" }), sucesso && (_jsxs(Alert, { className: "mb-4 border-green-200 bg-green-50", children: [_jsx(CheckCircle, { className: "h-4 w-4 text-green-600" }), _jsx(AlertDescription, { className: "text-green-800", children: "Conta criada com sucesso! Voc\u00EA j\u00E1 pode entrar no painel." })] })), erro && (_jsxs(Alert, { variant: "destructive", className: "mb-4", children: [_jsx(AlertCircle, { className: "h-4 w-4" }), _jsx(AlertDescription, { children: erro })] })), !sucesso ? (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Nome" }), _jsx(Input, { type: "text", placeholder: "Seu nome", value: nome, onChange: (e) => setNome(e.target.value), disabled: isLoading })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Email" }), _jsx(Input, { type: "email", placeholder: "seu@email.com", value: email, onChange: (e) => setEmail(e.target.value), disabled: isLoading })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Senha" }), _jsx(Input, { type: "password", placeholder: "M\u00EDnimo 6 caracteres", value: senha, onChange: (e) => setSenha(e.target.value), disabled: isLoading })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Confirmar Senha" }), _jsx(Input, { type: "password", placeholder: "Confirme a senha", value: confirmaSenha, onChange: (e) => setConfirmaSenha(e.target.value), disabled: isLoading })] }), _jsx(Button, { type: "submit", className: "w-full", disabled: isLoading, children: isLoading ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Criando conta..."] })) : ("Criar Conta") })] })) : (_jsxs("div", { className: "space-y-3", children: [_jsx(Button, { type: "button", className: "w-full bg-green-600 hover:bg-green-700", onClick: handleEntrarPainel, disabled: isLoading, children: isLoading ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Entrando..."] })) : ("Entrar no Painel") }), _jsx(Button, { type: "button", variant: "outline", className: "w-full", onClick: () => setLocation("/admin/login"), children: "Voltar para Login" })] })), !sucesso && (_jsxs("p", { className: "text-center text-sm text-gray-600 mt-4", children: ["J\u00E1 tem uma conta?", " ", _jsx("a", { href: "/admin/login", className: "text-red-600 hover:underline", children: "Fa\u00E7a login" })] }))] }) }) }));
}
