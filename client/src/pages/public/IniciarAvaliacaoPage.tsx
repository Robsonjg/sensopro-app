import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FlaskConical,
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

type FormStep = "nome" | "amostra";

export default function IniciarAvaliacaoPage() {
  const utils = trpc.useUtils();

  const iniciarMut = trpc.avaliacao.iniciarSessao.useMutation();
  const salvarMut = trpc.avaliacao.salvarResposta.useMutation();
  const finalizarMut = trpc.avaliacao.finalizar.useMutation();

  const [phase, setPhase] = useState<Phase>("entrada");
  const [formStep, setFormStep] = useState<FormStep>("nome");

  const [nome, setNome] = useState("");
  const [codigoAmostra, setCodigoAmostra] = useState("");

  const [buscaAmostraErro, setBuscaAmostraErro] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [experimento, setExperimento] = useState<any | null>(null);
  const [atributos, setAtributos] = useState<any[]>([]);
  const [currentAmostra, setCurrentAmostra] = useState<any | null>(null);
  const [atributo_idx, setatributo_idx] = useState(0);
  const [respostas, setRespostas] = useState<Record<number, number>>({});
  const [observacoes, setObservacoes] = useState("");

  const [tempoInicio, setTempoInicio] = useState<number | null>(null);
  const [tempo_total, settempo_total] = useState(0);
  const [showObservacoes, setShowObservacoes] = useState(false);

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

  function resetForm() {
    setPhase("entrada");
    setFormStep("nome");
    setNome("");
    setCodigoAmostra("");
    setBuscaAmostraErro("");
    setSubmitting(false);
    setSessao(null);
    setExperimento(null);
    setAtributos([]);
    setCurrentAmostra(null);
    setatributo_idx(0);
    setRespostas({});
    setObservacoes("");
    setTempoInicio(null);
    settempo_total(0);
    setShowObservacoes(false);
  }

  function getValor(atributo_id: number): number {
    return respostas[atributo_id] ?? 0;
  }

  function setValor(atributo_id: number, valor: number) {
    setRespostas((prev) => ({
      ...prev,
      [atributo_id]: valor,
    }));
  }

  function handleNextStep() {
    if (formStep === "nome") {
      if (!nome.trim()) {
        toast.error("Digite seu nome");
        return;
      }
      setFormStep("amostra");
      return;
    }

    if (formStep === "amostra") {
      void handleIniciarAvaliacao();
    }
  }

  function handlePrevStep() {
    if (formStep === "amostra") {
      setFormStep("nome");
    }
  }

  async function handleIniciarAvaliacao() {
    if (!codigoAmostra.trim()) {
      setBuscaAmostraErro("Digite o número da amostra.");
      return;
    }

    setSubmitting(true);
    setBuscaAmostraErro("");

    try {
      const resultado = await utils.avaliacao.buscarAmostraGlobal.fetch({
        codigo: codigoAmostra.trim(),
      });

      const sessao_id = await iniciarMut.mutateAsync({
        experimento_id: resultado.experimento.id,
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
        experimento_id: resultado.experimento.id,
        finalizado: false,
        tempo_total: null,
      });

      setExperimento(resultado.experimento);
      setAtributos(resultado.atributos ?? []);
      setCurrentAmostra(resultado.amostra);
      setatributo_idx(0);
      setRespostas({});
      setObservacoes("");
      setShowObservacoes(false);
      setTempoInicio(null);
      setPhase("avaliacao");
    } catch (e: any) {
      setBuscaAmostraErro("Amostra não encontrada. Confira o número digitado.");
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

  async function handleFinalizarAvaliacao() {
    if (!sessao) return;

    setSubmitting(true);
    try {
      const tempo = tempoInicio ? Math.round((Date.now() - tempoInicio) / 1000) : 0;
      await finalizarMut.mutateAsync({
        sessao_id: sessao.id,
        tempo_total: tempo,
      });
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
          <span className="text-sm text-muted-foreground truncate">
            {experimento?.titulo ?? "Iniciar avaliação"}
          </span>
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
                    Iniciar avaliação
                  </h1>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Preencha seu nome e digite o número da amostra para começar.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className={`flex-1 h-1 rounded-full mr-1 ${formStep === "nome" ? "bg-primary" : "bg-primary/30"}`} />
                  <div className={`flex-1 h-1 rounded-full ml-1 ${formStep === "amostra" ? "bg-primary" : "bg-primary/30"}`} />
                </div>

                {formStep === "nome" && (
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
                      onKeyDown={(e) => e.key === "Enter" && handleNextStep()}
                      className="rounded-xl h-12 text-center"
                    />
                  </div>
                )}

                {formStep === "amostra" && (
                  <div className="space-y-6">
                    <div className="text-center mb-4">
                      <h2 className="text-xl font-semibold">Qual é o número da amostra?</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Digite o código informado para iniciar rapidamente
                      </p>
                    </div>
                    <Input
                      type="text"
                      placeholder="Ex: 381"
                      value={codigoAmostra}
                      onChange={(e) => {
                        setCodigoAmostra(e.target.value);
                        setBuscaAmostraErro("");
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleNextStep()}
                      className="rounded-xl h-12 text-center"
                    />
                    {buscaAmostraErro && (
                      <p className="text-xs text-destructive text-center">
                        {buscaAmostraErro}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mt-8">
                  <Button
                    variant="ghost"
                    onClick={handlePrevStep}
                    disabled={formStep === "nome"}
                    className="rounded-full gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Voltar
                  </Button>

                  <Button
                    onClick={handleNextStep}
                    disabled={submitting}
                    className="rounded-full gap-2 bg-primary hover:bg-primary/90 text-white"
                  >
                    {formStep === "amostra"
                      ? (submitting ? "Iniciando..." : "Iniciar Avaliação")
                      : "Próximo"}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {phase === "avaliacao" && !showObservacoes && currentAmostra && atributosPagina.length > 0 && (
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
                          <p className="text-sm text-muted-foreground">
                            {atributo.descricao}
                          </p>
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
                  className="rounded-full gap-2 bg-primary hover:bg-primary/90 text-white"
                >
                  {isLast ? "Finalizar" : "Próximo"}
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
                    Obrigado por avaliar a amostra {currentAmostra?.codigo}.
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
                    onClick={handleFinalizarAvaliacao}
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
                    Você pode iniciar uma nova avaliação agora.
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3 mt-8">
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    className="rounded-full"
                  >
                    Nova avaliação
                  </Button>

                  <Button
                    onClick={resetForm}
                    className="rounded-full bg-primary hover:bg-primary/90 text-white"
                  >
                    Voltar ao início
                  </Button>
                </div>
              </div>
            </div>
          )}

          {phase === "erro" && (
            <div className="animate-fade-in">
              <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-8 text-center">
                <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Erro ao iniciar avaliação</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Não foi possível carregar a amostra informada.
                </p>
                <Button onClick={resetForm} className="rounded-full">
                  Voltar ao início
                </Button>
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
