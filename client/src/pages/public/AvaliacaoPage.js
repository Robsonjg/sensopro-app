import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useParams } from "wouter";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { FlaskConical, ChevronRight, ChevronLeft, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import SensorSlider from "@/components/SensorSlider";
export default function AvaliacaoPage() {
    const params = useParams();
    const slug = params.slug;
    const { data, isLoading, error } = trpc.avaliacao.getExperimento.useQuery({ slug: slug }, { enabled: !!slug, retry: false });
    const iniciarMut = trpc.avaliacao.iniciarSessao.useMutation();
    const salvarMut = trpc.avaliacao.salvarResposta.useMutation();
    const finalizarMut = trpc.avaliacao.finalizar.useMutation();
    const [phase, setPhase] = useState("entrada");
    const [formStep, setFormStep] = useState("nome");
    const [nome, setNome] = useState("");
    const [idade, setIdade] = useState("");
    const [cidade, setCidade] = useState("");
    const [estado, setEstado] = useState("");
    const [pais, setPais] = useState("");
    const [observacoes, setObservacoes] = useState("");
    const [idadeError, setIdadeError] = useState("");
    const [sessao, setSessao] = useState(null);
    const [respostas, setRespostas] = useState({});
    const [amostraIdx, setAmostraIdx] = useState(0);
    const [atributoIdx, setAtributoIdx] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [tempoInicio, setTempoInicio] = useState(null);
    const [tempoTotal, setTempoTotal] = useState(0);
    const [showObservacoes, setShowObservacoes] = useState(false);
    const sliderRef = useRef(null);
    useEffect(() => {
        if (phase === "avaliacao" && !tempoInicio) {
            setTempoInicio(Date.now());
        }
    }, [phase, tempoInicio]);
    useEffect(() => {
        if (phase === "obrigado" && tempoInicio) {
            const tempo = Math.round((Date.now() - tempoInicio) / 1000);
            setTempoTotal(tempo);
        }
    }, [phase, tempoInicio]);
    function formatarTempo(segundos) {
        const minutos = Math.floor(segundos / 60);
        const secs = segundos % 60;
        return `${minutos}m ${secs}s`;
    }
    const experimento = data?.experimento;
    const amostras = data?.amostras ?? [];
    const atributos = data?.atributos ?? [];
    const totalSteps = amostras.length * atributos.length;
    const currentStep = amostraIdx * atributos.length + atributoIdx;
    const progress = totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0;
    const currentAmostra = amostras[amostraIdx];
    const currentAtributo = atributos[atributoIdx];
    function getValor(amostraId, atributoId) {
        return respostas[amostraId]?.[atributoId] ?? 0;
    }
    function setValor(amostraId, atributoId, valor) {
        setRespostas((prev) => ({
            ...prev,
            [amostraId]: { ...(prev[amostraId] ?? {}), [atributoId]: valor },
        }));
    }
    function handleNextStep() {
        if (formStep === "nome") {
            if (!nome.trim()) {
                toast.error("Digite seu nome");
                return;
            }
            setFormStep("idade");
        }
        else if (formStep === "idade") {
            const idadeNum = parseInt(idade);
            if (!idade.trim() || isNaN(idadeNum) || idadeNum <= 0 || idadeNum > 120) {
                setIdadeError("Digite uma idade válida (1-120)");
                return;
            }
            setIdadeError("");
            setFormStep("cidade");
        }
        else if (formStep === "cidade") {
            if (!cidade.trim()) {
                toast.error("Digite sua cidade");
                return;
            }
            setFormStep("estado");
        }
        else if (formStep === "estado") {
            if (!estado.trim()) {
                toast.error("Digite seu estado");
                return;
            }
            setFormStep("pais");
        }
        else if (formStep === "pais") {
            if (!pais.trim()) {
                toast.error("Digite seu país");
                return;
            }
            // Iniciar avaliação
            handleIniciar();
        }
    }
    function handlePrevStep() {
        if (formStep === "idade") {
            setFormStep("nome");
        }
        else if (formStep === "cidade") {
            setFormStep("idade");
        }
        else if (formStep === "estado") {
            setFormStep("cidade");
        }
        else if (formStep === "pais") {
            setFormStep("estado");
        }
    }
    async function handleIniciar() {
        setSubmitting(true);
        try {
            const sessaoId = await iniciarMut.mutateAsync({
                idade: parseInt(idade),
                cidade: cidade.trim(),
                estado: estado.trim(),
                pais: pais.trim(),
                experimentoId: experimento.id,
            });
            setSessao({
                id: sessaoId,
                nome: nome.trim(),
                idade: parseInt(idade),
                cidade: cidade.trim(),
                estado: estado.trim(),
                pais: pais.trim(),
                observacoes: null,
                experimentoId: experimento.id,
                finalizado: false,
                tempoTotal: null
            });
            setPhase("avaliacao");
        }
        catch (e) {
            toast.error(e?.message ?? "Erro ao iniciar avaliação.");
        }
        finally {
            setSubmitting(false);
        }
    }
    async function handleSalvarEObservacoes() {
        if (!sessao || !currentAmostra || !currentAtributo)
            return;
        const valor = getValor(currentAmostra.id, currentAtributo.id);
        setSubmitting(true);
        try {
            await salvarMut.mutateAsync({
                sessaoId: sessao.id,
                atributoId: currentAtributo.id,
                amostraId: currentAmostra.id,
                valor,
            });
        }
        catch (e) {
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
            await finalizarMut.mutateAsync({ sessaoId: sessao.id, tempoTotal: tempo });
            setTempoTotal(tempo);
            setPhase("obrigado");
        }
        catch (e) {
            toast.error("Erro ao finalizar. Tente novamente.");
        }
        finally {
            setSubmitting(false);
        }
    }
    async function handleProximo() {
        if (!sessao || !currentAmostra || !currentAtributo)
            return;
        const valor = getValor(currentAmostra.id, currentAtributo.id);
        setSubmitting(true);
        try {
            await salvarMut.mutateAsync({
                sessaoId: sessao.id,
                atributoId: currentAtributo.id,
                amostraId: currentAmostra.id,
                valor,
            });
        }
        catch (e) {
            toast.error("Erro ao salvar resposta.");
            setSubmitting(false);
            return;
        }
        setSubmitting(false);
        if (atributoIdx < atributos.length - 1) {
            setAtributoIdx((i) => i + 1);
        }
        else if (amostraIdx < amostras.length - 1) {
            setAmostraIdx((i) => i + 1);
            setAtributoIdx(0);
        }
        else {
            // Última resposta - mostrar campo de observações
            setShowObservacoes(true);
        }
    }
    function handleAnterior() {
        if (atributoIdx > 0) {
            setAtributoIdx((i) => i - 1);
        }
        else if (amostraIdx > 0) {
            setAmostraIdx((i) => i - 1);
            setAtributoIdx(atributos.length - 1);
        }
    }
    const isFirst = amostraIdx === 0 && atributoIdx === 0;
    const isLast = amostraIdx === amostras.length - 1 && atributoIdx === atributos.length - 1;
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-background", children: _jsxs("div", { className: "flex flex-col items-center gap-3", children: [_jsx("div", { className: "w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" }), _jsx("span", { className: "text-sm text-muted-foreground", children: "Carregando avalia\u00E7\u00E3o\u2026" })] }) }));
    }
    if (error || !experimento) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-background px-4", children: _jsxs("div", { className: "text-center max-w-sm animate-fade-in", children: [_jsx("div", { className: "w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4", children: _jsx(AlertCircle, { className: "w-7 h-7 text-muted-foreground" }) }), _jsx("h2", { className: "text-lg font-semibold mb-2", children: "Avalia\u00E7\u00E3o indispon\u00EDvel" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Esta avalia\u00E7\u00E3o n\u00E3o foi encontrada ou n\u00E3o est\u00E1 ativa no momento." })] }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-background flex flex-col", children: [_jsxs("header", { className: "border-b border-border/60 bg-white/90 backdrop-blur-sm sticky top-0 z-10", children: [_jsxs("div", { className: "max-w-2xl mx-auto px-4 flex items-center gap-2.5 h-14", children: [_jsx(FlaskConical, { className: "w-4 h-4 text-primary" }), _jsx("span", { className: "font-semibold text-sm text-foreground", style: { fontFamily: "'Playfair Display', serif" }, children: "SensoPro" }), _jsx("span", { className: "text-muted-foreground/40 text-sm", children: "\u00B7" }), _jsx("span", { className: "text-sm text-muted-foreground truncate", children: experimento.titulo })] }), phase === "avaliacao" && !showObservacoes && (_jsx("div", { className: "h-1 bg-border/60", children: _jsx("div", { className: "h-full bg-primary transition-all duration-500 ease-out", style: { width: `${progress}%` } }) }))] }), _jsx("main", { className: "flex-1 flex items-start justify-center px-4 py-10", children: _jsxs("div", { className: "w-full max-w-xl", children: [phase === "entrada" && (_jsxs("div", { className: "animate-fade-in", children: [_jsxs("div", { className: "bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden mb-4", children: [_jsx("div", { className: "h-2 bg-primary" }), _jsxs("div", { className: "p-8", children: [_jsx("h1", { className: "text-2xl font-semibold text-foreground mb-2", style: { fontFamily: "'Playfair Display', serif" }, children: experimento.titulo }), experimento.descricao && (_jsx("p", { className: "text-sm text-muted-foreground leading-relaxed", children: experimento.descricao }))] })] }), _jsxs("div", { className: "bg-white rounded-2xl border border-border/60 shadow-sm p-8", children: [_jsxs("div", { className: "flex items-center justify-between mb-8", children: [_jsx("div", { className: `flex-1 h-1 rounded-full mr-1 ${formStep === "nome" ? "bg-primary" : "bg-primary/30"}` }), _jsx("div", { className: `flex-1 h-1 rounded-full mx-1 ${formStep === "idade" ? "bg-primary" : "bg-primary/30"}` }), _jsx("div", { className: `flex-1 h-1 rounded-full mx-1 ${formStep === "cidade" ? "bg-primary" : "bg-primary/30"}` }), _jsx("div", { className: `flex-1 h-1 rounded-full mx-1 ${formStep === "estado" ? "bg-primary" : "bg-primary/30"}` }), _jsx("div", { className: `flex-1 h-1 rounded-full ml-1 ${formStep === "pais" ? "bg-primary" : "bg-primary/30"}` })] }), formStep === "nome" && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "text-center mb-4", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Qual \u00E9 o seu nome?" }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Sua resposta \u00E9 an\u00F4nima e confidencial" })] }), _jsx(Input, { type: "text", placeholder: "Digite seu nome completo", value: nome, onChange: (e) => setNome(e.target.value), onKeyDown: (e) => e.key === "Enter" && handleNextStep(), className: "rounded-xl h-12 text-center" })] })), formStep === "idade" && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "text-center mb-4", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Qual \u00E9 a sua idade?" }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Sua resposta \u00E9 an\u00F4nima" })] }), _jsx(Input, { type: "number", placeholder: "Digite sua idade", value: idade, onChange: (e) => {
                                                        setIdade(e.target.value);
                                                        setIdadeError("");
                                                    }, onKeyDown: (e) => e.key === "Enter" && handleNextStep(), className: `rounded-xl h-12 text-center ${idadeError ? "border-destructive" : ""}` }), idadeError && (_jsx("p", { className: "text-xs text-destructive text-center", children: idadeError }))] })), formStep === "cidade" && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "text-center mb-4", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Qual \u00E9 a sua cidade?" }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Isso nos ajuda a entender melhor os resultados" })] }), _jsx(Input, { type: "text", placeholder: "Digite sua cidade", value: cidade, onChange: (e) => setCidade(e.target.value), onKeyDown: (e) => e.key === "Enter" && handleNextStep(), className: "rounded-xl h-12 text-center" })] })), formStep === "estado" && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "text-center mb-4", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Qual \u00E9 o seu estado?" }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Use a sigla (ex: SP, RJ, MG)" })] }), _jsx(Input, { type: "text", placeholder: "Ex: SP", value: estado, onChange: (e) => setEstado(e.target.value.toUpperCase()), onKeyDown: (e) => e.key === "Enter" && handleNextStep(), className: "rounded-xl h-12 text-center uppercase", maxLength: 2 })] })), formStep === "pais" && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "text-center mb-4", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Qual \u00E9 o seu pa\u00EDs?" }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Isso nos ajuda a entender melhor os resultados" })] }), _jsx(Input, { type: "text", placeholder: "Ex: Brasil", value: pais, onChange: (e) => setPais(e.target.value), onKeyDown: (e) => e.key === "Enter" && handleNextStep(), className: "rounded-xl h-12 text-center" })] })), _jsxs("div", { className: "flex items-center justify-between mt-8", children: [_jsxs(Button, { variant: "ghost", onClick: handlePrevStep, disabled: formStep === "nome", className: "rounded-full gap-2", children: [_jsx(ChevronLeft, { className: "w-4 h-4" }), "Voltar"] }), _jsxs(Button, { onClick: handleNextStep, disabled: submitting, className: "rounded-full gap-2 bg-primary hover:bg-primary/90 text-white", children: [formStep === "pais" ? (submitting ? "Iniciando..." : "Iniciar Avaliação") : "Próximo", _jsx(ChevronRight, { className: "w-4 h-4" })] })] })] })] })), phase === "avaliacao" && !showObservacoes && currentAmostra && currentAtributo && (_jsxs("div", { className: "animate-fade-in", children: [_jsxs("div", { className: "flex items-center justify-between mb-4 px-1", children: [_jsxs("span", { className: "text-xs text-muted-foreground", children: ["Amostra ", amostraIdx + 1, " de ", amostras.length] }), _jsxs("span", { className: "text-xs text-muted-foreground", children: [currentStep + 1, " / ", totalSteps] })] }), _jsxs("div", { className: "bg-primary/5 border border-primary/15 rounded-xl px-4 py-3 mb-4 flex items-center gap-3", children: [_jsx(FlaskConical, { className: "w-4 h-4 text-primary flex-shrink-0" }), _jsxs("div", { children: [_jsx("span", { className: "text-xs text-primary/70 font-medium", children: "Avaliando" }), _jsxs("p", { className: "text-sm font-semibold text-primary", children: [currentAmostra.codigo, " \u2014 ", currentAmostra.nome] })] })] }), _jsxs("div", { className: "bg-white rounded-2xl border border-border/60 shadow-sm p-8", children: [_jsxs("div", { className: "mb-8", children: [_jsx("h2", { className: "text-xl font-semibold text-foreground mb-2", style: { fontFamily: "'Playfair Display', serif" }, children: currentAtributo.nome }), currentAtributo.descricao && (_jsx("p", { className: "text-sm text-muted-foreground", children: currentAtributo.descricao }))] }), _jsx("div", { className: "space-y-6 py-4", children: _jsx(SensorSlider, { value: getValor(currentAmostra.id, currentAtributo.id), onChange: (val) => setValor(currentAmostra.id, currentAtributo.id, val), min: 0, max: 100 }) })] }), _jsxs("div", { className: "flex items-center justify-between mt-6", children: [_jsxs(Button, { variant: "ghost", onClick: handleAnterior, disabled: isFirst, className: "rounded-full gap-2", children: [_jsx(ChevronLeft, { className: "w-4 h-4" }), "Anterior"] }), _jsxs(Button, { onClick: handleProximo, className: "rounded-full gap-2 bg-primary hover:bg-primary/90 text-white", children: [isLast ? "Finalizar" : "Próximo", _jsx(ChevronRight, { className: "w-4 h-4" })] })] })] }, `${amostraIdx}-${atributoIdx}`)), phase === "avaliacao" && showObservacoes && (_jsx("div", { className: "animate-fade-in", children: _jsxs("div", { className: "bg-white rounded-2xl border border-border/60 shadow-sm p-8", children: [_jsxs("div", { className: "text-center mb-6", children: [_jsx("h2", { className: "text-xl font-semibold text-foreground mb-2", children: "Avalia\u00E7\u00E3o conclu\u00EDda!" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Obrigado por avaliar todas as amostras." })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("label", { className: "text-sm font-medium text-foreground", children: "Al\u00E9m desses atributos, foram identificados outros?" }), _jsx(Textarea, { placeholder: "Se sim, especifique (opcional)...", value: observacoes, onChange: (e) => setObservacoes(e.target.value), className: "rounded-xl min-h-[120px]" })] }), _jsx("div", { className: "flex items-center justify-end mt-8", children: _jsxs(Button, { onClick: handleFinalizarComObservacoes, disabled: submitting, className: "rounded-full gap-2 bg-primary hover:bg-primary/90 text-white", children: [submitting ? "Finalizando..." : "Finalizar Avaliação", _jsx(CheckCircle2, { className: "w-4 h-4" })] }) })] }) })), phase === "obrigado" && (_jsx("div", { className: "animate-fade-in text-center", children: _jsxs("div", { className: "bg-white rounded-2xl border border-border/60 shadow-sm p-12", children: [_jsx("div", { className: "w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6", children: _jsx(CheckCircle2, { className: "w-8 h-8 text-emerald-600" }) }), _jsx("h2", { className: "text-2xl font-semibold text-foreground mb-3", style: { fontFamily: "'Playfair Display', serif" }, children: "Avalia\u00E7\u00E3o finalizada!" }), _jsx("p", { className: "text-muted-foreground leading-relaxed max-w-xs mx-auto", children: "Suas respostas foram registradas com sucesso. Muito obrigado pela sua participa\u00E7\u00E3o!" }), _jsxs("div", { className: "mt-8 pt-6 border-t border-border/60 space-y-4", children: [_jsxs("div", { className: "flex items-center justify-center gap-2 text-muted-foreground", children: [_jsx(Clock, { className: "w-4 h-4" }), _jsx("span", { className: "text-sm", children: "Tempo total de avalia\u00E7\u00E3o" })] }), _jsx("div", { className: "text-3xl font-bold text-primary tabular-nums", children: formatarTempo(tempoTotal) }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Voc\u00EA pode fechar esta janela com seguran\u00E7a." })] })] }) }))] }) }), _jsx("footer", { className: "border-t border-border/60 py-5", children: _jsx("div", { className: "max-w-2xl mx-auto px-4 text-center text-xs text-muted-foreground", children: "Plataforma SensoPro \u2014 Avalia\u00E7\u00E3o Sensorial" }) })] }));
}
