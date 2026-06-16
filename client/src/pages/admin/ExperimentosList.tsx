import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  FlaskConical,
  Settings,
  BarChart3,
  Share2,
  Power,
  PowerOff,
  Trash2,
  Copy,
  Check,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  onSelect: (id: number) => void;
  onDashboard: (id: number) => void;
}

export default function ExperimentosList({ onSelect, onDashboard }: Props) {
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
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  function copyLink(slug: string, id: number) {
    const url = `${window.location.origin}/avaliar/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-semibold text-foreground"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Experimentos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie seus experimentos de avaliação sensorial
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="rounded-full gap-2">
          <Plus className="w-4 h-4" />
          Novo experimento
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-muted/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : experimentos?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
            <FlaskConical className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-foreground mb-2">Nenhum experimento ainda</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            Crie seu primeiro experimento para começar a coletar avaliações sensoriais.
          </p>
          <Button onClick={() => setCreateOpen(true)} className="rounded-full gap-2">
            <Plus className="w-4 h-4" />
            Criar experimento
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {experimentos?.map((exp) => (
            <div
              key={exp.id}
              className="bg-white rounded-2xl border border-border/60 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant={exp.ativo ? "default" : "secondary"}
                      className={`text-xs rounded-full px-2 py-0.5 ${
                        exp.ativo
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {exp.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2">
                    {exp.titulo}
                  </h3>
                  {exp.descricao && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {exp.descricao}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-xs text-muted-foreground font-mono bg-muted/40 rounded-lg px-2.5 py-1.5 truncate">
                /avaliar/{exp.slug}
              </div>

              <div className="flex flex-wrap gap-2 mt-auto">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full gap-1.5 text-xs h-8 flex-1"
                  onClick={() => onSelect(exp.id)}
                >
                  <Settings className="w-3 h-3" />
                  Configurar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full gap-1.5 text-xs h-8 flex-1"
                  onClick={() => onDashboard(exp.id)}
                >
                  <BarChart3 className="w-3 h-3" />
                  Dashboard
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full gap-1.5 text-xs h-8 flex-1 text-muted-foreground hover:text-foreground"
                  onClick={() => copyLink(exp.slug, exp.id)}
                >
                  {copiedId === exp.id ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Share2 className="w-3 h-3" />
                  )}
                  {copiedId === exp.id ? "Copiado!" : "Compartilhar"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className={`rounded-full gap-1.5 text-xs h-8 ${
                    exp.ativo
                      ? "text-amber-600 hover:bg-amber-50"
                      : "text-emerald-600 hover:bg-emerald-50"
                  }`}
                  onClick={() =>
                    exp.ativo ? desativarMut.mutate({ id: exp.id }) : ativarMut.mutate({ id: exp.id })
                  }
                >
                  {exp.ativo ? <PowerOff className="w-3 h-3" /> : <Power className="w-3 h-3" />}
                  {exp.ativo ? "Desativar" : "Ativar"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full text-xs h-8 w-8 p-0 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setDeleteConfirm(exp.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal criar */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Playfair Display', serif" }}>
              Novo experimento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Título *</label>
              <Input
                placeholder="Ex: Avaliação de Cafés Especiais"
                value={form.titulo}
                onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Descrição</label>
              <Textarea
                placeholder="Descreva o objetivo deste experimento…"
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} className="rounded-full">
              Cancelar
            </Button>
            <Button
              onClick={() => createMut.mutate(form)}
              disabled={!form.titulo.trim() || createMut.isPending}
              className="rounded-full"
            >
              {createMut.isPending ? "Criando…" : "Criar experimento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal confirmar exclusão */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Esta ação é irreversível. Todos os dados do experimento serão removidos permanentemente.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)} className="rounded-full">
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="rounded-full"
              onClick={() => {
                if (deleteConfirm) {
                  deleteMut.mutate({ id: deleteConfirm });
                  setDeleteConfirm(null);
                }
              }}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
