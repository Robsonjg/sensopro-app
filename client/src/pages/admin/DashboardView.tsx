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
  LabelList,
} from "recharts";
import {
  Download,
  Users,
  BarChart3,
  FlaskConical,
} from "lucide-react";
import { useState, useMemo } from "react";
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

/**
 * Formata números no padrão brasileiro.
 *
 * Exemplo:
 * 1.3 -> 1,3
 * 10 -> 10,0
 */
function formatarCentimetros(valor: unknown): string {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "0,0 cm";
  }

  return `${numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} cm`;
}

export default function DashboardView({
  experimento_id,
  onSelectExp,
}: Props) {
  const { data: allExps } = trpc.experimentos.listar.useQuery();

  const [selectedId, setSelectedId] = useState<number | null>(
    experimento_id
  );

  const activeId = selectedId ?? experimento_id;

  const { data, isLoading } = trpc.dashboard.getData.useQuery(
    {
      experimento_id: activeId!,
    },
    {
      enabled: !!activeId,
    }
  );

  const { data: exportData } = trpc.dashboard.exportar.useQuery(
    {
      experimento_id: activeId!,
    },
    {
      enabled: !!activeId,
    }
  );

  /**
   * Dados usados exclusivamente nos gráficos.
   *
   * Os resultados originais continuam armazenados entre 0 e 100.
   * Aqui o valor é dividido por 10 para exibição em centímetros:
   *
   * 13 -> 1,3 cm
   * 85 -> 8,5 cm
   * 100 -> 10,0 cm
   */
  const chartData = useMemo(() => {
    if (!data) {
      return {
        porAtributo: [],
        porAmostra: [],
      };
    }

    const { medias, atributos, amostras } = data;

    const porAtributo = atributos.map((attr: any) => {
      const entry: Record<string, unknown> = {
        atributo: attr.nome,
      };

      amostras.forEach((am: any) => {
        const mediaEncontrada = medias.find(
          (item: any) =>
            item.atributo_id === attr.id &&
            item.amostra_id === am.id
        );

        const valorOriginal = mediaEncontrada
          ? Number(mediaEncontrada.media)
          : 0;

        entry[am.codigo] = Number(
          (valorOriginal / 10).toFixed(1)
        );
      });

      return entry;
    });

    const porAmostra = amostras.map((am: any) => {
      const valores = medias
        .filter((item: any) => item.amostra_id === am.id)
        .map((item: any) => Number(item.media))
        .filter((valor: number) => Number.isFinite(valor));

      const mediaOriginal = valores.length
        ? valores.reduce(
            (soma: number, valor: number) => soma + valor,
            0
          ) / valores.length
        : 0;

      return {
        amostra: am.codigo,
        nome: am.nome,
        media: Number((mediaOriginal / 10).toFixed(1)),
      };
    });

    return {
      porAtributo,
      porAmostra,
    };
  }, [data]);

  /**
   * Exportação mantida com os valores originais.
   *
   * A alteração para centímetros acontece apenas em chartData,
   * portanto as planilhas continuam recebendo os valores de 0 a 100.
   */
  function handleExport() {
    if (!exportData || !data) {
      return;
    }

    const {
      amostras,
      atributos,
      respostas,
    } = exportData;

    const rows = respostas.map((r: any) => {
      const amostra = amostras.find(
        (item: any) => item.id === r.amostra_id
      );

      const atributo = atributos.find(
        (item: any) => item.id === r.atributo_id
      );

      return {
        "Sessão ID": r.sessao_id,
        Idade: r.idade ?? "",
        Cidade: r.cidade ?? "",
        Estado: r.estado ?? "",
        País: r.pais ?? "",
        "Data/Hora": r.finalizado_em
          ? new Date(r.finalizado_em).toLocaleString("pt-BR")
          : "",
        "Tempo (s)": r.tempo_total ?? "",
        "Amostra (Código)": amostra?.codigo ?? "",
        "Amostra (Nome)": amostra?.nome ?? "",
        Atributo: atributo?.nome ?? "",
        Valor: r.valor,
      };
    });

    const mediasRows: Record<string, unknown>[] = [];

    atributos.forEach((attr: any) => {
      const row: Record<string, unknown> = {
        Atributo: attr.nome,
      };

      amostras.forEach((am: any) => {
        const mediaEncontrada = data.medias.find(
          (item: any) =>
            item.atributo_id === attr.id &&
            item.amostra_id === am.id
        );

        row[am.codigo] = mediaEncontrada
          ? Number(Number(mediaEncontrada.media).toFixed(2))
          : "-";
      });

      mediasRows.push(row);
    });

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(rows),
      "Respostas"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(mediasRows),
      "Médias"
    );

    XLSX.writeFile(
      workbook,
      `sensopro_${
        data?.experimento?.slug ?? "experimento"
      }_${Date.now()}.xlsx`
    );

    toast.success("Planilha exportada com sucesso!");
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }

            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes spin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }

          .dashboard-stats-card {
            background: white;
            border-radius: 16px;
            border: 1px solid #e2e8f0;
            padding: 20px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          }

          .dashboard-chart-card {
            background: white;
            border-radius: 16px;
            border: 1px solid #e2e8f0;
            padding: 24px;
            margin-bottom: 24px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          }

          .dashboard-table {
            background: white;
            border-radius: 16px;
            border: 1px solid #e2e8f0;
            overflow: hidden;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
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

      {/* Cabeçalho */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
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
            Visualize e exporte os resultados das avaliações
          </p>
        </div>

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
      </div>

      {/* Seletor de experimento */}
      <div
        style={{
          marginBottom: "24px",
        }}
      >
        <Select
          value={activeId?.toString() ?? ""}
          onValueChange={(value) => {
            const id = Number.parseInt(value, 10);

            setSelectedId(id);
            onSelectExp(id);
          }}
        >
          <SelectTrigger
            style={{
              width: "100%",
              maxWidth: "280px",
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
          {/* Cartões de estatísticas */}
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
                Nenhuma avaliação recebida ainda. Compartilhe o
                link com os avaliadores.
              </p>
            </div>
          ) : (
            <>
              {/* Gráfico: médias por atributo */}
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
                  Comparativo entre amostras para cada atributo
                  avaliado — valores apresentados em centímetros
                </p>

                <ResponsiveContainer
                  width="100%"
                  height={340}
                >
                  <BarChart
                    data={chartData.porAtributo}
                    margin={{
                      top: 35,
                      right: 20,
                      bottom: 5,
                      left: 10,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f0f0f0"
                    />

                    <XAxis
                      dataKey="atributo"
                      tick={{
                        fontSize: 11,
                        fill: "#94a3b8",
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      domain={[0, 10]}
                      ticks={[0, 2, 4, 6, 8, 10]}
                      tickFormatter={(value: number) =>
                        Number(value).toLocaleString("pt-BR", {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })
                      }
                      tick={{
                        fontSize: 11,
                        fill: "#94a3b8",
                      }}
                      axisLine={false}
                      tickLine={false}
                      label={{
                        value: "Intensidade (cm)",
                        angle: -90,
                        position: "insideLeft",
                        style: {
                          fontSize: "11px",
                          fill: "#64748b",
                        },
                      }}
                    />

                    <Tooltip
                      formatter={(value: any, name: any) => [
                        formatarCentimetros(value),
                        name,
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
                      (am: any, index: number) => (
                        <Bar
                          key={am.id}
                          dataKey={am.codigo}
                          name={`${am.codigo} — ${am.nome}`}
                          fill={
                            COLORS[index % COLORS.length]
                          }
                          radius={[4, 4, 0, 0]}
                        >
                          <LabelList
                            dataKey={am.codigo}
                            position="top"
                            formatter={(value: any) => {
                              const numero = Number(value);

                              if (
                                !Number.isFinite(numero) ||
                                numero === 0
                              ) {
                                return "";
                              }

                              return formatarCentimetros(
                                numero
                              );
                            }}
                            style={{
                              fontSize: "10px",
                              fill: "#475569",
                            }}
                          />
                        </Bar>
                      )
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Gráfico: média geral por amostra */}
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
                  Pontuação média considerando todos os atributos —
                  valores apresentados em centímetros
                </p>

                <ResponsiveContainer
                  width="100%"
                  height={280}
                >
                  <BarChart
                    data={chartData.porAmostra}
                    margin={{
                      top: 35,
                      right: 20,
                      bottom: 5,
                      left: 10,
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
                      domain={[0, 10]}
                      ticks={[0, 2, 4, 6, 8, 10]}
                      tickFormatter={(value: number) =>
                        Number(value).toLocaleString("pt-BR", {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })
                      }
                      tick={{
                        fontSize: 11,
                        fill: "#94a3b8",
                      }}
                      axisLine={false}
                      tickLine={false}
                      label={{
                        value: "Média (cm)",
                        angle: -90,
                        position: "insideLeft",
                        style: {
                          fontSize: "11px",
                          fill: "#64748b",
                        },
                      }}
                    />

                    <Tooltip
                      formatter={(value: any) => [
                        formatarCentimetros(value),
                        "Média",
                      ]}
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
                    >
                      <LabelList
                        dataKey="media"
                        position="top"
                        formatter={(value: any) =>
                          formatarCentimetros(value)
                        }
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          fill: "#475569",
                        }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Tabela de sessões */}
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
                        <th>Idade</th>
                        <th>Cidade</th>
                        <th>Estado</th>
                        <th>País</th>
                        <th>Tempo (s)</th>
                        <th>Data</th>
                      </tr>
                    </thead>

                    <tbody>
                      {data?.sessoesFinalizadas?.length ===
                      0 ? (
                        <tr>
                          <td
                            colSpan={6}
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
                                {sessao.idade ?? "—"}
                              </td>

                              <td>
                                {sessao.cidade ?? "—"}
                              </td>

                              <td>
                                {sessao.estado ?? "—"}
                              </td>

                              <td>
                                {sessao.pais ?? "—"}
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
