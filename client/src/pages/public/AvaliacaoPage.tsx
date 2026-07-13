import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useParams } from "wouter";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { FlaskConical, ChevronRight, ChevronLeft, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import SensorSlider from "@/components/SensorSlider";

type Phase = "entrada" | "avaliacao" | "obrigado" | "erro" | "jaRespondeu";

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

type Respostas = Record<number, Record<number, number>>;

type FormStep = "nome" | "idade" | "cidade" | "estado";

export default function AvaliacaoPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data, isLoading, error } = trpc.avaliacao.getExperimento.useQuery(
    { slug: slug! },
    { enabled: !!slug, retry: false }
  );

  const iniciarMut = trpc.avaliacao.iniciarSessao.useMutation();
  const salvarMut = trpc.avaliacao.salvarResposta.useMutation();
  const finalizarMut = trpc.avaliacao.finalizar.useMutation();

  const [phase, setPhase] = useState<Phase>("entrada");
  const [formStep, setFormStep] = useState<FormStep>("nome");
  const [nome, setNome] = useState("");
  const [idade, setIdade] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [idadeError, setIdadeError] = useState("");
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [respostas, setRespostas] = useState<Respostas>({});
  const [amostra_idx, setamostra_idx] = useState(0);
  const [atributo_idx, setatributo_idx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [tempoInicio, setTempoInicio] = useState<number | null>(null);
  const [tempo_total, settempo_total] = useState(0);
  const [showObservacoes, setShowObservacoes] = useState(false);

  const sliderRef = useRef<HTMLInputElement>(null);

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

  const totalSteps = amostras.length * atributos.length;
  const currentStep = amostra_idx * atributos.length + atributo_idx;
  const progress = totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0;

  const currentAmostra = amostras[amostra_idx];
  const currentAtributo = atributos[atributo_idx];

  function getValor(amostra_id: number, atributo_id: number): number {
    return respostas[amostra_id]?.[atributo_id] ?? 0;
  }

  function setValor(amostra_id: number, atributo_id: number, valor: number) {
    setRespostas((prev) => ({
      ...prev,
      [amostra_id]: { ...(prev[amostra_id] ?? {}), [atributo_id]: valor },
    }));
  }

  function handleNextStep() {
    if (formStep === "nome") {
      if (!nome.trim()) {
        toast.error("Digite seu nome");
        return;
      }
      setFormStep("idade");
    } else if (formStep === "idade") {
      const idadeNum = parseInt(idade);
      if (!idade.trim() || isNaN(idadeNum) || idadeNum <= 0 || idadeNum > 120) {
        setIdadeError("Digite uma idade válida (1-120)");
        return;
      }
      setIdadeError("");
      setFormStep("cidade");
    } else if (formStep === "cidade") {
      if (!cidade.trim()) {
        toast.error("Digite sua cidade");
        return;
      }
      setFormStep("estado");
    } else if (formStep === "estado") {
      if (!estado.trim()) {
        toast.error("Digite seu estado");
        return;
      }
      handleIniciar();
    }
  }

  function handlePrevStep() {
    if (formStep === "idade") {
      setFormStep("nome");
    } else if (formStep === "cidade") {
      setFormStep("idade");
    } else if (formStep === "estado") {
      setFormStep("cidade");
    }
  }

  async function handleIniciar() {
    setSubmitting(true);
    try {
      const sessao_id = await iniciarMut.mutateAsync({
        idade: parseInt(idade),
        cidade: cidade.trim(),
        estado: estado.trim(),
        pais: "Brasil",
        experimento_id: experimento!.id,
      });
      setSessao({ 
        id: sessao_id,
        nome: nome.trim(),
        idade: parseInt(idade),
        cidade: cidade.trim(),
        estado: estado.trim(),
        pais: "Brasil",
        observacoes: null,
        experimento_id: experimento!.id,
        finalizado: false,
        tempo_total: null
      });
      setPhase("avaliacao");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao iniciar avaliação.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSalvarEObservacoes() {
    if (!sessao || !currentAmostra || !currentAtributo) return;
    const valor = getValor(currentAmostra.id, currentAtributo.id);

    setSubmitting(true);
    try {
      await salvarMut.mutateAsync({
        sessao_id: sessao.id,
        atributo_id: currentAtributo.id,
        amostra_id: currentAmostra.id,
        valor,
      });
    } catch (e: any) {
      toast.error("Erro ao salvar resposta.");
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    setShowObservacoes(true);
  }

  async function handleFinalizarComObservacoes() {
    setSubmitting(true);
    try {
      const tempo = tempoInicio ? Math.round((Date.now() - tempoInicio) / 1000) : 0;
      await finalizarMut.mutateAsync({ sessao_id: sessao!.id, tempo_total: tempo });
      settempo_total(tempo);
      setPhase("obrigado");
    } catch (e: any) {
      toast.error("Erro ao finalizar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleProximo() {
    if (!sessao || !currentAmostra || !currentAtributo) return;
    const valor = getValor(currentAmostra.id, currentAtributo.id);

    setSubmitting(true);
    try {
      await salvarMut.mutateAsync({
        sessao_id: sessao.id,
        atributo_id: currentAtributo.id,
        amostra_id: currentAmostra.id,
        valor,
      });
    } catch (e: any) {
      toast.error("Erro ao salvar resposta.");
      setSubmitting(false);
      return;
    }
    setSubmitting(false);

    if (atributo_idx < atributos.length - 1) {
      setatributo_idx((i) => i + 1);
    } else if (amostra_idx < amostras.length - 1) {
      setamostra_idx((i) => i + 1);
      setatributo_idx(0);
    } else {
      // Última resposta - mostrar campo de observações
      setShowObservacoes(true);
    }
  }

  function handleAnterior() {
    if (atributo_idx > 0) {
      setatributo_idx((i) => i - 1);
    } else if (amostra_idx > 0) {
      setamostra_idx((i) => i - 1);
      setatributo_idx(atributos.length - 1);
    }
  }

  const isFirst = amostra_idx === 0 && atributo_idx === 0;
  const isLast = amostra_idx === amostras.length - 1 && atributo_idx === atributos.length - 1;

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

  if (error || !experimento) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-sm animate-fade-in">
          <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Avaliação indisponível</h2>
          <p className="text-sm text-muted-foreground">
            Esta avaliação não foi encontrada ou não está ativa no momento.
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
          {/* ── Tela de entrada com etapas ── */}
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
                {/* Indicador de etapa */}
                <div className="flex items-center justify-between mb-8">
                  <div className={`flex-1 h-1 rounded-full mr-1 ${formStep === "nome" ? "bg-primary" : "bg-primary/30"}`} />
                  <div className={`flex-1 h-1 rounded-full mx-1 ${formStep === "idade" ? "bg-primary" : "bg-primary/30"}`} />
                  <div className={`flex-1 h-1 rounded-full mx-1 ${formStep === "cidade" ? "bg-primary" : "bg-primary/30"}`} />
                  <div className={`flex-1 h-1 rounded-full mx-1 ${formStep === "estado" ? "bg-primary" : "bg-primary/30"}`} />
                </div>

                {/* Etapa 1 - Nome */}
                {formStep === "nome" && (
                  <div className="space-y-6">
                    <div className="text-center mb-4">
                      <h2 className="text-xl font-semibold">Qual é o seu nome?</h2>
                      <p className="text-sm text-muted-foreground mt-1">Sua resposta é anônima e confidencial</p>
                    </div>
                    <Input
                      type="text"
                      placeholder="Digite seu nome completo"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleNextStep()}
                      className="rounded-xl h-12 text-center"
                    />
                  </div>
                )}

                {/* Etapa 2 - Idade */}
                {formStep === "idade" && (
                  <div className="space-y-6">
                    <div className="text-center mb-4">
                      <h2 className="text-xl font-semibold">Qual é a sua idade?</h2>
                      <p className="text-sm text-muted-foreground mt-1">Sua resposta é anônima</p>
                    </div>
                    <Input
                      type="number"
                      placeholder="Digite sua idade"
                      value={idade}
                      onChange={(e) => {
                        setIdade(e.target.value);
                        setIdadeError("");
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleNextStep()}
                      className={`rounded-xl h-12 text-center ${idadeError ? "border-destructive" : ""}`}
                    />
                    {idadeError && (
                      <p className="text-xs text-destructive text-center">{idadeError}</p>
                    )}
                  </div>
                )}

                {/* Etapa 3 - Cidade */}
                {formStep === "cidade" && (
                  <div className="space-y-6">
                    <div className="text-center mb-4">
                      <h2 className="text-xl font-semibold">Qual é a sua cidade?</h2>
                      <p className="text-sm text-muted-foreground mt-1">Isso nos ajuda a entender melhor os resultados</p>
                    </div>
                    <Input
                      type="text"
                      placeholder="Digite sua cidade"
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleNextStep()}
                      className="rounded-xl h-12 text-center"
                    />
                  </div>
                )}

                {/* Etapa 4 - Estado */}
                {formStep === "estado" && (
                  <div className="space-y-6">
                    <div className="text-center mb-4">
                      <h2 className="text-xl font-semibold">Qual é o seu estado?</h2>
                      <p className="text-sm text-muted-foreground mt-1">Use a sigla (ex: SP, RJ, MG)</p>
                    </div>
                    <Input
                      type="text"
                      placeholder="Ex: SP"
                      value={estado}
                      onChange={(e) => setEstado(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === "Enter" && handleNextStep()}
                      className="rounded-xl h-12 text-center uppercase"
                      maxLength={2}
                    />
                  </div>
                )}

                {/* Botões de navegação */}
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
                    {formStep === "estado" ? (submitting ? "Iniciando..." : "Iniciar Avaliação") : "Próximo"}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── Tela de avaliação ── */}
          {phase === "avaliacao" && !showObservacoes && currentAmostra && currentAtributo && (
            <div className="animate-fade-in" key={`${amostra_idx}-${atributo_idx}`}>
              <div className="flex items-center justify-between mb-4 px-1">
                <span className="text-xs text-muted-foreground">
                  Amostra {amostra_idx + 1} de {amostras.length}
                </span>
                <span className="text-xs text-muted-foreground">
                  {currentStep + 1} / {totalSteps}
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
                <div className="mb-8">
                  <h2
                    className="text-xl font-semibold text-foreground mb-2"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {currentAtributo.nome}
                  </h2>
                  {currentAtributo.descricao && (
                    <p className="text-sm text-muted-foreground">{currentAtributo.descricao}</p>
                  )}
                </div>

                <div className="space-y-6 py-4">
                  <SensorSlider
                    value={getValor(currentAmostra.id, currentAtributo.id)}
                    onChange={(val) => setValor(currentAmostra.id, currentAtributo.id, val)}
                    min={0}
                    max={100}
                  />
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

          {/* ── Tela de observações finais ── */}
          {phase === "avaliacao" && showObservacoes && (
            <div className="animate-fade-in">
              <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-8">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    Avaliação concluída!
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Obrigado por avaliar todas as amostras.
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

          {/* ── Tela de agradecimento ── */}
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
