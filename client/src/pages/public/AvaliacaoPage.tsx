import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useParams } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  FlaskConical,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import SensorSlider from "@/components/SensorSlider";

type Phase = "entrada" | "avaliacao" | "obrigado" | "erro";

interface Sessao {
  id: number;
  nome: string | null;
  idade: number | null;
  cidade: string | null;
  estado: string | null;
  pais: string | null;
  observacoes: string | null;
  experimento_id: number;
  finalizado: boolean;
  tempo_total: number | null;
}

export default function AvaliacaoPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const utils = trpc.useUtils();

  const { data, isLoading, error } = trpc.avaliacao.getExperimento.useQuery(
    { slug: slug! },
    { enabled: !!slug, retry: false }
  );

  const iniciarMut = trpc.avaliacao.iniciarSessao.useMutation();
  const salvarMut = trpc.avaliacao.salvarResposta.useMutation();
  const finalizarMut = trpc.avaliacao.finalizar.useMutation();

  const [phase, setPhase] = useState<Phase>("entrada");
  const [nome, setNome] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [respostas, setRespostas] = useState<Record<number, number>>({});
  const [atributo_idx, setatributo_idx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [tempoInicio, setTempoInicio] = useState<number | null>(null);
  const [tempo_total, settempo_total] = useState(0);
  const [showObservacoes, setShowObservacoes] = useState(false);

  useEffect(() => {
    if (phase === "avaliacao" && !tempoInicio) {
      setTempoInicio(Date.now());
    }
  }, [phase, tempoInicio]);

  useEffect(() => {
    if (phase === "obrigado" && tempoInicio) {
      const tempo = Math.round((Date.now() - tempoInicio) / 1000);
      settempo_total(tempo);
    }
  }, [phase, tempoInicio]);

  function formatarTempo(segundos: number): string {
    const minutos = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${minutos}m ${secs}s`;
  }

  const experimento = data?.experimento;
  const amostras = data?.amostras ?? [];
  const atributos = data?.atributos ?? [];
  const currentAmostra = amostras[0] ?? null;

  const ATRIBUTOS_POR_PAGINA = Math.ceil(atributos.length / 2) || 1;
  const paginaAtual = Math.floor(atributo_idx / ATRIBUTOS_POR_PAGINA);
  const totalPaginas = Math.ceil(atributos.length / ATRIBUTOS_POR_PAGINA);
  const atributosPagina = atributos.slice(
    paginaAtual * ATRIBUTOS_POR_PAGINA,
    paginaAtual * ATRIBUTOS_POR_PAGINA + ATRIBUTOS_POR_PAGINA
  );

  const totalSteps = totalPaginas;
  const currentStep = paginaAtual;
  const progress =
    totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0;

  function getValor(atributo_id: number): number {
    return respostas[atributo_id] ?? 0;
  }

  function setValor(atributo_id: number, valor: number) {
    setRespostas((prev) => ({
      ...prev,
      [atributo_id]: valor,
    }));
  }

  async function handleIniciar() {
    if (!nome.trim()) {
      toast.error("Digite seu nome");
      return;
    }

    if (!experimento || !currentAmostra) {
      toast.error("Amostra não encontrada para este link.");
      return;
    }

    setSubmitting(true);
    try {
      const sessao_id = await iniciarMut.mutateAsync({
        experimento_id: experimento.id,
        nome: nome.trim(),
      });

      setSessao({
        id: sessao_id,
        nome: nome.trim(),
        idade: null,
        cidade: null,
        estado: null,
        pais: null,
        observacoes: null,
        experimento_id: experimento.id,
        finalizado: false,
        tempo_total: null,
      });

      setatributo_idx(0);
      setRespostas({});
      setObservacoes("");
      setShowObservacoes(false);
      setPhase("avaliacao");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao iniciar avaliação.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleProximo() {
    if (!sessao || !currentAmostra || atributosPagina.length === 0) return;

    setSubmitting(true);

    try {
      for (const atributo of atributosPagina) {
        const valor = getValor(atributo.id);

        await salvarMut.mutateAsync({
          sessao_id: sessao.id,
          atributo_id: atributo.id,
          amostra_id: currentAmostra.id,
          valor,
        });
      }
    } catch (e: any) {
      toast.error("Erro ao salvar respostas.");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);

    const proximoIndice = atributo_idx + ATRIBUTOS_POR_PAGINA;

    if (proximoIndice < atributos.length) {
      setatributo_idx(proximoIndice);
      return;
    }

    setShowObservacoes(true);
  }

  function handleAnterior() {
    if (atributo_idx > 0) {
      setatributo_idx((i) => Math.max(0, i - ATRIBUTOS_POR_PAGINA));
    }
  }

  async function handleFinalizarComObservacoes() {
    if (!sessao) return;

    setSubmitting(true);
    try {
      const tempo = tempoInicio ? Math.round((Date.now() - tempoInicio) / 1000) : 0;
      await finalizarMut.mutateAsync({ sessao_id: sessao.id, tempo_total: tempo });
      settempo_total(tempo);
      setPhase("obrigado");
    } catch (e: any) {
      toast.error("Erro ao finalizar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  const isFirst = atributo_idx === 0;
  const isLast = atributo_idx + ATRIBUTOS_POR_PAGINA >= atributos.length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Carregando avaliação…</span>
        </div>
      </div>
    );
  }

  if (error || !experimento || !currentAmostra) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-sm animate-fade-in">
          <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Avaliação indisponível</h2>
          <p className="text-sm text-muted-foreground">
            Esta avaliação não foi encontrada, não está ativa ou não possui amostra cadastrada.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/60 bg-white/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 flex items-center gap-2.5 h-14">
          <FlaskConical className="w-4 h-4 text-primary" />
          <span
            className="font-semibold text-sm text-foreground"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            SensoPro
          </span>
          <span className="text-muted-foreground/40 text-sm">·</span>
          <span className="text-sm text-muted-foreground truncate">{experimento.titulo}</span>
        </div>
        {phase === "avaliacao" && !showObservacoes && (
          <div className="h-1 bg-border/60">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-xl">
          {phase === "entrada" && (
            <div className="animate-fade-in">
              <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden mb-4">
                <div className="h-2 bg-primary" />
                <div className="p-8">
                  <h1
                    className="text-2xl font-semibold text-foreground mb-2"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {experimento.titulo}
                  </h1>
                  {experimento.descricao && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {experimento.descricao}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex-1 h-1 rounded-full bg-primary" />
                </div>

                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <h2 className="text-xl font-semibold">Qual é o seu nome?</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Sua resposta será identificada no relatório.
                    </p>
                  </div>
                  <Input
                    type="text"
                    placeholder="Digite seu nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleIniciar()}
                    className="rounded-xl h-12 text-center"
                  />
                </div>

                <div className="flex items-center justify-between mt-8">
                  <Button
                    variant="ghost"
                    disabled
                    className="rounded-full gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Voltar
                  </Button>

                  <Button
                    onClick={handleIniciar}
                    disabled={submitting}
                    className="rounded-full gap-2 bg-primary hover:bg-primary/90 text-white"
                  >
                    {submitting ? "Iniciando..." : "Iniciar Avaliação"}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {phase === "avaliacao" && !showObservacoes && atributosPagina.length > 0 && (
            <div className="animate-fade-in" key={`${currentAmostra.id}-${atributo_idx}`}>
              <div className="flex items-center justify-between mb-4 px-1">
                <span className="text-xs text-muted-foreground">
                  Participante: {sessao?.nome ?? "—"}
                </span>
                <span className="text-xs text-muted-foreground">
                  Página {currentStep + 1} de {totalSteps}
                </span>
              </div>

              <div className="bg-primary/5 border border-primary/15 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
                <FlaskConical className="w-4 h-4 text-primary flex-shrink-0" />
                <div>
                  <span className="text-xs text-primary/70 font-medium">Avaliando</span>
                  <p className="text-sm font-semibold text-primary">
                    {currentAmostra.codigo} — {currentAmostra.nome}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-8">
                <div className="space-y-8">
                  {atributosPagina.map((atributo) => (
                    <div
                      key={atributo.id}
                      className="border-b border-border/60 pb-6 last:border-b-0 last:pb-0"
                    >
                      <div className="mb-4">
                        <h2
                          className="text-lg font-semibold text-foreground mb-1"
                          style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                          {atributo.nome}
                        </h2>

                        {atributo.descricao && (
                          <p className="text-sm text-muted-foreground">{atributo.descricao}</p>
                        )}
                      </div>

                      <SensorSlider
                        value={getValor(atributo.id)}
                        onChange={(val) => setValor(atributo.id, val)}
                        min={0}
                        max={100}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between mt-6">
                <Button
                  variant="ghost"
                  onClick={handleAnterior}
                  disabled={isFirst}
                  className="rounded-full gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>

                <Button
                  onClick={handleProximo}
                  disabled={submitting}
                  className="rounded-full gap-2 bg-primary hover:bg-primary/90 text-white"
                >
                  {submitting ? "Salvando..." : isLast ? "Finalizar" : "Próximo"}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {phase === "avaliacao" && showObservacoes && (
            <div className="animate-fade-in">
              <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-8">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    Avaliação concluída!
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Obrigado por avaliar a amostra {currentAmostra.codigo}.
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-medium text-foreground">
                    Além desses atributos, foram identificados outros?
                  </label>
                  <Textarea
                    placeholder="Se sim, especifique (opcional)..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    className="rounded-xl min-h-[120px]"
                  />
                </div>

                <div className="flex items-center justify-end mt-8">
                  <Button
                    onClick={handleFinalizarComObservacoes}
                    disabled={submitting}
                    className="rounded-full gap-2 bg-primary hover:bg-primary/90 text-white"
                  >
                    {submitting ? "Finalizando..." : "Finalizar Avaliação"}
                    <CheckCircle2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {phase === "obrigado" && (
            <div className="animate-fade-in text-center">
              <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-12">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h2
                  className="text-2xl font-semibold text-foreground mb-3"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Avaliação finalizada!
                </h2>
                <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  Suas respostas foram registradas com sucesso. Muito obrigado pela sua participação!
                </p>
                <div className="mt-8 pt-6 border-t border-border/60 space-y-4">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Tempo total de avaliação</span>
                  </div>
                  <div className="text-3xl font-bold text-primary tabular-nums">
                    {formatarTempo(tempo_total)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Você pode fechar esta janela com segurança.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-border/60 py-5">
        <div className="max-w-2xl mx-auto px-4 text-center text-xs text-muted-foreground">
          Plataforma SensoPro — Avaliação Sensorial
        </div>
      </footer>
    </div>
  );
}
