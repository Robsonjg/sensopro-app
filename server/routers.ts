import { eq, and, desc, sql } from "drizzle-orm";
import { getDb } from "./db";
import { sessoes } from "../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import bcrypt from "bcrypt";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router, emailPasswordAdminProcedure } from "./_core/trpc";
import {
  ativarExperimento,
  createAmostra,
  createAtributo,
  createAdmin,
  createExperimento,
  createSessao,
  deleteAmostra,
  deleteAtributo,
  deleteExperimento,
  desativarExperimento,
  finalizarSessao,
  getAdminByEmail,
  getAdminById,
  getDashboardData,
  getExperimentoById,
  getExperimentoBySlug,
  getRespostasCompletas,
  getSessaoExistente,
  listAdmins,
  listAmostras,
  listAtributos,
  listExperimentos,
  listRespostasBySessao,
  listUsers,
  updateAmostra,
  updateAtributo,
  updateAdmin,
  updateExperimento,
  updateUserRole,
  upsertResposta,
  promoteAdminByEmail,
  deactivateAdminByEmail,
  acceptConvite,
  createConvite,
  getConviteByCode,
  listConvites,
} from "./db";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => null),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Experimentos ──────────────────────────────────────────────────────────
  experimentos: router({
    list: emailPasswordAdminProcedure.query(async ({ ctx }) => {
      return listExperimentos(ctx.adminId);
    }),

    getById: emailPasswordAdminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const exp = await getExperimentoById(input.id);
      if (!exp) throw new TRPCError({ code: "NOT_FOUND" });
      return exp;
    }),

    create: emailPasswordAdminProcedure
      .input(
        z.object({
          titulo: z.string().min(1),
          descricao: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const baseSlug = slugify(input.titulo);
        const slug = `${baseSlug}-${nanoid(6)}`;
        const id = await createExperimento({
          adminId: ctx.adminId!,
          titulo: input.titulo,
          descricao: input.descricao ?? null,
          slug,
          ativo: false,
          criadoPor: ctx.adminId!,
        });
        return { id, slug };
      }),

    update: emailPasswordAdminProcedure
      .input(
        z.object({
          id: z.number(),
          titulo: z.string().min(1).optional(),
          descricao: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateExperimento(id, data);
        return { success: true };
      }),

    delete: emailPasswordAdminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteExperimento(input.id);
        return { success: true };
      }),

    ativar: emailPasswordAdminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const exp = await getExperimentoById(input.id);
        if (!exp) throw new TRPCError({ code: "NOT_FOUND" });
        await ativarExperimento(input.id);
        return { success: true };
      }),

    desativar: emailPasswordAdminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const exp = await getExperimentoById(input.id);
        if (!exp) throw new TRPCError({ code: "NOT_FOUND" });
        await desativarExperimento(input.id);
        return { success: true };
      }),
  }),

  // ─── Amostras ──────────────────────────────────────────────────────────────
  amostras: router({
    list: emailPasswordAdminProcedure
      .input(z.object({ experimentoId: z.number() }))
      .query(async ({ input }) => {
        return listAmostras(input.experimentoId);
      }),

    create: emailPasswordAdminProcedure
      .input(
        z.object({
          experimentoId: z.number(),
          codigo: z.string().min(1),
          nome: z.string().min(1),
          descricao: z.string().optional(),
          ordem: z.number().default(0),
        })
      )
      .mutation(async ({ input }) => {
        const id = await createAmostra(input);
        return { id };
      }),

    update: emailPasswordAdminProcedure
      .input(
        z.object({
          id: z.number(),
          codigo: z.string().min(1).optional(),
          nome: z.string().min(1).optional(),
          descricao: z.string().optional(),
          ordem: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateAmostra(id, data);
        return { success: true };
      }),

    delete: emailPasswordAdminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteAmostra(input.id);
        return { success: true };
      }),

    reorder: emailPasswordAdminProcedure
      .input(z.object({ items: z.array(z.object({ id: z.number(), ordem: z.number() })) }))
      .mutation(async ({ input }) => {
        await Promise.all(input.items.map((item) => updateAmostra(item.id, { ordem: item.ordem })));
        return { success: true };
      }),
  }),

  // ─── Atributos ─────────────────────────────────────────────────────────────
  atributos: router({
    list: emailPasswordAdminProcedure
      .input(z.object({ experimentoId: z.number() }))
      .query(async ({ input }) => {
        return listAtributos(input.experimentoId);
      }),

    create: emailPasswordAdminProcedure
      .input(
        z.object({
          experimentoId: z.number(),
          nome: z.string().min(1),
          descricao: z.string().optional(),
          labelMin: z.string().optional(),
          labelMax: z.string().optional(),
          ordem: z.number().default(0),
        })
      )
      .mutation(async ({ input }) => {
        const id = await createAtributo(input);
        return { id };
      }),

    update: emailPasswordAdminProcedure
      .input(
        z.object({
          id: z.number(),
          nome: z.string().min(1).optional(),
          descricao: z.string().optional(),
          labelMin: z.string().optional(),
          labelMax: z.string().optional(),
          ordem: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateAtributo(id, data);
        return { success: true };
      }),

    delete: emailPasswordAdminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteAtributo(input.id);
        return { success: true };
      }),

    reorder: emailPasswordAdminProcedure
      .input(z.object({ items: z.array(z.object({ id: z.number(), ordem: z.number() })) }))
      .mutation(async ({ input }) => {
        await Promise.all(
          input.items.map((item) => updateAtributo(item.id, { ordem: item.ordem }))
        );
        return { success: true };
      }),
  }),

  // ─── Avaliação Pública ─────────────────────────────────────────────────────
  avaliacao: router({
    getExperimento: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const exp = await getExperimentoBySlug(input.slug);
        if (!exp || !exp.ativo)
          throw new TRPCError({ code: "NOT_FOUND", message: "Avaliação não encontrada ou inativa." });
        const [amostrasData, atributosData] = await Promise.all([
          listAmostras(exp.id),
          listAtributos(exp.id),
        ]);
        return { experimento: exp, amostras: amostrasData, atributos: atributosData };
      }),

    iniciarSessao: publicProcedure
  .input(
    z.object({
      idade: z.number(),
      cidade: z.string(),
      estado: z.string(),
      pais: z.string(),
      experimentoId: z.number(),
    })
  )
  .mutation(async ({ input }) => {
    console.log("🚀 Iniciando sessão para experimento:", input.experimentoId);
    
    // Buscar o experimento para pegar o adminId correto
    const experimento = await getExperimentoById(input.experimentoId);
    if (!experimento) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Experimento não encontrado" });
    }
    
    const sessao = await createSessao({
      adminId: experimento.adminId, // Usa o adminId do experimento
      idade: input.idade,
      cidade: input.cidade.trim(),
      estado: input.estado.trim(),
      pais: input.pais.trim(),
      experimentoId: input.experimentoId,
      finalizado: false,
    });
    
    console.log("✅ Sessão criada com ID:", sessao);
    return sessao;
  }),

    salvarResposta: publicProcedure
      .input(
        z.object({
          sessaoId: z.number(),
          atributoId: z.number(),
          amostraId: z.number(),
          valor: z.number().min(0).max(100),
        })
      )
      .mutation(async ({ input }) => {
        await upsertResposta(input);
        return { success: true };
      }),

    finalizar: publicProcedure
      .input(z.object({ sessaoId: z.number(), tempoTotal: z.number() }))
      .mutation(async ({ input }) => {
        await finalizarSessao(input.sessaoId, input.tempoTotal);
        return { success: true };
      }),
  }),

  // ─── Dashboard ─────────────────────────────────────────────────────────────
  dashboard: router({
  getData: emailPasswordAdminProcedure
    .input(z.object({ experimentoId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not connected");

      const [exp, amostrasData, atributosData] = await Promise.all([
        getExperimentoById(input.experimentoId),
        listAmostras(input.experimentoId),
        listAtributos(input.experimentoId),
      ]);

      if (!exp) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.adminId && exp.criadoPor !== ctx.adminId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Total de sessões
      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(sessoes)
        .where(eq(sessoes.experimentoId, input.experimentoId));
      const totalSessoes = Number(totalResult[0]?.count) || 0;

      // Sessões concluídas
      const concluidasResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(sessoes)
        .where(and(eq(sessoes.experimentoId, input.experimentoId), eq(sessoes.finalizado, true)));
      const sessoesConcluidas = Number(concluidasResult[0]?.count) || 0;

      // Tempo médio
      const tempoResult = await db
        .select({ avg: sql<number | null>`avg(${sessoes.tempoTotal})` })
        .from(sessoes)
        .where(eq(sessoes.experimentoId, input.experimentoId));
      const tempoMedio = tempoResult[0]?.avg || 0;

      // Sessões finalizadas (detalhes)
      const sessoesFinalizadas = await db
        .select({
          id: sessoes.id,
          idade: sessoes.idade,
          cidade: sessoes.cidade,
          estado: sessoes.estado,
          pais: sessoes.pais,
          tempoTotal: sessoes.tempoTotal,
          finalizadoEm: sessoes.finalizadoEm,
        })
        .from(sessoes)
        .where(and(eq(sessoes.experimentoId, input.experimentoId), eq(sessoes.finalizado, true)))
        .orderBy(desc(sessoes.criadoEm));

      // Médias por atributo e amostra
      const mediasResult = await db.execute(sql`
        SELECT 
          r."atributoId",
          r."amostraId",
          AVG(r.valor) as media
        FROM respostas r
        JOIN sessoes s ON r."sessaoId" = s.id
        WHERE s."experimentoId" = ${input.experimentoId}
        GROUP BY r."atributoId", r."amostraId"
      `);

      return {
        experimento: exp,
        amostras: amostrasData,
        atributos: atributosData,
        total: totalSessoes,
        totalSessoes,
        sessoesConcluidas,
        tempoMedio,
        sessoesFinalizadas,
        medias: mediasResult || [],
      };
    }),

  exportar: emailPasswordAdminProcedure
    .input(z.object({ experimentoId: z.number() }))
    .query(async ({ input, ctx }) => {
      const exp = await getExperimentoById(input.experimentoId);
      if (!exp) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.adminId && exp.criadoPor !== ctx.adminId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const [amostrasData, atributosData, respostasData] = await Promise.all([
        listAmostras(input.experimentoId),
        listAtributos(input.experimentoId),
        getRespostasCompletas(input.experimentoId),
      ]);
      return { amostras: amostrasData, atributos: atributosData, respostas: respostasData };
    }),
}),

  adminManagement: router({
    listUsers: emailPasswordAdminProcedure.query(async () => {
      return await listUsers();
    }),

    promoteToAdmin: emailPasswordAdminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        await updateUserRole(input.userId, "admin");
        return { success: true };
      }),

    demoteToUser: emailPasswordAdminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        await updateUserRole(input.userId, "user");
        return { success: true };
      }),
  }),

  adminAuth: router({
    registro: publicProcedure
      .input(z.object({ email: z.string().email(), senha: z.string().min(6), nome: z.string().optional() }))
      .mutation(async ({ input }) => {
        const existente = await getAdminByEmail(input.email);
        if (existente) throw new TRPCError({ code: "CONFLICT", message: "Email já registrado" });
        const senhaHash = await bcrypt.hash(input.senha, 10);
        const admin = await createAdmin({ email: input.email, senhaHash, nome: input.nome, ativo: true });
        return { id: admin.id, email: admin.email, nome: admin.nome };
      }),

    login: publicProcedure
      .input(z.object({ email: z.string().email(), senha: z.string() }))
      .mutation(async ({ input, ctx }) => {
        console.log("🔑 Tentando login para:", input.email);
        
        const admin = await getAdminByEmail(input.email);
        if (!admin) {
          console.log("❌ Admin não encontrado:", input.email);
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas" });
        }
        if (!admin.ativo) {
          console.log("❌ Admin desativado:", input.email);
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin desativado" });
        }
        
        const senhaValida = await bcrypt.compare(input.senha, admin.senhaHash);
        if (!senhaValida) {
          console.log("❌ Senha inválida para:", input.email);
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas" });
        }
        
        const sessionData = JSON.stringify({ adminId: admin.id, email: admin.email });
        console.log("🍪 Criando cookie com:", sessionData);
        
        // Configuração do cookie
        ctx.res.cookie("admin_session", sessionData, {
          httpOnly: false,
          secure: false,
          sameSite: "lax",
          maxAge: 2592000000,
          path: "/",
        });
        
        console.log("✅ Login bem sucedido para:", admin.email);
        console.log("📋 Headers de resposta configurados");
        
        return { id: admin.id, email: admin.email, nome: admin.nome };
      }),

    me: emailPasswordAdminProcedure
      .query(async ({ ctx }) => {
        console.log("📡 Rota me chamada - ctx.admin:", ctx.admin ? "Presente" : "Ausente");
        
        if (ctx.admin) {
          return {
            id: ctx.admin.id,
            email: ctx.admin.email,
            nome: ctx.admin.nome
          };
        }
        
        return null;
      }),

    logout: publicProcedure
      .mutation(({ ctx }) => {
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.clearCookie("admin_session", { ...cookieOptions, httpOnly: true });
        return { success: true };
      }),

    listAll: protectedProcedure
      .query(async () => {
        const adminsList = await listAdmins();
        return adminsList.map((a) => ({ id: a.id, email: a.email, nome: a.nome, ativo: a.ativo, criadoEm: a.criadoEm }));
      }),

    promoteByEmail: protectedProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const admin = await promoteAdminByEmail(input.email);
        if (!admin) throw new TRPCError({ code: "NOT_FOUND", message: "Admin nao encontrado" });
        return { id: admin.id, email: admin.email, nome: admin.nome, ativo: admin.ativo };
      }),

    deactivateByEmail: protectedProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const admin = await deactivateAdminByEmail(input.email);
        if (!admin) throw new TRPCError({ code: "NOT_FOUND", message: "Admin nao encontrado" });
        return { id: admin.id, email: admin.email, nome: admin.nome, ativo: admin.ativo };
      }),

    createConvite: protectedProcedure
      .input(z.object({ email: z.string().email().optional() }))
      .mutation(async ({ input, ctx }) => {
        const codigo = nanoid(8);
        const adminId = (ctx as any).adminId || 1;
        const convite = await createConvite({
          codigo,
          email: input.email,
          criadoPor: adminId,
          expiradoEm: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
        return { codigo: convite.codigo, link: `${process.env.VITE_APP_URL || "http://localhost:3000"}/admin/convite/${convite.codigo}` };
      }),

    validateConvite: publicProcedure
      .input(z.object({ codigo: z.string() }))
      .query(async ({ input }) => {
        const convite = await getConviteByCode(input.codigo);
        if (!convite) throw new TRPCError({ code: "NOT_FOUND", message: "Convite não encontrado" });
        if (convite.usado) throw new TRPCError({ code: "CONFLICT", message: "Convite já foi utilizado" });
        if (convite.expiradoEm && new Date() > convite.expiradoEm) throw new TRPCError({ code: "CONFLICT", message: "Convite expirado" });
        return { valido: true, email: convite.email };
      }),

    acceptConviteAndRegister: publicProcedure
      .input(z.object({ codigo: z.string(), email: z.string().email(), senha: z.string().min(6), nome: z.string() }))
      .mutation(async ({ input }) => {
        const convite = await getConviteByCode(input.codigo);
        if (!convite) throw new TRPCError({ code: "NOT_FOUND", message: "Convite não encontrado" });
        if (convite.usado) throw new TRPCError({ code: "CONFLICT", message: "Convite já foi utilizado" });
        if (convite.expiradoEm && new Date() > convite.expiradoEm) throw new TRPCError({ code: "CONFLICT", message: "Convite expirado" });
        
        const existente = await getAdminByEmail(input.email);
        if (existente) throw new TRPCError({ code: "CONFLICT", message: "Email já registrado" });
        
        const senhaHash = await bcrypt.hash(input.senha, 10);
        const admin = await createAdmin({ email: input.email, senhaHash, nome: input.nome, ativo: false });
        
        await acceptConvite(input.codigo, admin.id);
        
        return { id: admin.id, email: admin.email, nome: admin.nome, mensagem: "Conta criada! Aguarde ativação do admin" };
      }),
  }),
});

export type AppRouter = typeof appRouter;