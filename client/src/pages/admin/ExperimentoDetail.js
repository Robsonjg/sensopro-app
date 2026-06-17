import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Pencil, Trash2, Share2, Check, Copy, Power, PowerOff, FlaskConical, Sliders, ChevronUp, ChevronDown, } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
export default function ExperimentoDetail({ experimentoId, onBack }) {
    const utils = trpc.useUtils();
    const { data: exp, isLoading: expLoading } = trpc.experimentos.getById.useQuery({
        id: experimentoId,
    });
    const { data: amostrasRaw, isLoading: amostrasLoading } = trpc.amostras.listar.useQuery({
        experimentoId,
    });
    const { data: atributosRaw, isLoading: atributosLoading } = trpc.atributos.listar.useQuery({
        experimentoId,
    });
    const amostras = amostrasRaw ?? [];
    const atributos = atributosRaw ?? [];
    // Mutations experimento
    const updateExpMut = trpc.experimentos.update.useMutation({
        onSuccess: () => {
            utils.experimentos.getById.invalidate({ id: experimentoId });
            utils.experimentos.listar.invalidate();
            setEditExpOpen(false);
            toast.success("Experimento atualizado!");
        },
        onError: (e) => toast.error(e.message),
    });
    const ativarMut = trpc.experimentos.ativar.useMutation({
        onSuccess: () => {
            utils.experimentos.getById.invalidate({ id: experimentoId });
            utils.experimentos.listar.invalidate();
            toast.success("Experimento ativado!");
        },
    });
    const desativarMut = trpc.experimentos.desativar.useMutation({
        onSuccess: () => {
            utils.experimentos.getById.invalidate({ id: experimentoId });
            utils.experimentos.listar.invalidate();
            toast.success("Experimento desativado.");
        },
    });
    // Mutations amostras
    const createAmostraMut = trpc.amostras.create.useMutation({
        onSuccess: () => {
            utils.amostras.listar.invalidate({ experimentoId });
            setAmostraModal({ open: false, editing: null });
            toast.success("Amostra adicionada!");
        },
        onError: (e) => toast.error(e.message),
    });
    const updateAmostraMut = trpc.amostras.update.useMutation({
        onSuccess: () => {
            utils.amostras.listar.invalidate({ experimentoId });
            setAmostraModal({ open: false, editing: null });
            toast.success("Amostra atualizada!");
        },
        onError: (e) => toast.error(e.message),
    });
    const deleteAmostraMut = trpc.amostras.delete.useMutation({
        onSuccess: () => {
            utils.amostras.listar.invalidate({ experimentoId });
            toast.success("Amostra removida.");
        },
        onError: (e) => toast.error(e.message),
    });
    // Mutations atributos
    const createAtributoMut = trpc.atributos.create.useMutation({
        onSuccess: () => {
            utils.atributos.listar.invalidate({ experimentoId });
            setAtributoModal({ open: false, editing: null });
            toast.success("Atributo adicionado!");
        },
        onError: (e) => toast.error(e.message),
    });
    const updateAtributoMut = trpc.atributos.update.useMutation({
        onSuccess: () => {
            utils.atributos.listar.invalidate({ experimentoId });
            setAtributoModal({ open: false, editing: null });
            toast.success("Atributo atualizado!");
        },
        onError: (e) => toast.error(e.message),
    });
    const deleteAtributoMut = trpc.atributos.delete.useMutation({
        onSuccess: () => {
            utils.atributos.listar.invalidate({ experimentoId });
            toast.success("Atributo removido.");
        },
        onError: (e) => toast.error(e.message),
    });
    const reorderAmostrasMut = trpc.amostras.reorder.useMutation({
        onSuccess: () => utils.amostras.listar.invalidate({ experimentoId }),
        onError: (e) => toast.error(e.message),
    });
    const reorderAtributosMut = trpc.atributos.reorder.useMutation({
        onSuccess: () => utils.atributos.listar.invalidate({ experimentoId }),
        onError: (e) => toast.error(e.message),
    });
    const [editExpOpen, setEditExpOpen] = useState(false);
    const [editExpForm, setEditExpForm] = useState({ titulo: "", descricao: "" });
    const [amostraModal, setAmostraModal] = useState({ open: false, editing: null });
    const [amostraForm, setAmostraForm] = useState({
        nome: "",
        codigo: "",
        descricao: "",
    });
    const [atributoModal, setAtributoModal] = useState({ open: false, editing: null });
    const [atributoForm, setAtributoForm] = useState({
        nome: "",
        descricao: "",
        labelMin: "Muito Baixo",
        labelMax: "Muito Alto",
    });
    const [copied, setCopied] = useState(false);
    function openEditExp() {
        setEditExpForm({ titulo: exp?.titulo ?? "", descricao: exp?.descricao ?? "" });
        setEditExpOpen(true);
    }
    function openAmostra(item) {
        if (item) {
            setAmostraForm({
                nome: item.nome,
                codigo: item.codigo,
                descricao: item.descricao ?? "",
            });
            setAmostraModal({ open: true, editing: item });
        }
        else {
            setAmostraForm({ nome: "", codigo: "", descricao: "" });
            setAmostraModal({ open: true, editing: null });
        }
    }
    function openAtributo(item) {
        if (item) {
            setAtributoForm({
                nome: item.nome,
                descricao: item.descricao ?? "",
                labelMin: item.labelMin ?? "Muito Baixo",
                labelMax: item.labelMax ?? "Muito Alto",
            });
            setAtributoModal({ open: true, editing: item });
        }
        else {
            setAtributoForm({ nome: "", descricao: "", labelMin: "Muito Baixo", labelMax: "Muito Alto" });
            setAtributoModal({ open: true, editing: null });
        }
    }
    function saveAmostra() {
        const ordem = amostras?.length ?? 0;
        if (amostraModal.editing) {
            updateAmostraMut.mutate({ id: amostraModal.editing.id, ...amostraForm });
        }
        else {
            createAmostraMut.mutate({ experimentoId, ...amostraForm, codigo: amostraForm.codigo || "", ordem });
        }
    }
    function saveAtributo() {
        const ordem = atributos?.length ?? 0;
        if (atributoModal.editing) {
            updateAtributoMut.mutate({ id: atributoModal.editing.id, ...atributoForm });
        }
        else {
            createAtributoMut.mutate({ experimentoId, ...atributoForm, ordem });
        }
    }
    function moveAmostra(idx, dir) {
        const arr = [...amostras];
        const newIdx = idx + dir;
        if (newIdx < 0 || newIdx >= arr.length)
            return;
        [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
        reorderAmostrasMut.mutate({ items: arr.map((a, i) => ({ id: a.id, ordem: i })) });
    }
    function moveAtributo(idx, dir) {
        const arr = [...atributos];
        const newIdx = idx + dir;
        if (newIdx < 0 || newIdx >= arr.length)
            return;
        [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
        reorderAtributosMut.mutate({ items: arr.map((a, i) => ({ id: a.id, ordem: i })) });
    }
    function copyLink() {
        if (!exp)
            return;
        navigator.clipboard.writeText(`${window.location.origin}/avaliacao/${exp.slug}`);
        setCopied(true);
        toast.success("Link copiado!");
        setTimeout(() => setCopied(false), 2000);
    }
    if (expLoading) {
        return (_jsx("div", { className: "flex items-center justify-center py-24", children: _jsx("div", { className: "w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" }) }));
    }
    return (_jsxs("div", { className: "animate-fade-in max-w-4xl", children: [_jsxs("div", { className: "flex items-start gap-4 mb-8", children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: onBack, className: "rounded-full mt-0.5 -ml-2", children: _jsx(ArrowLeft, { className: "w-4 h-4" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "flex items-center gap-2 mb-1", children: _jsx(Badge, { className: `text-xs rounded-full px-2 py-0.5 ${exp?.ativo
                                        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                        : "bg-muted text-muted-foreground"}`, children: exp?.ativo ? "Ativo" : "Inativo" }) }), _jsx("h1", { className: "text-2xl font-semibold text-foreground", style: { fontFamily: "'Playfair Display', serif" }, children: exp?.titulo }), exp?.descricao && (_jsx("p", { className: "text-sm text-muted-foreground mt-1", children: exp.descricao }))] }), _jsxs("div", { className: "flex items-center gap-2 flex-shrink-0", children: [_jsxs(Button, { size: "sm", variant: "outline", className: "rounded-full gap-1.5 text-xs", onClick: copyLink, children: [copied ? _jsx(Check, { className: "w-3 h-3 text-emerald-600" }) : _jsx(Share2, { className: "w-3 h-3" }), copied ? "Copiado!" : "Compartilhar"] }), _jsxs(Button, { size: "sm", variant: "outline", className: `rounded-full gap-1.5 text-xs ${exp?.ativo ? "text-amber-600 border-amber-200 hover:bg-amber-50" : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"}`, onClick: () => exp?.ativo
                                    ? desativarMut.mutate({ id: experimentoId })
                                    : ativarMut.mutate({ id: experimentoId }), children: [exp?.ativo ? _jsx(PowerOff, { className: "w-3 h-3" }) : _jsx(Power, { className: "w-3 h-3" }), exp?.ativo ? "Desativar" : "Ativar"] }), _jsxs(Button, { size: "sm", variant: "outline", className: "rounded-full gap-1.5 text-xs", onClick: openEditExp, children: [_jsx(Pencil, { className: "w-3 h-3" }), "Editar"] })] })] }), _jsxs("div", { className: "bg-muted/40 rounded-xl px-4 py-3 flex items-center gap-3 mb-8 border border-border/60", children: [_jsx(Share2, { className: "w-4 h-4 text-muted-foreground flex-shrink-0" }), _jsxs("span", { className: "text-sm text-muted-foreground font-mono flex-1 truncate", children: [window.location.origin, "/avaliacao/", exp?.slug] }), _jsx(Button, { size: "sm", variant: "ghost", className: "rounded-full text-xs h-7", onClick: copyLink, children: copied ? _jsx(Check, { className: "w-3 h-3 text-emerald-600" }) : _jsx(Copy, { className: "w-3 h-3" }) })] }), _jsxs(Tabs, { defaultValue: "amostras", children: [_jsxs(TabsList, { className: "rounded-xl bg-muted/50 p-1 mb-6", children: [_jsxs(TabsTrigger, { value: "amostras", className: "rounded-lg gap-2 text-sm", children: [_jsx(FlaskConical, { className: "w-3.5 h-3.5" }), "Amostras (", amostras?.length ?? 0, ")"] }), _jsxs(TabsTrigger, { value: "atributos", className: "rounded-lg gap-2 text-sm", children: [_jsx(Sliders, { className: "w-3.5 h-3.5" }), "Atributos (", atributos?.length ?? 0, ")"] })] }), _jsxs(TabsContent, { value: "amostras", className: "animate-fade-in", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Produtos ou itens que ser\u00E3o avaliados neste experimento." }), _jsxs(Button, { size: "sm", className: "rounded-full gap-1.5", onClick: () => openAmostra(), children: [_jsx(Plus, { className: "w-3.5 h-3.5" }), "Adicionar amostra"] })] }), amostrasLoading ? (_jsx("div", { className: "space-y-2", children: [1, 2, 3].map((i) => (_jsx("div", { className: "h-14 bg-muted/50 rounded-xl animate-pulse" }, i))) })) : amostras?.length === 0 ? (_jsxs("div", { className: "text-center py-16 border-2 border-dashed border-border rounded-2xl", children: [_jsx(FlaskConical, { className: "w-8 h-8 text-muted-foreground mx-auto mb-3" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Nenhuma amostra adicionada ainda." })] })) : (_jsx("div", { className: "space-y-2", children: amostras?.map((item, idx) => (_jsxs("div", { className: "flex items-center gap-3 bg-white border border-border/60 rounded-xl px-4 py-3 hover:border-border transition-colors animate-slide-in", style: { animationDelay: `${idx * 30}ms` }, children: [_jsxs("div", { className: "flex flex-col gap-0.5", children: [_jsx(Button, { size: "sm", variant: "ghost", className: "rounded-md w-6 h-5 p-0 text-muted-foreground/40 hover:text-muted-foreground", disabled: idx === 0, onClick: () => moveAmostra(idx, -1), children: _jsx(ChevronUp, { className: "w-3 h-3" }) }), _jsx(Button, { size: "sm", variant: "ghost", className: "rounded-md w-6 h-5 p-0 text-muted-foreground/40 hover:text-muted-foreground", disabled: idx === amostras.length - 1, onClick: () => moveAmostra(idx, 1), children: _jsx(ChevronDown, { className: "w-3 h-3" }) })] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xs font-mono bg-muted px-2 py-0.5 rounded-md text-muted-foreground", children: item.codigo }), _jsx("span", { className: "text-sm font-medium text-foreground", children: item.nome })] }), item.descricao && (_jsx("p", { className: "text-xs text-muted-foreground mt-0.5 truncate", children: item.descricao }))] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Button, { size: "sm", variant: "ghost", className: "rounded-full w-8 h-8 p-0", onClick: () => openAmostra(item), children: _jsx(Pencil, { className: "w-3.5 h-3.5" }) }), _jsx(Button, { size: "sm", variant: "ghost", className: "rounded-full w-8 h-8 p-0 text-destructive/60 hover:text-destructive hover:bg-destructive/10", onClick: () => deleteAmostraMut.mutate({ id: item.id }), children: _jsx(Trash2, { className: "w-3.5 h-3.5" }) })] })] }, item.id))) }))] }), _jsxs(TabsContent, { value: "atributos", className: "animate-fade-in", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Caracter\u00EDsticas sensoriais que ser\u00E3o avaliadas em cada amostra." }), _jsxs(Button, { size: "sm", className: "rounded-full gap-1.5", onClick: () => openAtributo(), children: [_jsx(Plus, { className: "w-3.5 h-3.5" }), "Adicionar atributo"] })] }), atributosLoading ? (_jsx("div", { className: "space-y-2", children: [1, 2, 3].map((i) => (_jsx("div", { className: "h-14 bg-muted/50 rounded-xl animate-pulse" }, i))) })) : atributos?.length === 0 ? (_jsxs("div", { className: "text-center py-16 border-2 border-dashed border-border rounded-2xl", children: [_jsx(Sliders, { className: "w-8 h-8 text-muted-foreground mx-auto mb-3" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Nenhum atributo adicionado ainda." })] })) : (_jsx("div", { className: "space-y-2", children: atributos?.map((item, idx) => (_jsxs("div", { className: "flex items-center gap-3 bg-white border border-border/60 rounded-xl px-4 py-3 hover:border-border transition-colors animate-slide-in", style: { animationDelay: `${idx * 30}ms` }, children: [_jsxs("div", { className: "flex flex-col gap-0.5", children: [_jsx(Button, { size: "sm", variant: "ghost", className: "rounded-md w-6 h-5 p-0 text-muted-foreground/40 hover:text-muted-foreground", disabled: idx === 0, onClick: () => moveAtributo(idx, -1), children: _jsx(ChevronUp, { className: "w-3 h-3" }) }), _jsx(Button, { size: "sm", variant: "ghost", className: "rounded-md w-6 h-5 p-0 text-muted-foreground/40 hover:text-muted-foreground", disabled: idx === atributos.length - 1, onClick: () => moveAtributo(idx, 1), children: _jsx(ChevronDown, { className: "w-3 h-3" }) })] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("span", { className: "text-sm font-medium text-foreground", children: item.nome }), _jsxs("div", { className: "flex items-center gap-2 mt-0.5", children: [_jsx("span", { className: "text-xs text-muted-foreground", children: item.labelMin }), _jsx("span", { className: "text-xs text-muted-foreground", children: "\u2192" }), _jsx("span", { className: "text-xs text-muted-foreground", children: item.labelMax })] })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Button, { size: "sm", variant: "ghost", className: "rounded-full w-8 h-8 p-0", onClick: () => openAtributo(item), children: _jsx(Pencil, { className: "w-3.5 h-3.5" }) }), _jsx(Button, { size: "sm", variant: "ghost", className: "rounded-full w-8 h-8 p-0 text-destructive/60 hover:text-destructive hover:bg-destructive/10", onClick: () => deleteAtributoMut.mutate({ id: item.id }), children: _jsx(Trash2, { className: "w-3.5 h-3.5" }) })] })] }, item.id))) }))] })] }), _jsx(Dialog, { open: editExpOpen, onOpenChange: setEditExpOpen, children: _jsxs(DialogContent, { className: "rounded-2xl max-w-md", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { style: { fontFamily: "'Playfair Display', serif" }, children: "Editar experimento" }) }), _jsxs("div", { className: "space-y-4 py-2", children: [_jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "text-sm font-medium", children: "T\u00EDtulo *" }), _jsx(Input, { value: editExpForm.titulo, onChange: (e) => setEditExpForm((f) => ({ ...f, titulo: e.target.value })), className: "rounded-xl" })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "text-sm font-medium", children: "Descri\u00E7\u00E3o" }), _jsx(Textarea, { value: editExpForm.descricao, onChange: (e) => setEditExpForm((f) => ({ ...f, descricao: e.target.value })), className: "rounded-xl resize-none", rows: 3 })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "ghost", onClick: () => setEditExpOpen(false), className: "rounded-full", children: "Cancelar" }), _jsx(Button, { onClick: () => updateExpMut.mutate({ id: experimentoId, ...editExpForm }), disabled: !editExpForm.titulo.trim() || updateExpMut.isPending, className: "rounded-full", children: updateExpMut.isPending ? "Salvando…" : "Salvar" })] })] }) }), _jsx(Dialog, { open: amostraModal.open, onOpenChange: (o) => setAmostraModal({ open: o, editing: null }), children: _jsxs(DialogContent, { className: "rounded-2xl max-w-md", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { style: { fontFamily: "'Playfair Display', serif" }, children: amostraModal.editing ? "Editar amostra" : "Nova amostra" }) }), _jsxs("div", { className: "space-y-4 py-2", children: [_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "text-sm font-medium", children: "C\u00F3digo *" }), _jsx(Input, { placeholder: "Ex: A001", value: amostraForm.codigo, onChange: (e) => setAmostraForm((f) => ({ ...f, codigo: e.target.value })), className: "rounded-xl" })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "text-sm font-medium", children: "Nome *" }), _jsx(Input, { placeholder: "Ex: Caf\u00E9 Bourbon", value: amostraForm.nome, onChange: (e) => setAmostraForm((f) => ({ ...f, nome: e.target.value })), className: "rounded-xl" })] })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "text-sm font-medium", children: "Descri\u00E7\u00E3o" }), _jsx(Textarea, { placeholder: "Descri\u00E7\u00E3o opcional da amostra\u2026", value: amostraForm.descricao, onChange: (e) => setAmostraForm((f) => ({ ...f, descricao: e.target.value })), className: "rounded-xl resize-none", rows: 2 })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "ghost", onClick: () => setAmostraModal({ open: false, editing: null }), className: "rounded-full", children: "Cancelar" }), _jsx(Button, { onClick: saveAmostra, disabled: !amostraForm.nome.trim() ||
                                        !amostraForm.codigo?.trim() ||
                                        createAmostraMut.isPending ||
                                        updateAmostraMut.isPending, className: "rounded-full", children: createAmostraMut.isPending || updateAmostraMut.isPending ? "Salvando…" : "Salvar" })] })] }) }), _jsx(Dialog, { open: atributoModal.open, onOpenChange: (o) => setAtributoModal({ open: o, editing: null }), children: _jsxs(DialogContent, { className: "rounded-2xl max-w-md", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { style: { fontFamily: "'Playfair Display', serif" }, children: atributoModal.editing ? "Editar atributo" : "Novo atributo" }) }), _jsxs("div", { className: "space-y-4 py-2", children: [_jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "text-sm font-medium", children: "Nome do atributo *" }), _jsx(Input, { placeholder: "Ex: Aroma, Sabor, Acidez\u2026", value: atributoForm.nome, onChange: (e) => setAtributoForm((f) => ({ ...f, nome: e.target.value })), className: "rounded-xl" })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "text-sm font-medium", children: "Descri\u00E7\u00E3o / instru\u00E7\u00E3o" }), _jsx(Textarea, { placeholder: "Instru\u00E7\u00E3o para o avaliador\u2026", value: atributoForm.descricao, onChange: (e) => setAtributoForm((f) => ({ ...f, descricao: e.target.value })), className: "rounded-xl resize-none", rows: 2 })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "text-sm font-medium", children: "R\u00F3tulo m\u00EDnimo" }), _jsx(Input, { placeholder: "Muito Baixo", value: atributoForm.labelMin, onChange: (e) => setAtributoForm((f) => ({ ...f, labelMin: e.target.value })), className: "rounded-xl" })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "text-sm font-medium", children: "R\u00F3tulo m\u00E1ximo" }), _jsx(Input, { placeholder: "Muito Alto", value: atributoForm.labelMax, onChange: (e) => setAtributoForm((f) => ({ ...f, labelMax: e.target.value })), className: "rounded-xl" })] })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "ghost", onClick: () => setAtributoModal({ open: false, editing: null }), className: "rounded-full", children: "Cancelar" }), _jsx(Button, { onClick: saveAtributo, disabled: !atributoForm.nome.trim() ||
                                        createAtributoMut.isPending ||
                                        updateAtributoMut.isPending, className: "rounded-full", children: createAtributoMut.isPending || updateAtributoMut.isPending ? "Salvando…" : "Salvar" })] })] }) })] }));
}
