import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
export default function AdminLoginPage() {
    const [, setLocation] = useLocation();
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [nome, setNome] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const utils = trpc.useUtils();
    const loginMutation = trpc.adminAuth.login.useMutation();
    const registroMutation = trpc.adminAuth.registro.useMutation();
    const adminMeQuery = trpc.adminAuth.me.useQuery();
    // Redireciona se já estiver logado
    useEffect(() => {
        if (adminMeQuery.data?.email) {
            setLocation("/admin");
        }
    }, [adminMeQuery.data, setLocation]);
    // LOGIN
    const handleLogin = async (e) => {
        e.preventDefault();
        if (!email || !senha) {
            toast.error("Preencha todos os campos");
            return;
        }
        setIsLoading(true);
        try {
            await loginMutation.mutateAsync({
                email,
                senha,
            });
            await utils.adminAuth.me.invalidate();
            await utils.adminAuth.me.refetch();
            toast.success("Login realizado com sucesso!");
            setLocation("/admin");
        }
        catch (error) {
            toast.error(error.message || "Erro ao fazer login");
            console.error(error);
        }
        finally {
            setIsLoading(false);
        }
    };
    // REGISTRO
    const handleRegister = async (e) => {
        e.preventDefault();
        if (!email || !senha || !nome) {
            toast.error("Preencha todos os campos");
            return;
        }
        if (senha.length < 6) {
            toast.error("Senha deve ter no mínimo 6 caracteres");
            return;
        }
        setIsLoading(true);
        try {
            await registroMutation.mutateAsync({
                email,
                senha,
                nome,
            });
            toast.success("Conta criada com sucesso! Faça login agora.");
            setShowRegister(false);
            setEmail("");
            setSenha("");
            setNome("");
        }
        catch (error) {
            toast.error(error.message || "Erro ao registrar");
            console.error(error);
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-fea-50 via-white to-fea-50 flex items-center justify-center p-4", children: _jsx(Card, { className: "w-full max-w-md shadow-lg", children: _jsxs("div", { className: "p-8", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h1", { className: "text-3xl font-bold text-fea-600 mb-2", children: "SensoPro" }), _jsx("p", { className: "text-gray-600", children: showRegister ? "Criar conta de administrador" : "Painel Administrativo" })] }), _jsxs("form", { onSubmit: showRegister ? handleRegister : handleLogin, className: "space-y-4", children: [showRegister && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Nome" }), _jsx(Input, { type: "text", placeholder: "Seu nome", value: nome, onChange: (e) => setNome(e.target.value), disabled: isLoading })] })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Email" }), _jsx(Input, { type: "email", placeholder: "seu@email.com", value: email, onChange: (e) => setEmail(e.target.value), disabled: isLoading })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Senha" }), _jsx(Input, { type: "password", placeholder: showRegister ? "Mínimo 6 caracteres" : "Sua senha", value: senha, onChange: (e) => setSenha(e.target.value), disabled: isLoading })] }), _jsx("button", { type: "submit", disabled: isLoading, style: {
                                    width: "100%",
                                    backgroundColor: "#e63e6d",
                                    color: "white",
                                    padding: "10px 16px",
                                    borderRadius: "8px",
                                    fontWeight: 500,
                                    fontSize: "14px",
                                    cursor: isLoading ? "not-allowed" : "pointer",
                                    border: "none",
                                    opacity: isLoading ? 0.7 : 1,
                                }, children: isLoading ? (_jsxs("span", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }, children: [_jsx(Loader2, { className: "w-4 h-4 animate-spin" }), "Processando..."] })) : showRegister ? ("Criar Conta") : ("Entrar") })] }), _jsx("div", { className: "mt-6 text-center", children: _jsx("button", { type: "button", onClick: () => {
                                setShowRegister(!showRegister);
                                setEmail("");
                                setSenha("");
                                setNome("");
                            }, style: {
                                color: "#e63e6d",
                                fontSize: "14px",
                                fontWeight: 500,
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                            }, children: showRegister ? "Já tem conta? Faça login" : "Não tem conta? Registre-se" }) })] }) }) }));
}
