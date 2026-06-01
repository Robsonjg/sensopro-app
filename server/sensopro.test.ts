import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock DB module
vi.mock("./db", () => ({
  listExperimentos: vi.fn().mockResolvedValue([]),
  getExperimentoById: vi.fn().mockResolvedValue(undefined),
  getExperimentoBySlug: vi.fn().mockResolvedValue(undefined),
  createExperimento: vi.fn().mockResolvedValue(1),
  updateExperimento: vi.fn().mockResolvedValue(undefined),
  deleteExperimento: vi.fn().mockResolvedValue(undefined),
  ativarExperimento: vi.fn().mockResolvedValue(undefined),
  desativarExperimento: vi.fn().mockResolvedValue(undefined),
  listAmostras: vi.fn().mockResolvedValue([]),
  createAmostra: vi.fn().mockResolvedValue(1),
  updateAmostra: vi.fn().mockResolvedValue(undefined),
  deleteAmostra: vi.fn().mockResolvedValue(undefined),
  listAtributos: vi.fn().mockResolvedValue([]),
  createAtributo: vi.fn().mockResolvedValue(1),
  updateAtributo: vi.fn().mockResolvedValue(undefined),
  deleteAtributo: vi.fn().mockResolvedValue(undefined),
  getSessaoExistente: vi.fn().mockResolvedValue(null),
  createSessao: vi.fn().mockResolvedValue({ id: 1, email: "test@test.com", experimentoId: 1, finalizado: false }),
  finalizarSessao: vi.fn().mockResolvedValue(undefined),
  upsertResposta: vi.fn().mockResolvedValue(undefined),
  listRespostasBySessao: vi.fn().mockResolvedValue([]),
  getDashboardData: vi.fn().mockResolvedValue({ total: 0, sessoesFinalizadas: [], medias: [] }),
  getRespostasCompletas: vi.fn().mockResolvedValue([]),
}));

function createAdminCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-open-id",
      email: "admin@test.com",
      name: "Admin",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createPublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("experimentos router", () => {
  it("list retorna array vazio para admin", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.experimentos.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("create retorna id e slug", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.experimentos.create({ titulo: "Teste Café" });
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("slug");
    expect(typeof result.slug).toBe("string");
  });

  it("create rejeita usuário não-admin", async () => {
    const ctx = createAdminCtx();
    ctx.user!.role = "user";
    const caller = appRouter.createCaller(ctx);
    await expect(caller.experimentos.list()).rejects.toThrow();
  });
});

describe("avaliacao router (público)", () => {
  it("getExperimento lança NOT_FOUND para slug inexistente", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.avaliacao.getExperimento({ slug: "nao-existe" })).rejects.toThrow();
  });

  it("iniciarSessao cria sessao com dados demograficos", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.avaliacao.iniciarSessao({
      idade: 25,
      cidade: "Sao Paulo",
      estado: "SP",
      pais: "Brasil",
      experimentoId: 1,
    });
    expect(result).toHaveProperty("id");
    expect(result.experimentoId).toBe(1);
  });
});

describe("dashboard router", () => {
  it("getData retorna estrutura correta para admin", async () => {
    const { getExperimentoById } = await import("./db");
    vi.mocked(getExperimentoById).mockResolvedValueOnce({
      id: 1,
      titulo: "Exp Teste",
      descricao: null,
      slug: "exp-teste",
      ativo: true,
      criadoPor: 1,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    });
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.dashboard.getData({ experimentoId: 1 });
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("amostras");
    expect(result).toHaveProperty("atributos");
  });
});
