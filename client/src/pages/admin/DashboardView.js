import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, } from "recharts";
import { Download, Users, BarChart3, FlaskConical } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
const COLORS = [
    "#e63e6d", "#c91b4a", "#f06f90", "#f5a7bc", "#f9cfdb",
    "#1a2b5e", "#4f46e5", "#818cf8", "#a5b4fc", "#c7d2fe",
];
export default function DashboardView({ experimentoId, onSelectExp }) {
    const { data: allExps } = trpc.experimentos.listar.useQuery();
    const [selectedId, setSelectedId] = useState(experimentoId);
    const activeId = selectedId ?? experimentoId;
    const { data, isLoading } = trpc.dashboard.getData.useQuery({ experimentoId: activeId }, { enabled: !!activeId });
    const { data: exportData } = trpc.dashboard.exportar.useQuery({ experimentoId: activeId }, { enabled: !!activeId });
    const chartData = useMemo(() => {
        if (!data)
            return { porAtributo: [], porAmostra: [] };
        const { medias, atributos, amostras } = data;
        const porAtributo = atributos.map((attr) => {
            const entry = { atributo: attr.nome };
            amostras.forEach((am) => {
                const m = medias.find((x) => x.atributoId === attr.id && x.amostraId === am.id);
                entry[am.codigo] = m ? Number(Number(m.media).toFixed(1)) : 0;
            });
            return entry;
        });
        const porAmostra = amostras.map((am) => {
            const vals = medias.filter((x) => x.amostraId === am.id).map((x) => Number(x.media));
            const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
            return { amostra: am.codigo, nome: am.nome, media: Number(avg.toFixed(1)) };
        });
        return { porAtributo, porAmostra };
    }, [data]);
    function handleExport() {
        if (!exportData || !data)
            return;
        const { amostras, atributos, respostas } = exportData;
        const rows = respostas.map((r) => {
            const am = amostras.find((a) => a.id === r.amostraId);
            const at = atributos.find((a) => a.id === r.atributoId);
            return {
                "Sessão ID": r.sessaoId,
                Idade: r.idade ?? "",
                Cidade: r.cidade ?? "",
                Estado: r.estado ?? "",
                País: r.pais ?? "",
                "Data/Hora": r.finalizadoEm ? new Date(r.finalizadoEm).toLocaleString("pt-BR") : "",
                "Tempo (s)": r.tempoTotal ?? "",
                "Amostra (Código)": am?.codigo ?? "",
                "Amostra (Nome)": am?.nome ?? "",
                Atributo: at?.nome ?? "",
                Valor: r.valor,
            };
        });
        const mediasRows = [];
        atributos.forEach((attr) => {
            const row = { Atributo: attr.nome };
            amostras.forEach((am) => {
                const m = data.medias.find((x) => x.atributoId === attr.id && x.amostraId === am.id);
                row[am.codigo] = m ? Number(Number(m.media).toFixed(2)) : "-";
            });
            mediasRows.push(row);
        });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Respostas");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mediasRows), "Médias");
        XLSX.writeFile(wb, `sensopro_${data.experimento.slug}_${Date.now()}.xlsx`);
        toast.success("Planilha exportada com sucesso!");
    }
    return (_jsxs("div", { style: { animation: 'fadeIn 0.3s ease-out' }, children: [_jsx("style", { children: `
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .dashboard-stats-card {
            background: white;
            border-radius: 16px;
            border: 1px solid #e2e8f0;
            padding: 20px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          }
          .dashboard-chart-card {
            background: white;
            border-radius: 16px;
            border: 1px solid #e2e8f0;
            padding: 24px;
            margin-bottom: 24px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          }
          .dashboard-table {
            background: white;
            border-radius: 16px;
            border: 1px solid #e2e8f0;
            overflow: hidden;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          }
          .dashboard-table th {
            text-align: left;
            padding: 12px 24px;
            font-size: 12px;
            font-weight: 500;
            color: #64748b;
            background-color: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
          }
          .dashboard-table td {
            padding: 12px 24px;
            font-size: 14px;
            color: #0f172a;
            border-bottom: 1px solid #e2e8f0;
          }
          .dashboard-table tr:hover {
            background-color: #f8fafc;
          }
        ` }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }, children: [_jsxs("div", { children: [_jsx("h1", { style: { fontSize: '24px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }, children: "Dashboard" }), _jsx("p", { style: { fontSize: '14px', color: '#64748b' }, children: "Visualize e exporte os resultados das avalia\u00E7\u00F5es" })] }), _jsxs(Button, { onClick: handleExport, disabled: !exportData || !data?.total, variant: "outline", style: { gap: '8px', borderRadius: '9999px' }, children: [_jsx(Download, { size: 16 }), "Exportar Excel"] })] }), _jsx("div", { style: { marginBottom: '24px' }, children: _jsxs(Select, { value: activeId?.toString() ?? "", onValueChange: (v) => {
                        const id = parseInt(v);
                        setSelectedId(id);
                        onSelectExp(id);
                    }, children: [_jsx(SelectTrigger, { style: { width: '100%', maxWidth: '280px', borderRadius: '12px' }, children: _jsx(SelectValue, { placeholder: "Selecione um experimento\u2026" }) }), _jsx(SelectContent, { children: allExps?.map((exp) => (_jsx(SelectItem, { value: exp.id.toString(), children: exp.titulo }, exp.id))) })] }) }), !activeId ? (_jsxs("div", { style: { textAlign: 'center', padding: '96px 0' }, children: [_jsx(BarChart3, { size: 48, style: { color: '#94a3b8', margin: '0 auto 16px' } }), _jsx("p", { style: { color: '#64748b' }, children: "Selecione um experimento para ver o dashboard." })] })) : isLoading ? (_jsx("div", { style: { display: 'flex', justifyContent: 'center', padding: '96px 0' }, children: _jsx("div", { style: { width: '24px', height: '24px', border: '2px solid #e63e6d', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' } }) })) : (_jsxs(_Fragment, { children: [_jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }, children: [_jsxs("div", { className: "dashboard-stats-card", children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }, children: [_jsx("div", { style: { width: '36px', height: '36px', background: '#fce7ed', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: _jsx(Users, { size: 16, style: { color: '#e63e6d' } }) }), _jsx("span", { style: { fontSize: '14px', color: '#64748b' }, children: "Avaliadores" })] }), _jsx("p", { style: { fontSize: '32px', fontWeight: 600, color: '#0f172a' }, children: data?.total ?? 0 })] }), _jsxs("div", { className: "dashboard-stats-card", children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }, children: [_jsx("div", { style: { width: '36px', height: '36px', background: '#fce7ed', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: _jsx(FlaskConical, { size: 16, style: { color: '#e63e6d' } }) }), _jsx("span", { style: { fontSize: '14px', color: '#64748b' }, children: "Amostras" })] }), _jsx("p", { style: { fontSize: '32px', fontWeight: 600, color: '#0f172a' }, children: data?.amostras.length ?? 0 })] }), _jsxs("div", { className: "dashboard-stats-card", children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }, children: [_jsx("div", { style: { width: '36px', height: '36px', background: '#fce7ed', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: _jsx(BarChart3, { size: 16, style: { color: '#e63e6d' } }) }), _jsx("span", { style: { fontSize: '14px', color: '#64748b' }, children: "Atributos" })] }), _jsx("p", { style: { fontSize: '32px', fontWeight: 600, color: '#0f172a' }, children: data?.atributos.length ?? 0 })] })] }), data?.total === 0 ? (_jsxs("div", { style: { textAlign: 'center', padding: '64px 0', border: '2px dashed #e2e8f0', borderRadius: '16px' }, children: [_jsx(BarChart3, { size: 40, style: { color: '#94a3b8', margin: '0 auto 12px' } }), _jsx("p", { style: { color: '#64748b', fontSize: '14px' }, children: "Nenhuma avalia\u00E7\u00E3o recebida ainda. Compartilhe o link com os avaliadores." })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "dashboard-chart-card", children: [_jsx("h3", { style: { fontWeight: 600, color: '#0f172a', marginBottom: '4px' }, children: "M\u00E9dias por Atributo" }), _jsx("p", { style: { fontSize: '12px', color: '#64748b', marginBottom: '20px' }, children: "Comparativo entre amostras para cada atributo avaliado" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(BarChart, { data: chartData.porAtributo, margin: { top: 5, right: 20, bottom: 5, left: 0 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f0f0f0" }), _jsx(XAxis, { dataKey: "atributo", tick: { fontSize: 11, fill: "#94a3b8" }, axisLine: false, tickLine: false }), _jsx(YAxis, { domain: [0, 100], tick: { fontSize: 11, fill: "#94a3b8" }, axisLine: false, tickLine: false }), _jsx(Tooltip, { contentStyle: { borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" } }), _jsx(Legend, { wrapperStyle: { fontSize: "12px", paddingTop: "16px" } }), data?.amostras.map((am, i) => (_jsx(Bar, { dataKey: am.codigo, name: `${am.codigo} — ${am.nome}`, fill: COLORS[i % COLORS.length], radius: [4, 4, 0, 0] }, am.id)))] }) })] }), _jsxs("div", { className: "dashboard-chart-card", children: [_jsx("h3", { style: { fontWeight: 600, color: '#0f172a', marginBottom: '4px' }, children: "M\u00E9dia Geral por Amostra" }), _jsx("p", { style: { fontSize: '12px', color: '#64748b', marginBottom: '20px' }, children: "Pontua\u00E7\u00E3o m\u00E9dia considerando todos os atributos" }), _jsx(ResponsiveContainer, { width: "100%", height: 240, children: _jsxs(BarChart, { data: chartData.porAmostra, margin: { top: 5, right: 20, bottom: 5, left: 0 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f0f0f0" }), _jsx(XAxis, { dataKey: "amostra", tick: { fontSize: 11, fill: "#94a3b8" }, axisLine: false, tickLine: false }), _jsx(YAxis, { domain: [0, 100], tick: { fontSize: 11, fill: "#94a3b8" }, axisLine: false, tickLine: false }), _jsx(Tooltip, { contentStyle: { borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" } }), _jsx(Bar, { dataKey: "media", name: "M\u00E9dia", fill: "#e63e6d", radius: [6, 6, 0, 0] })] }) })] }), _jsxs("div", { className: "dashboard-table", children: [_jsx("div", { style: { padding: '16px 24px', borderBottom: '1px solid #e2e8f0' }, children: _jsx("h3", { style: { fontWeight: 600, color: '#0f172a' }, children: "Avaliadores que responderam" }) }), _jsx("div", { style: { overflowX: 'auto' }, children: _jsxs("table", { style: { width: '100%', fontSize: '14px' }, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Idade" }), _jsx("th", { children: "Cidade" }), _jsx("th", { children: "Estado" }), _jsx("th", { children: "Pa\u00EDs" }), _jsx("th", { children: "Tempo (s)" }), _jsx("th", { children: "Data" })] }) }), _jsx("tbody", { children: data?.sessoesFinalizadas?.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 6, style: { textAlign: 'center', padding: '32px', color: '#64748b' }, children: "Nenhuma avalia\u00E7\u00E3o realizada ainda" }) })) : (data?.sessoesFinalizadas?.map((s, i) => (_jsxs("tr", { style: { borderTop: '1px solid #e2e8f0' }, children: [_jsx("td", { style: { fontWeight: 500 }, children: s.idade ?? "—" }), _jsx("td", { children: s.cidade ?? "—" }), _jsx("td", { children: s.estado ?? "—" }), _jsx("td", { children: s.pais ?? "—" }), _jsx("td", { children: s.tempoTotal ?? "—" }), _jsx("td", { children: s.finalizadoEm ? new Date(s.finalizadoEm).toLocaleString("pt-BR") : "—" })] }, s.id)))) })] }) })] })] }))] }))] }));
}
