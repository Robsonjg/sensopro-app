import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Share2,
  Check,
  Copy,
  Power,
  PowerOff,
  FlaskConical,
  Sliders,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  experimentoId: number;
  onBack: () => void;
}

type ItemForm = {
  nome: string;
  codigo?: string;
  descricao?: string;
  labelMin?: string;
  labelMax?: string;
};

export default function ExperimentoDetail({ experimentoId, onBack }: Props) {
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

  type AmostraItem = NonNullable<typeof amostrasRaw>[number];
  type AtributoItem = NonNullable<typeof atributosRaw>[number];

  const [editExpOpen, setEditExpOpen] = useState(false);
  const [editExpForm, setEditExpForm] = useState({ titulo: "", descricao: "" });
  const [amostraModal, setAmostraModal] = useState<{
    open: boolean;
    editing: AmostraItem | null;
  }>({ open: false, editing: null });
  const [amostraForm, setAmostraForm] = useState<ItemForm>({
    nome: "",
    codigo: "",
    descricao: "",
  });
  const [atributoModal, setAtributoModal] = useState<{
    open: boolean;
    editing: AtributoItem | null;
  }>({ open: false, editing: null });
  const [atributoForm, setAtributoForm] = useState<ItemForm>({
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

  function openAmostra(item?: AmostraItem) {
    if (item) {
      setAmostraForm({
        nome: item.nome,
        codigo: item.codigo,
        descricao: item.descricao ?? "",
      });
      setAmostraModal({ open: true, editing: item });
    } else {
      setAmostraForm({ nome: "", codigo: "", descricao: "" });
      setAmostraModal({ open: true, editing: null });
    }
  }

  function openAtributo(item?: AtributoItem) {
    if (item) {
      setAtributoForm({
        nome: item.nome,
        descricao: item.descricao ?? "",
        labelMin: item.labelMin ?? "Muito Baixo",
        labelMax: item.labelMax ?? "Muito Alto",
      });
      setAtributoModal({ open: true, editing: item });
    } else {
      setAtributoForm({ nome: "", descricao: "", labelMin: "Muito Baixo", labelMax: "Muito Alto" });
      setAtributoModal({ open: true, editing: null });
    }
  }

  function saveAmostra() {
    const ordem = amostras?.length ?? 0;
    if (amostraModal.editing) {
      updateAmostraMut.mutate({ id: amostraModal.editing.id, ...amostraForm });
    } else {
      createAmostraMut.mutate({ experimentoId, ...amostraForm, codigo: amostraForm.codigo || "", ordem });
    }
  }

  function saveAtributo() {
    const ordem = atributos?.length ?? 0;
    if (atributoModal.editing) {
      updateAtributoMut.mutate({ id: atributoModal.editing.id, ...atributoForm });
    } else {
      createAtributoMut.mutate({ experimentoId, ...atributoForm, ordem });
    }
  }

  function moveAmostra(idx: number, dir: -1 | 1) {
    const arr = [...amostras];
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= arr.length) return;
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    reorderAmostrasMut.mutate({ items: arr.map((a, i) => ({ id: a.id, ordem: i })) });
  }

  function moveAtributo(idx: number, dir: -1 | 1) {
    const arr = [...atributos];
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= arr.length) return;
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    reorderAtributosMut.mutate({ items: arr.map((a, i) => ({ id: a.id, ordem: i })) });
  }

  function copyLink() {
    if (!exp) return;
    navigator.clipboard.writeText(`${window.location.origin}/avaliacao/${exp.slug}`);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  }

  if (expLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="rounded-full mt-0.5 -ml-2">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge
              className={`text-xs rounded-full px-2 py-0.5 ${
                exp?.ativo
                  ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {exp?.ativo ? "Ativo" : "Inativo"}
            </Badge>
          </div>
          <h1
            className="text-2xl font-semibold text-foreground"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {exp?.titulo}
          </h1>
          {exp?.descricao && (
            <p className="text-sm text-muted-foreground mt-1">{exp.descricao}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="rounded-full gap-1.5 text-xs"
            onClick={copyLink}
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Share2 className="w-3 h-3" />}
            {copied ? "Copiado!" : "Compartilhar"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={`rounded-full gap-1.5 text-xs ${
              exp?.ativo ? "text-amber-600 border-amber-200 hover:bg-amber-50" : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"
            }`}
            onClick={() =>
              exp?.ativo
                ? desativarMut.mutate({ id: experimentoId })
                : ativarMut.mutate({ id: experimentoId })
            }
          >
            {exp?.ativo ? <PowerOff className="w-3 h-3" /> : <Power className="w-3 h-3" />}
            {exp?.ativo ? "Desativar" : "Ativar"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full gap-1.5 text-xs"
            onClick={openEditExp}
          >
            <Pencil className="w-3 h-3" />
            Editar
          </Button>
        </div>
      </div>

      {/* Link de compartilhamento */}
      <div className="bg-muted/40 rounded-xl px-4 py-3 flex items-center gap-3 mb-8 border border-border/60">
        <Share2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <span className="text-sm text-muted-foreground font-mono flex-1 truncate">
          {window.location.origin}/avaliacao/{exp?.slug}
        </span>
        <Button size="sm" variant="ghost" className="rounded-full text-xs h-7" onClick={copyLink}>
          {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="amostras">
        <TabsList className="rounded-xl bg-muted/50 p-1 mb-6">
          <TabsTrigger value="amostras" className="rounded-lg gap-2 text-sm">
            <FlaskConical className="w-3.5 h-3.5" />
            Amostras ({amostras?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="atributos" className="rounded-lg gap-2 text-sm">
            <Sliders className="w-3.5 h-3.5" />
            Atributos ({atributos?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        {/* Amostras */}
        <TabsContent value="amostras" className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Produtos ou itens que serão avaliados neste experimento.
            </p>
            <Button size="sm" className="rounded-full gap-1.5" onClick={() => openAmostra()}>
              <Plus className="w-3.5 h-3.5" />
              Adicionar amostra
            </Button>
          </div>

          {amostrasLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-muted/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : amostras?.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
              <FlaskConical className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma amostra adicionada ainda.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {amostras?.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 bg-white border border-border/60 rounded-xl px-4 py-3 hover:border-border transition-colors animate-slide-in"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <div className="flex flex-col gap-0.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-md w-6 h-5 p-0 text-muted-foreground/40 hover:text-muted-foreground"
                      disabled={idx === 0}
                      onClick={() => moveAmostra(idx, -1)}
                    >
                      <ChevronUp className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-md w-6 h-5 p-0 text-muted-foreground/40 hover:text-muted-foreground"
                      disabled={idx === amostras.length - 1}
                      onClick={() => moveAmostra(idx, 1)}
                    >
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded-md text-muted-foreground">
                        {item.codigo}
                      </span>
                      <span className="text-sm font-medium text-foreground">{item.nome}</span>
                    </div>
                    {item.descricao && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.descricao}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full w-8 h-8 p-0"
                      onClick={() => openAmostra(item)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full w-8 h-8 p-0 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteAmostraMut.mutate({ id: item.id })}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Atributos */}
        <TabsContent value="atributos" className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Características sensoriais que serão avaliadas em cada amostra.
            </p>
            <Button size="sm" className="rounded-full gap-1.5" onClick={() => openAtributo()}>
              <Plus className="w-3.5 h-3.5" />
              Adicionar atributo
            </Button>
          </div>

          {atributosLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-muted/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : atributos?.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
              <Sliders className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum atributo adicionado ainda.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {atributos?.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 bg-white border border-border/60 rounded-xl px-4 py-3 hover:border-border transition-colors animate-slide-in"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <div className="flex flex-col gap-0.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-md w-6 h-5 p-0 text-muted-foreground/40 hover:text-muted-foreground"
                      disabled={idx === 0}
                      onClick={() => moveAtributo(idx, -1)}
                    >
                      <ChevronUp className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-md w-6 h-5 p-0 text-muted-foreground/40 hover:text-muted-foreground"
                      disabled={idx === atributos.length - 1}
                      onClick={() => moveAtributo(idx, 1)}
                    >
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground">{item.nome}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{item.labelMin}</span>
                      <span className="text-xs text-muted-foreground">→</span>
                      <span className="text-xs text-muted-foreground">{item.labelMax}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full w-8 h-8 p-0"
                      onClick={() => openAtributo(item)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full w-8 h-8 p-0 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteAtributoMut.mutate({ id: item.id })}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal editar experimento */}
      <Dialog open={editExpOpen} onOpenChange={setEditExpOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Playfair Display', serif" }}>
              Editar experimento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Título *</label>
              <Input
                value={editExpForm.titulo}
                onChange={(e) => setEditExpForm((f) => ({ ...f, titulo: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                value={editExpForm.descricao}
                onChange={(e) => setEditExpForm((f) => ({ ...f, descricao: e.target.value }))}
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditExpOpen(false)} className="rounded-full">
              Cancelar
            </Button>
            <Button
              onClick={() => updateExpMut.mutate({ id: experimentoId, ...editExpForm })}
              disabled={!editExpForm.titulo.trim() || updateExpMut.isPending}
              className="rounded-full"
            >
              {updateExpMut.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal amostra */}
      <Dialog
        open={amostraModal.open}
        onOpenChange={(o) => setAmostraModal({ open: o, editing: null })}
      >
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Playfair Display', serif" }}>
              {amostraModal.editing ? "Editar amostra" : "Nova amostra"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Código *</label>
                <Input
                  placeholder="Ex: A001"
                  value={amostraForm.codigo}
                  onChange={(e) => setAmostraForm((f) => ({ ...f, codigo: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nome *</label>
                <Input
                  placeholder="Ex: Café Bourbon"
                  value={amostraForm.nome}
                  onChange={(e) => setAmostraForm((f) => ({ ...f, nome: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                placeholder="Descrição opcional da amostra…"
                value={amostraForm.descricao}
                onChange={(e) => setAmostraForm((f) => ({ ...f, descricao: e.target.value }))}
                className="rounded-xl resize-none"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setAmostraModal({ open: false, editing: null })}
              className="rounded-full"
            >
              Cancelar
            </Button>
            <Button
              onClick={saveAmostra}
              disabled={
                !amostraForm.nome.trim() ||
                !amostraForm.codigo?.trim() ||
                createAmostraMut.isPending ||
                updateAmostraMut.isPending
              }
              className="rounded-full"
            >
              {createAmostraMut.isPending || updateAmostraMut.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal atributo */}
      <Dialog
        open={atributoModal.open}
        onOpenChange={(o) => setAtributoModal({ open: o, editing: null })}
      >
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Playfair Display', serif" }}>
              {atributoModal.editing ? "Editar atributo" : "Novo atributo"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nome do atributo *</label>
              <Input
                placeholder="Ex: Aroma, Sabor, Acidez…"
                value={atributoForm.nome}
                onChange={(e) => setAtributoForm((f) => ({ ...f, nome: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Descrição / instrução</label>
              <Textarea
                placeholder="Instrução para o avaliador…"
                value={atributoForm.descricao}
                onChange={(e) => setAtributoForm((f) => ({ ...f, descricao: e.target.value }))}
                className="rounded-xl resize-none"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Rótulo mínimo</label>
                <Input
                  placeholder="Muito Baixo"
                  value={atributoForm.labelMin}
                  onChange={(e) => setAtributoForm((f) => ({ ...f, labelMin: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Rótulo máximo</label>
                <Input
                  placeholder="Muito Alto"
                  value={atributoForm.labelMax}
                  onChange={(e) => setAtributoForm((f) => ({ ...f, labelMax: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setAtributoModal({ open: false, editing: null })}
              className="rounded-full"
            >
              Cancelar
            </Button>
            <Button
              onClick={saveAtributo}
              disabled={
                !atributoForm.nome.trim() ||
                createAtributoMut.isPending ||
                updateAtributoMut.isPending
              }
              className="rounded-full"
            >
              {createAtributoMut.isPending || updateAtributoMut.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
