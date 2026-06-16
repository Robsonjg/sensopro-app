import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
export default function ConviteManagement({ adminId }) {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [conviteGerado, setConviteGerado] = useState(null);
    const createConviteMutation = trpc.adminAuth.createConvite.useMutation();
    const handleCreateConvite = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const resultado = await createConviteMutation.mutateAsync({
                email: email || undefined,
            });
            setConviteGerado(resultado);
            setEmail("");
            toast.success("Convite gerado com sucesso!");
        }
        catch (err) {
            toast.error("Erro ao gerar convite");
        }
        finally {
            setIsLoading(false);
        }
    };
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success("Copiado para a área de transferência!");
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold mb-4", children: "Gerar Convite para Admin" }), _jsx("p", { className: "text-gray-600 mb-6", children: "Crie um convite \u00FAnico para que outra pessoa se registre como administrador. Ela receber\u00E1 um link para se registrar com email e senha." })] }), _jsx(Card, { className: "p-6", children: _jsxs("form", { onSubmit: handleCreateConvite, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Email (opcional)" }), _jsx(Input, { type: "email", placeholder: "email@example.com", value: email, onChange: (e) => setEmail(e.target.value), disabled: isLoading }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Se preenchido, o convite ser\u00E1 associado a este email" })] }), _jsx(Button, { type: "submit", className: "w-full", disabled: isLoading, children: isLoading ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Gerando convite..."] })) : ("Gerar Convite") })] }) }), conviteGerado && (_jsx(Card, { className: "p-6 border-green-200 bg-green-50", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-start gap-2", children: [_jsx(CheckCircle, { className: "h-5 w-5 text-green-600 mt-0.5" }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-green-900", children: "Convite Gerado com Sucesso!" }), _jsx("p", { className: "text-sm text-green-800 mt-1", children: "Compartilhe o link abaixo com a pessoa que deseja adicionar como admin" })] })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "C\u00F3digo do Convite" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { type: "text", value: conviteGerado.codigo, readOnly: true, className: "bg-white" }), _jsx(Button, { type: "button", variant: "outline", size: "sm", onClick: () => copyToClipboard(conviteGerado.codigo), children: _jsx(Copy, { className: "h-4 w-4" }) })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Link de Registro" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { type: "text", value: conviteGerado.link, readOnly: true, className: "bg-white text-sm" }), _jsx(Button, { type: "button", variant: "outline", size: "sm", onClick: () => copyToClipboard(conviteGerado.link), children: _jsx(Copy, { className: "h-4 w-4" }) })] })] })] }), _jsxs(Alert, { className: "border-green-200 bg-white", children: [_jsx(AlertCircle, { className: "h-4 w-4 text-green-600" }), _jsx(AlertDescription, { className: "text-sm text-green-800", children: "O convite expira em 30 dias. A pessoa que usar o convite precisar\u00E1 ser ativada por voc\u00EA no painel \"Gerenciar Admins\" antes de acessar o painel." })] }), _jsx(Button, { type: "button", variant: "outline", className: "w-full", onClick: () => setConviteGerado(null), children: "Gerar Outro Convite" })] }) }))] }));
}
