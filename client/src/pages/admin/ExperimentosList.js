import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, FlaskConical, Settings, BarChart3, Share2, Power, PowerOff, Trash2, Check, } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
export default function ExperimentosList({ onSelect, onDashboard }) {
    const utils = trpc.useUtils();
    const { data: experimentos, isLoading } = trpc.experimentos.listar.useQuery();
    const createMut = trpc.experimentos.criar.useMutation({
        onSuccess: () => {
            utils.experimentos.listar.invalidate();
            setCreateOpen(false);
            setForm({ titulo: "", descricao: "" });
            toast.success("Experimento criado com sucesso!");
        },
        onError: (e) => toast.error(e.message),
    });
    const deleteMut = trpc.experimentos.delete.useMutation({
        onSuccess: () => {
            utils.experimentos.listar.invalidate();
            toast.success("Experimento removido.");
        },
        onError: (e) => toast.error(e.message),
    });
    const ativarMut = trpc.experimentos.ativar.useMutation({
        onSuccess: () => {
            utils.experimentos.listar.invalidate();
            toast.success("Experimento ativado!");
        },
        onError: (e) => toast.error(e.message),
    });
    const desativarMut = trpc.experimentos.desativar.useMutation({
        onSuccess: () => {
            utils.experimentos.listar.invalidate();
            toast.success("Experimento desativado.");
        },
        onError: (e) => toast.error(e.message),
    });
    const [createOpen, setCreateOpen] = useState(false);
    const [form, setForm] = useState({ titulo: "", descricao: "" });
    const [copiedId, setCopiedId] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    function copyLink(slug, id) {
        const url = `${window.location.origin}/avaliacao/${slug}`;
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        toast.success("Link copiado!");
        setTimeout(() => setCopiedId(null), 2000);
    }
    return (_jsxs("div", { className: "animate-fade-in", children: [_jsxs("div", { className: "flex items-center justify-between mb-8", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-semibold text-foreground", style: { fontFamily: "'Playfair Display', serif" }, children: "Experimentos" }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Gerencie seus experimentos de avalia\u00E7\u00E3o sensorial" })] }), _jsxs(Button, { onClick: () => setCreateOpen(true), className: "rounded-full gap-2", children: [_jsx(Plus, { className: "w-4 h-4" }), "Novo experimento"] })] }), isLoading ? (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4", children: [1, 2, 3].map((i) => (_jsx("div", { className: "h-44 bg-muted/50 rounded-2xl animate-pulse" }, i))) })) : experimentos?.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center py-24 text-center", children: [_jsx("div", { className: "w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4", children: _jsx(FlaskConical, { className: "w-8 h-8 text-muted-foreground" }) }), _jsx("h3", { className: "font-medium text-foreground mb-2", children: "Nenhum experimento ainda" }), _jsx("p", { className: "text-sm text-muted-foreground mb-6 max-w-xs", children: "Crie seu primeiro experimento para come\u00E7ar a coletar avalia\u00E7\u00F5es sensoriais." }), _jsxs(Button, { onClick: () => setCreateOpen(true), className: "rounded-full gap-2", children: [_jsx(Plus, { className: "w-4 h-4" }), "Criar experimento"] })] })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4", children: experimentos?.map((exp) => (_jsxs("div", { className: "bg-white rounded-2xl border border-border/60 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-4", children: [_jsx("div", { className: "flex items-start justify-between gap-2", children: _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "flex items-center gap-2 mb-1", children: _jsx(Badge, { variant: exp.ativo ? "default" : "secondary", className: `text-xs rounded-full px-2 py-0.5 ${exp.ativo
                                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                                : "bg-muted text-muted-foreground"}`, children: exp.ativo ? "Ativo" : "Inativo" }) }), _jsx("h3", { className: "font-semibold text-foreground text-sm leading-snug line-clamp-2", children: exp.titulo }), exp.descricao && (_jsx("p", { className: "text-xs text-muted-foreground mt-1 line-clamp-2", children: exp.descricao }))] }) }), _jsxs("div", { className: "text-xs text-muted-foreground font-mono bg-muted/40 rounded-lg px-2.5 py-1.5 truncate", children: ["/avaliacao/", exp.slug] }), _jsxs("div", { className: "flex flex-wrap gap-2 mt-auto", children: [_jsxs(Button, { size: "sm", variant: "outline", className: "rounded-full gap-1.5 text-xs h-8 flex-1", onClick: () => onSelect(exp.id), children: [_jsx(Settings, { className: "w-3 h-3" }), "Configurar"] }), _jsxs(Button, { size: "sm", variant: "outline", className: "rounded-full gap-1.5 text-xs h-8 flex-1", onClick: () => onDashboard(exp.id), children: [_jsx(BarChart3, { className: "w-3 h-3" }), "Dashboard"] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { size: "sm", variant: "ghost", className: "rounded-full gap-1.5 text-xs h-8 flex-1 text-muted-foreground hover:text-foreground", onClick: () => copyLink(exp.slug, exp.id), children: [copiedId === exp.id ? (_jsx(Check, { className: "w-3 h-3 text-emerald-600" })) : (_jsx(Share2, { className: "w-3 h-3" })), copiedId === exp.id ? "Copiado!" : "Compartilhar"] }), _jsxs(Button, { size: "sm", variant: "ghost", className: `rounded-full gap-1.5 text-xs h-8 ${exp.ativo
                                        ? "text-amber-600 hover:bg-amber-50"
                                        : "text-emerald-600 hover:bg-emerald-50"}`, onClick: () => exp.ativo ? desativarMut.mutate({ id: exp.id }) : ativarMut.mutate({ id: exp.id }), children: [exp.ativo ? _jsx(PowerOff, { className: "w-3 h-3" }) : _jsx(Power, { className: "w-3 h-3" }), exp.ativo ? "Desativar" : "Ativar"] }), _jsx(Button, { size: "sm", variant: "ghost", className: "rounded-full text-xs h-8 w-8 p-0 text-destructive/60 hover:text-destructive hover:bg-destructive/10", onClick: () => setDeleteConfirm(exp.id), children: _jsx(Trash2, { className: "w-3 h-3" }) })] })] }, exp.id))) })), _jsx(Dialog, { open: createOpen, onOpenChange: setCreateOpen, children: _jsxs(DialogContent, { className: "rounded-2xl max-w-md", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { style: { fontFamily: "'Playfair Display', serif" }, children: "Novo experimento" }) }), _jsxs("div", { className: "space-y-4 py-2", children: [_jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "text-sm font-medium text-foreground", children: "T\u00EDtulo *" }), _jsx(Input, { placeholder: "Ex: Avalia\u00E7\u00E3o de Caf\u00E9s Especiais", value: form.titulo, onChange: (e) => setForm((f) => ({ ...f, titulo: e.target.value })), className: "rounded-xl" })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "text-sm font-medium text-foreground", children: "Descri\u00E7\u00E3o" }), _jsx(Textarea, { placeholder: "Descreva o objetivo deste experimento\u2026", value: form.descricao, onChange: (e) => setForm((f) => ({ ...f, descricao: e.target.value })), className: "rounded-xl resize-none", rows: 3 })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "ghost", onClick: () => setCreateOpen(false), className: "rounded-full", children: "Cancelar" }), _jsx(Button, { onClick: () => createMut.mutate(form), disabled: !form.titulo.trim() || createMut.isPending, className: "rounded-full", children: createMut.isPending ? "Criando…" : "Criar experimento" })] })] }) }), _jsx(Dialog, { open: !!deleteConfirm, onOpenChange: () => setDeleteConfirm(null), children: _jsxs(DialogContent, { className: "rounded-2xl max-w-sm", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Confirmar exclus\u00E3o" }) }), _jsx("p", { className: "text-sm text-muted-foreground py-2", children: "Esta a\u00E7\u00E3o \u00E9 irrevers\u00EDvel. Todos os dados do experimento ser\u00E3o removidos permanentemente." }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "ghost", onClick: () => setDeleteConfirm(null), className: "rounded-full", children: "Cancelar" }), _jsx(Button, { variant: "destructive", className: "rounded-full", onClick: () => {
                                        if (deleteConfirm) {
                                            deleteMut.mutate({ id: deleteConfirm });
                                            setDeleteConfirm(null);
                                        }
                                    }, children: "Excluir" })] })] }) })] }));
}
