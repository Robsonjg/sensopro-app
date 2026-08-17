import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import {
  Download,
  Users,
  BarChart3,
  FlaskConical,
  RotateCcw,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface Props {
  experimento_id: number | null;
  onSelectExp: (id: number) => void;
}

const COLORS = [
  "#e63e6d",
  "#c91b4a",
  "#f06f90",
  "#f5a7bc",
  "#f9cfdb",
  "#1a2b5e",
  "#4f46e5",
  "#818cf8",
  "#a5b4fc",
  "#c7d2fe",
];

export default function DashboardView({
  experimento_id,
  onSelectExp,
}: Props) {
  const utils = trpc.useUtils();
  const { data: allExps } = trpc.experimentos.listar.useQuery();

  const [selectedId, setSelectedId] = useState<number | null>(experimento_id);
  const activeId = selectedId ?? experimento_id;

  const { data, isLoading } = trpc.dashboard.getData.useQuery(
    { experimento_id: activeId! },
    { enabled: !!activeId }
  );

  const { data: exportData } = trpc.dashboard.exportar.useQuery(
    { experimento_id: activeId! },
    { enabled: !!activeId }
  );

  const limparMut = trpc.dashboard.limparResultados.useMutation({
    onSuccess: async () => {
      if (activeId) {
        await utils.dashboard.getData.invalidate({
          experimento_id: activeId,
        });
        await utils.dashboard.exportar.invalidate({
          experimento_id: activeId,
        });
      }

      toast.success(
        "Resultados limpos. O experimento está pronto para começar do zero."
      );
    },
    onError: (e) => toast.error(e.message),
  });

  const chartData = useMemo(() => {
    if (!data) {
      return {
        porAtributo: [] as Record<string, unknown>[],
        porAmostra: [] as Record<string, unknown>[],
      };
    }

    const { medias, atributos, amostras } = data;

    const porAtributo = atributos.map((attr: any) => {
      const entry: Record<string, unknown> = {
        atributo: attr.nome,
      };

      amostras.forEach((am: any) => {
        const media = medias.find(
          (x: any) =>
            (x.atributo_id ?? x.atributoId) === attr.id &&
            (x.amostra_id ?? x.amostraId) === am.id
        );

        entry[am.codigo] = media ? Number(media.media) : 0;
      });

      return entry;
    });

    const porAmostra = amostras.map((am: any) => {
      const valores = medias
        .filter(
          (x: any) => (x.amostra_id ?? x.amostraId) === am.id
        )
        .map((x: any) => Number(x.media))
        .filter((v: number) => Number.isFinite(v));

      const mediaGeral = valores.length
        ? valores.reduce((soma: number, valor: number) => soma + valor, 0) /
          valores.length
        : 0;

      return {
        amostra: am.codigo,
        nome: am.nome,
        media: mediaGeral,
      };
    });

    return {
      porAtributo,
      porAmostra,
    };
  }, [data]);

  function handleExport() {
    if (!exportData || !data) return;

    const { amostras, atributos, respostas } = exportData;

    const numero = (valor: unknown): number | "" => {
      const n = Number(valor);
      return Number.isFinite(n) ? n : "";
    };

    const arredondar4 = (valor: unknown): number | "" => {
      const n = Number(valor);
      return Number.isFinite(n) ? Number(n.toFixed(4)) : "";
    };

    const desvioPadraoAmostral = (valores: number[]): number | "" => {
      if (valores.length === 0) return "";
      if (valores.length === 1) return 0;

      const media =
        valores.reduce((soma, valor) => soma + valor, 0) / valores.length;

      const somaQuadrados = valores.reduce(
        (soma, valor) => soma + Math.pow(valor - media, 2),
        0
      );

      return Math.sqrt(somaQuadrados / (valores.length - 1));
    };

    const buscarAmostra = (r: any) =>
      amostras.find(
        (a: any) => a.id === (r.amostra_id ?? r.amostraId)
      ) ??
      amostras.find((a: any) => a.nome === r.amostraNome);

    const buscarAtributo = (r: any) =>
      atributos.find(
        (a: any) => a.id === (r.atributo_id ?? r.atributoId)
      ) ??
      atributos.find((a: any) => a.nome === r.atributoNome);

    const formatarPlanilha = (
      ws: XLSX.WorkSheet,
      rows: Record<string, unknown>[],
      decimalHeaders: string[] = []
    ) => {
      if (!rows.length || !ws["!ref"]) return;

      const headers = Object.keys(rows[0]);

      ws["!cols"] = headers.map((header) => {
        let maxLength = header.length;

        for (const row of rows) {
          maxLength = Math.max(
            maxLength,
            String(row[header] ?? "").length
          );
        }

        return {
          wch: Math.min(Math.max(maxLength + 2, 12), 45),
        };
      });

      ws["!autofilter"] = {
        ref: ws["!ref"],
      };

      decimalHeaders.forEach((header) => {
        const colIndex = headers.indexOf(header);
        if (colIndex < 0) return;

        for (let rowIndex = 1; rowIndex <= rows.length; rowIndex++) {
          const address = XLSX.utils.encode_cell({
            r: rowIndex,
            c: colIndex,
          });

          const cell = ws[address];

          if (cell && cell.t === "n") {
            cell.z = "0.0000";
          }
        }
      });
    };

    // ============================================================
    // 1) MATRIZ SENSORIAL / RESULTADOS
    // 1 linha por avaliador + amostra.
    // Cada atributo fica em uma coluna.
    // ============================================================
    const matrizMap = new Map<string, Record<string, unknown>>();

    respostas.forEach((r: any) => {
      const amostra = buscarAmostra(r);
      const atributo = buscarAtributo(r);

      const sessaoId = r.sessao_id ?? r.sessaoId ?? "";
      const codigo = amostra?.codigo ?? "";
      const nomeAmostra = amostra?.nome ?? r.amostraNome ?? "";
      const nomeAtributo = atributo?.nome ?? r.atributoNome ?? "";

      const chave = `${sessaoId}__${amostra?.id ?? codigo ?? nomeAmostra}`;

      if (!matrizMap.has(chave)) {
        matrizMap.set(chave, {
          Nome: r.nome ?? "",
          "Sessão ID": sessaoId,
          "Amostra (Código)": codigo,
          "Amostra (Nome)": nomeAmostra,
          "Tempo (s)": numero(r.tempo_total ?? r.tempoTotal),
        });
      }

      if (nomeAtributo) {
        matrizMap.get(chave)![nomeAtributo] = numero(r.valor);
      }
    });

    const matrizRows = Array.from(matrizMap.values()).sort((a, b) => {
      const codigoA = String(a["Amostra (Código)"] ?? "");
      const codigoB = String(b["Amostra (Código)"] ?? "");
      const nomeA = String(a.Nome ?? "");
      const nomeB = String(b.Nome ?? "");

      return (
        codigoA.localeCompare(codigoB, "pt-BR", { numeric: true }) ||
        nomeA.localeCompare(nomeB, "pt-BR")
      );
    });

    // ============================================================
    // 2) MÉDIAS POR ATRIBUTO
    // ============================================================
    const mediasRows: Record<string, unknown>[] = atributos.map(
      (atributo: any) => {
        const row: Record<string, unknown> = {
          Atributo: atributo.nome,
        };

        amostras.forEach((amostra: any) => {
          const valores = respostas
            .filter((r: any) => {
              const am = buscarAmostra(r);
              const at = buscarAtributo(r);

              return (
                am?.id === amostra.id &&
                at?.id === atributo.id
              );
            })
            .map((r: any) => Number(r.valor))
            .filter((v: number) => Number.isFinite(v));

          const media = valores.length
            ? valores.reduce(
                (soma: number, valor: number) => soma + valor,
                0
              ) / valores.length
            : NaN;

          row[amostra.codigo] = Number.isFinite(media)
            ? arredondar4(media)
            : "";
        });

        return row;
      }
    );

    // ============================================================
    // 3) DESVIO-PADRÃO POR ATRIBUTO
    // Desvio-padrão amostral (n - 1)
    // ============================================================
    const desvioRows: Record<string, unknown>[] = atributos.map(
      (atributo: any) => {
        const row: Record<string, unknown> = {
          Atributo: atributo.nome,
        };

        amostras.forEach((amostra: any) => {
          const valores = respostas
            .filter((r: any) => {
              const am = buscarAmostra(r);
              const at = buscarAtributo(r);

              return (
                am?.id === amostra.id &&
                at?.id === atributo.id
              );
            })
            .map((r: any) => Number(r.valor))
            .filter((v: number) => Number.isFinite(v));

          const dp = desvioPadraoAmostral(valores);

          row[amostra.codigo] =
            dp === "" ? "" : arredondar4(dp);
        });

        return row;
      }
    );

    // ============================================================
    // 4) RESUMO POR AMOSTRA
    // ============================================================
    const resumoRows = amostras.map((amostra: any) => {
      const mediasDaAmostra = atributos
        .map((atributo: any) => {
          const valores = respostas
            .filter((r: any) => {
              const am = buscarAmostra(r);
              const at = buscarAtributo(r);

              return (
                am?.id === amostra.id &&
                at?.id === atributo.id
              );
            })
            .map((r: any) => Number(r.valor))
            .filter((v: number) => Number.isFinite(v));

          if (!valores.length) return null;

          return (
            valores.reduce(
              (soma: number, valor: number) => soma + valor,
              0
            ) / valores.length
          );
        })
        .filter(
          (v: number | null): v is number =>
            typeof v === "number" && Number.isFinite(v)
        );

      const mediaGeral = mediasDaAmostra.length
        ? mediasDaAmostra.reduce(
            (soma: number, valor: number) => soma + valor,
            0
          ) / mediasDaAmostra.length
        : NaN;

      const avaliadoresUnicos = new Set(
        respostas
          .filter((r: any) => buscarAmostra(r)?.id === amostra.id)
          .map((r: any) => r.sessao_id ?? r.sessaoId)
          .filter(Boolean)
      ).size;

      return {
        "Amostra (Código)": amostra.codigo,
        "Amostra (Nome)": amostra.nome,
        "Média Geral": Number.isFinite(mediaGeral)
          ? arredondar4(mediaGeral)
          : "",
        "Nº Avaliadores": avaliadoresUnicos,
        "Nº Atributos com Dados": mediasDaAmostra.length,
      };
    });

    // ============================================================
    // 5) DADOS BRUTOS
    // Mantém o valor original numérico para análise estatística.
    // ============================================================
    const dadosBrutosRows = respostas.map((r: any) => {
      const amostra = buscarAmostra(r);
      const atributo = buscarAtributo(r);

      return {
        "Sessão ID": r.sessao_id ?? r.sessaoId ?? "",
        Nome: r.nome ?? "",
        "Tempo (s)": numero(r.tempo_total ?? r.tempoTotal),
        "Amostra (Código)": amostra?.codigo ?? "",
        "Amostra (Nome)": amostra?.nome ?? r.amostraNome ?? "",
        Atributo: atributo?.nome ?? r.atributoNome ?? "",
        Valor: numero(r.valor),
      };
    });

    // ============================================================
    // 6) INFORMAÇÕES DO EXPERIMENTO
    // ============================================================
    const informacoesRows: Record<string, unknown>[] = [
      {
        Campo: "Experimento",
        Valor: data.experimento?.titulo ?? "",
      },
      {
        Campo: "Slug",
        Valor: data.experimento?.slug ?? "",
      },
      {
        Campo: "Data da exportação",
        Valor: new Date().toLocaleString("pt-BR"),
      },
      {
        Campo: "Quantidade de avaliadores/sessões",
        Valor: data.total ?? 0,
      },
      {
        Campo: "Quantidade de amostras",
        Valor: amostras.length,
      },
      {
        Campo: "Quantidade de atributos",
        Valor: atributos.length,
      },
      {
        Campo: "Escala utilizada",
        Valor: "0 a 100",
      },
      {
        Campo: "Precisão das estatísticas",
        Valor: "4 casas decimais",
      },
      {
        Campo: "Observação",
        Valor:
          "Dados brutos preservados sem arredondamento intermediário. Médias e desvios são apresentados com 4 casas decimais.",
      },
    ];

    amostras.forEach((amostra: any, index: number) => {
      informacoesRows.push({
        Campo: `Amostra ${index + 1}`,
        Valor: `${amostra.codigo} — ${amostra.nome}`,
      });
    });

    atributos.forEach((atributo: any, index: number) => {
      informacoesRows.push({
        Campo: `Atributo ${index + 1}`,
        Valor: atributo.nome,
      });
    });

    // ============================================================
    // CRIAÇÃO DO EXCEL
    // ============================================================
    const wb = XLSX.utils.book_new();

    const wsMatriz = XLSX.utils.json_to_sheet(matrizRows);
    formatarPlanilha(
      wsMatriz,
      matrizRows,
      atributos.map((a: any) => a.nome)
    );
    XLSX.utils.book_append_sheet(wb, wsMatriz, "Matriz Sensorial");

    const wsMedias = XLSX.utils.json_to_sheet(mediasRows);
    formatarPlanilha(
      wsMedias,
      mediasRows,
      amostras.map((a: any) => a.codigo)
    );
    XLSX.utils.book_append_sheet(wb, wsMedias, "Médias");

    const wsDesvios = XLSX.utils.json_to_sheet(desvioRows);
    formatarPlanilha(
      wsDesvios,
      desvioRows,
      amostras.map((a: any) => a.codigo)
    );
    XLSX.utils.book_append_sheet(
      wb,
      wsDesvios,
      "Desvio Padrão"
    );

    const wsResumo = XLSX.utils.json_to_sheet(resumoRows);
    formatarPlanilha(wsResumo, resumoRows, ["Média Geral"]);
    XLSX.utils.book_append_sheet(
      wb,
      wsResumo,
      "Resumo Amostras"
    );

    const wsBrutos = XLSX.utils.json_to_sheet(dadosBrutosRows);
    formatarPlanilha(wsBrutos, dadosBrutosRows, ["Valor"]);
    XLSX.utils.book_append_sheet(
      wb,
      wsBrutos,
      "Dados Brutos"
    );

    const wsInfo = XLSX.utils.json_to_sheet(informacoesRows);
    formatarPlanilha(wsInfo, informacoesRows);
    XLSX.utils.book_append_sheet(wb, wsInfo, "Informações");

    const slug =
      data.experimento?.slug?.replace(/[^a-z0-9-_]/gi, "_") ||
      "experimento";

    XLSX.writeFile(
      wb,
      `sensopro_${slug}_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`
    );

    toast.success(
      "Excel sensorial exportado com matriz, médias, desvio-padrão, resumo e dados brutos."
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
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
        `}
      </style>

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 600,
              color: "#0f172a",
              marginBottom: "4px",
            }}
          >
            Dashboard
          </h1>

          <p
            style={{
              fontSize: "14px",
              color: "#64748b",
            }}
          >
            Visualize e exporte os resultados das avaliações sensoriais
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          <Button
            onClick={handleExport}
            disabled={!exportData || !data?.total}
            variant="outline"
            style={{
              gap: "8px",
              borderRadius: "9999px",
            }}
          >
            <Download size={16} />
            Exportar Excel
          </Button>

          <Button
            onClick={() => {
              if (!activeId || !data?.total || limparMut.isPending) {
                return;
              }

              const ok = window.confirm(
                "Isso vai apagar todas as sessões e respostas deste experimento.\n\n" +
                  "O experimento, as amostras e os atributos serão mantidos.\n\n" +
                  "Deseja realmente começar os resultados do zero?"
              );

              if (ok) {
                limparMut.mutate({
                  experimento_id: activeId,
                });
              }
            }}
            disabled={
              !activeId || !data?.total || limparMut.isPending
            }
            variant="outline"
            style={{
              gap: "8px",
              borderRadius: "9999px",
              color: "#b91c1c",
              borderColor: "#fecaca",
            }}
          >
            <RotateCcw size={16} />
            {limparMut.isPending
              ? "Limpando…"
              : "Limpar resultados"}
          </Button>
        </div>
      </div>

      {/* Seletor */}
      <div style={{ marginBottom: "24px" }}>
        <Select
          value={activeId?.toString() ?? ""}
          onValueChange={(value) => {
            const id = Number(value);

            setSelectedId(id);
            onSelectExp(id);
          }}
        >
          <SelectTrigger
            style={{
              width: "100%",
              maxWidth: "360px",
              borderRadius: "12px",
            }}
          >
            <SelectValue placeholder="Selecione um experimento…" />
          </SelectTrigger>

          <SelectContent>
            {allExps?.map((exp) => (
              <SelectItem
                key={exp.id}
                value={exp.id.toString()}
              >
                {exp.titulo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!activeId ? (
        <div
          style={{
            textAlign: "center",
            padding: "96px 0",
          }}
        >
          <BarChart3
            size={48}
            style={{
              color: "#94a3b8",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: "#64748b" }}>
            Selecione um experimento para ver o dashboard.
          </p>
        </div>
      ) : isLoading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "96px 0",
          }}
        >
          <div
            style={{
              width: "24px",
              height: "24px",
              border: "2px solid #e63e6d",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
        </div>
      ) : (
        <>
          {/* Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              marginBottom: "32px",
            }}
          >
            <div className="dashboard-stats-card">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    background: "#fce7ed",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Users
                    size={16}
                    style={{ color: "#e63e6d" }}
                  />
                </div>

                <span
                  style={{
                    fontSize: "14px",
                    color: "#64748b",
                  }}
                >
                  Avaliadores
                </span>
              </div>

              <p
                style={{
                  fontSize: "32px",
                  fontWeight: 600,
                  color: "#0f172a",
                }}
              >
                {data?.total ?? 0}
              </p>
            </div>

            <div className="dashboard-stats-card">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    background: "#fce7ed",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FlaskConical
                    size={16}
                    style={{ color: "#e63e6d" }}
                  />
                </div>

                <span
                  style={{
                    fontSize: "14px",
                    color: "#64748b",
                  }}
                >
                  Amostras
                </span>
              </div>

              <p
                style={{
                  fontSize: "32px",
                  fontWeight: 600,
                  color: "#0f172a",
                }}
              >
                {data?.amostras.length ?? 0}
              </p>
            </div>

            <div className="dashboard-stats-card">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    background: "#fce7ed",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <BarChart3
                    size={16}
                    style={{ color: "#e63e6d" }}
                  />
                </div>

                <span
                  style={{
                    fontSize: "14px",
                    color: "#64748b",
                  }}
                >
                  Atributos
                </span>
              </div>

              <p
                style={{
                  fontSize: "32px",
                  fontWeight: 600,
                  color: "#0f172a",
                }}
              >
                {data?.atributos.length ?? 0}
              </p>
            </div>
          </div>

          {data?.total === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "64px 0",
                border: "2px dashed #e2e8f0",
                borderRadius: "16px",
              }}
            >
              <BarChart3
                size={40}
                style={{
                  color: "#94a3b8",
                  margin: "0 auto 12px",
                }}
              />

              <p
                style={{
                  color: "#64748b",
                  fontSize: "14px",
                }}
              >
                Nenhuma avaliação recebida ainda.
              </p>
            </div>
          ) : (
            <>
              {/* Perfil sensorial - Radar */}
              <div className="dashboard-chart-card">
                <h3
                  style={{
                    fontWeight: 600,
                    color: "#0f172a",
                    marginBottom: "4px",
                  }}
                >
                  Perfil Sensorial
                </h3>

                <p
                  style={{
                    fontSize: "12px",
                    color: "#64748b",
                    marginBottom: "20px",
                  }}
                >
                  Perfil médio das amostras ao longo dos atributos avaliados
                </p>

                <ResponsiveContainer
                  width="100%"
                  height={500}
                >
                  <RadarChart
                    data={chartData.porAtributo}
                    outerRadius="72%"
                  >
                    <PolarGrid />

                    <PolarAngleAxis
                      dataKey="atributo"
                      tick={{
                        fontSize: 10,
                        fill: "#64748b",
                      }}
                    />

                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      tick={{
                        fontSize: 10,
                        fill: "#94a3b8",
                      }}
                    />

                    <Tooltip
                      formatter={(value: any) => [
                        Number(value).toFixed(4),
                        "Intensidade média",
                      ]}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        fontSize: "12px",
                      }}
                    />

                    <Legend
                      wrapperStyle={{
                        fontSize: "12px",
                        paddingTop: "16px",
                      }}
                    />

                    {data?.amostras.map(
                      (amostra: any, index: number) => (
                        <Radar
                          key={amostra.id}
                          name={`${amostra.codigo} — ${amostra.nome}`}
                          dataKey={amostra.codigo}
                          stroke={COLORS[index % COLORS.length]}
                          fill={COLORS[index % COLORS.length]}
                          fillOpacity={0.08}
                          strokeWidth={2}
                        />
                      )
                    )}
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Médias por atributo */}
              <div className="dashboard-chart-card">
                <h3
                  style={{
                    fontWeight: 600,
                    color: "#0f172a",
                    marginBottom: "4px",
                  }}
                >
                  Médias por Atributo
                </h3>

                <p
                  style={{
                    fontSize: "12px",
                    color: "#64748b",
                    marginBottom: "20px",
                  }}
                >
                  Comparativo entre amostras para cada atributo avaliado
                </p>

                <ResponsiveContainer
                  width="100%"
                  height={360}
                >
                  <BarChart
                    data={chartData.porAtributo}
                    margin={{
                      top: 5,
                      right: 20,
                      bottom: 30,
                      left: 0,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f0f0f0"
                    />

                    <XAxis
                      dataKey="atributo"
                      tick={{
                        fontSize: 10,
                        fill: "#94a3b8",
                      }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={90}
                    />

                    <YAxis
                      domain={[0, 100]}
                      tick={{
                        fontSize: 11,
                        fill: "#94a3b8",
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip
                      formatter={(value: any) =>
                        Number(value).toFixed(4)
                      }
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        fontSize: "12px",
                      }}
                    />

                    <Legend
                      wrapperStyle={{
                        fontSize: "12px",
                        paddingTop: "16px",
                      }}
                    />

                    {data?.amostras.map(
                      (amostra: any, index: number) => (
                        <Bar
                          key={amostra.id}
                          dataKey={amostra.codigo}
                          name={`${amostra.codigo} — ${amostra.nome}`}
                          fill={COLORS[index % COLORS.length]}
                          radius={[4, 4, 0, 0]}
                        />
                      )
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Média geral por amostra */}
              <div className="dashboard-chart-card">
                <h3
                  style={{
                    fontWeight: 600,
                    color: "#0f172a",
                    marginBottom: "4px",
                  }}
                >
                  Média Geral por Amostra
                </h3>

                <p
                  style={{
                    fontSize: "12px",
                    color: "#64748b",
                    marginBottom: "20px",
                  }}
                >
                  Média descritiva considerando os atributos avaliados
                </p>

                <ResponsiveContainer
                  width="100%"
                  height={260}
                >
                  <BarChart
                    data={chartData.porAmostra}
                    margin={{
                      top: 5,
                      right: 20,
                      bottom: 5,
                      left: 0,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f0f0f0"
                    />

                    <XAxis
                      dataKey="amostra"
                      tick={{
                        fontSize: 11,
                        fill: "#94a3b8",
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      domain={[0, 100]}
                      tick={{
                        fontSize: 11,
                        fill: "#94a3b8",
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip
                      formatter={(value: any) =>
                        Number(value).toFixed(4)
                      }
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        fontSize: "12px",
                      }}
                    />

                    <Bar
                      dataKey="media"
                      name="Média"
                      fill="#e63e6d"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Tabela */}
              <div className="dashboard-table">
                <div
                  style={{
                    padding: "16px 24px",
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  <h3
                    style={{
                      fontWeight: 600,
                      color: "#0f172a",
                    }}
                  >
                    Avaliadores que responderam
                  </h3>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      fontSize: "14px",
                    }}
                  >
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Tempo (s)</th>
                        <th>Data</th>
                      </tr>
                    </thead>

                    <tbody>
                      {data?.sessoesFinalizadas?.length === 0 ? (
                        <tr>
                          <td
                            colSpan={3}
                            style={{
                              textAlign: "center",
                              padding: "32px",
                              color: "#64748b",
                            }}
                          >
                            Nenhuma avaliação realizada ainda
                          </td>
                        </tr>
                      ) : (
                        data?.sessoesFinalizadas?.map(
                          (sessao: any) => (
                            <tr
                              key={sessao.id}
                              style={{
                                borderTop:
                                  "1px solid #e2e8f0",
                              }}
                            >
                              <td
                                style={{
                                  fontWeight: 500,
                                }}
                              >
                                {sessao.nome ?? "—"}
                              </td>

                              <td>
                                {sessao.tempo_total ?? "—"}
                              </td>

                              <td>
                                {sessao.finalizado_em
                                  ? new Date(
                                      sessao.finalizado_em
                                    ).toLocaleString("pt-BR")
                                  : "—"}
                              </td>
                            </tr>
                          )
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
