import { eq, and, desc, sql } from "drizzle-orm";
import { getDb } from "./db.js";

import { sessoes } from "../drizzle/schema.js";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import bcrypt from "bcrypt";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies.js";
import { systemRouter } from "./routers/_core/systemRouter.js";
import {
  protectedProcedure,
  publicProcedure,
  router,
  emailPasswordAdminProcedure
} from "./_core/trpc.js";

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
} from "./db.js";

// Montagem do Roteador Principal (appRouter)
export const appRouter = router({
  // Sistema interno
  system: systemRouter,

  // Rotas Públicas
  healthCheck: publicProcedure.query(() => {
    return { status: "ok", uptime: process.uptime() };
  }),

  // Auth Router (Geral)
  auth: router({
    login: publicProcedure
      .input(z.object({ email: z.string().email(), senha: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const admin = await getAdminByEmail(input.email);
        if (!admin || !admin.senhaHash) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas" });
        }
        const isValid = await bcrypt.compare(input.senha, admin.senhaHash);
        if (!isValid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas" });
        }
        
        const sessionData = JSON.stringify({ adminId: admin.id });
        ctx.res.setHeader("Set-Cookie", `admin_session=${encodeURIComponent(sessionData)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`);
        
        return { success: true, admin: { id: admin.id, email: admin.email, nome: admin.nome } };
      }),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      ctx.res.setHeader("Set-Cookie", "admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
      return { success: true };
    }),
    me: publicProcedure.query(async ({ ctx }) => {
      let adminId: number | undefined;
      const cookieHeader = ctx.req.headers.cookie;
      if (cookieHeader) {
        const cookies = cookieHeader.split("; ");
        for (const cookie of cookies) {
          if (cookie.startsWith("admin_session=")) {
            const cookieValue = cookie.substring("admin_session=".length);
            try {
              const sessionData = JSON.parse(decodeURIComponent(cookieValue));
              adminId = sessionData.adminId;
            } catch (e) {}
            break;
          }
        }
      }

      if (!adminId) return null;
      const admin = await getAdminById(adminId);
      if (!admin) return null;
      return { id: admin.id, email: admin.email, nome: admin.nome };
    }),
  }),

  // Admin Auth Router (Específico do Painel)
  adminAuth: router({
    login: publicProcedure
      .input(z.object({ email: z.string().email(), senha: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const admin = await getAdminByEmail(input.email);
        if (!admin || !admin.senhaHash) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas" });
        }
        const isValid = await bcrypt.compare(input.senha, admin.senhaHash);
        if (!isValid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas" });
        }
        const sessionData = JSON.stringify({ adminId: admin.id });
        ctx.res.setHeader("Set-Cookie", `admin_session=${encodeURIComponent(sessionData)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`);
        return { success: true };
      }),
    registro: publicProcedure
      .input(z.object({ email: z.string().email(), senha: z.string(), nome: z.string() }))
      .mutation(async ({ input }) => {
        const existing = await getAdminByEmail(input.email);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Email ja cadastrado" });
        const hashedPassword = await bcrypt.hash(input.senha, 10);
        return await createAdmin({
          nome: input.nome,
          email: input.email,
          senhaHash: hashedPassword,
          ativo: false
        });
      }),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      ctx.res.setHeader("Set-Cookie", "admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
      return { success: true };
    }),
    me: publicProcedure.query(async ({ ctx }) => {
      let adminId: number | undefined;
      const cookieHeader = ctx.req.headers.cookie;
      if (cookieHeader) {
        const cookies = cookieHeader.split("; ");
        for (const cookie of cookies) {
          if (cookie.startsWith("admin_session=")) {
            const cookieValue = cookie.substring("admin_session=".length);
            try {
              const sessionData = JSON.parse(decodeURIComponent(cookieValue));
              adminId = sessionData.adminId;
            } catch (e) {}
            break;
          }
        }
      }
      if (!adminId) return null;
      const admin = await getAdminById(adminId);
      if (!admin) return null;
      return { id: admin.id, email: admin.email, nome: admin.nome };
    }),
    list: protectedProcedure.query(async () => {
      return await listAdmins();
    }),
    promoteByEmail: protectedProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const admin = await promoteAdminByEmail(input.email);
        if (!admin) throw new TRPCError({ code: "NOT_FOUND", message: "Admin nao encontrado" });
        return admin;
      }),
    deactivateByEmail: protectedProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const admin = await deactivateAdminByEmail(input.email);
        if (!admin) throw new TRPCError({ code: "NOT_FOUND", message: "Admin nao encontrado" });
        return admin;
      }),
    validateConvite: publicProcedure
      .input(z.object({ codigo: z.string() }))
      .query(async ({ input }) => {
        const convite = await getConviteByCode(input.codigo);
        if (!convite || convite.usado) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Convite inválido ou já usado" });
        }
        return { success: true, email: convite.email };
      }),
    acceptConviteAndRegister: publicProcedure
      .input(z.object({
        codigo: z.string(),
        email: z.string().email(),
        senha: z.string(),
        nome: z.string()
      }))
      .mutation(async ({ input }) => {
        const convite = await getConviteByCode(input.codigo);
        if (!convite || convite.usado) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Convite inválido ou já usado" });
        }
        const hashedPassword = await bcrypt.hash(input.senha, 10);
        const admin = await createAdmin({
          nome: input.nome,
          email: input.email,
          senhaHash: hashedPassword,
          ativo: true
        });
        await acceptConvite(input.codigo, admin.id);
        return { success: true };
      }),
    createConvite: protectedProcedure
      .input(z.object({ email: z.string().email().optional() }))
      .mutation(async ({ input, ctx }) => {
        const codigo = nanoid(10);
        await createConvite({
          email: input.email ?? "",
          codigo,
          criadoPor: ctx.admin.id
        });
        const appUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:5173";
        const link = `${appUrl}/admin/registro?codigo=${codigo}`;
        return { codigo, link };
      }),
  }),

  // Rotas de Administração / Experimentos
  experimentos: router({
    listar: protectedProcedure.query(async () => {
      return await listExperimentos();
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getExperimentoById(input.id);
      }),
    criar: protectedProcedure
      .input(z.object({ titulo: z.string(), descricao: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        return await createExperimento({
          titulo: input.titulo,
          slug: input.titulo.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""), 
          descricao: input.descricao ?? "",
          adminId: ctx.admin.id,
          criadoPor: ctx.admin.id
        });
      }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), titulo: z.string().optional(), descricao: z.string().optional() }))
      .mutation(async ({ input }) => {
        return await updateExperimento(input.id, input);
      }),
    ativar: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await ativarExperimento(input.id);
      }),
    desativar: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await desativarExperimento(input.id);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteExperimento(input.id);
      }),
  }),

  amostras: router({
    listar: publicProcedure
      .input(z.object({ experimentoId: z.number() }))
      .query(async ({ input }) => {
        return await listAmostras(input.experimentoId);
      }),
    create: protectedProcedure
      .input(z.object({ experimentoId: z.number(), nome: z.string(), codigo: z.string(), descricao: z.string().optional(), ordem: z.number().optional() }))
      .mutation(async ({ input }) => {
        return await createAmostra({ ...input, ordem: input.ordem ?? 0 });
      }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), nome: z.string().optional(), codigo: z.string().optional(), descricao: z.string().optional(), ordem: z.number().optional() }))
      .mutation(async ({ input }) => {
        return await updateAmostra(input.id, input);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteAmostra(input.id);
      }),
    reorder: protectedProcedure
      .input(z.object({ items: z.array(z.object({ id: z.number(), ordem: z.number() })) }))
      .mutation(async ({ input }) => {
        for (const item of input.items) {
          await updateAmostra(item.id, { ordem: item.ordem });
        }
        return { success: true };
      }),
  }),

  atributos: router({
    listar: publicProcedure
      .input(z.object({ experimentoId: z.number() }))
      .query(async ({ input }) => {
        return await listAtributos(input.experimentoId);
      }),
    create: protectedProcedure
      .input(z.object({ experimentoId: z.number(), nome: z.string(), descricao: z.string().optional(), labelMin: z.string().optional(), labelMax: z.string().optional(), ordem: z.number().optional() }))
      .mutation(async ({ input }) => {
        return await createAtributo({ ...input, ordem: input.ordem ?? 0 });
      }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), nome: z.string().optional(), descricao: z.string().optional(), labelMin: z.string().optional(), labelMax: z.string().optional(), ordem: z.number().optional() }))
      .mutation(async ({ input }) => {
        return await updateAtributo(input.id, input);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteAtributo(input.id);
      }),
    reorder: protectedProcedure
      .input(z.object({ items: z.array(z.object({ id: z.number(), ordem: z.number() })) }))
      .mutation(async ({ input }) => {
        for (const item of input.items) {
          await updateAtributo(item.id, { ordem: item.ordem });
        }
        return { success: true };
      }),
  }),

  dashboard: router({
    getData: protectedProcedure
      .input(z.object({ experimentoId: z.number() }))
      .query(async ({ input }) => {
        const dbData = await getDashboardData(input.experimentoId);
        const exp = await getExperimentoById(input.experimentoId);
        const ams = await listAmostras(input.experimentoId);
        const ats = await listAtributos(input.experimentoId);
        
        return {
          total: dbData.totalSessoes,
          sessoesFinalizadas: [], 
          amostras: ams,
          atributos: ats,
          medias: [], 
          experimento: exp
        };
      }),
    exportar: protectedProcedure
      .input(z.object({ experimentoId: z.number() }))
      .query(async ({ input }) => {
        const ams = await listAmostras(input.experimentoId);
        const ats = await listAtributos(input.experimentoId);
        const resps = await getRespostasCompletas(input.experimentoId);
        return {
          amostras: ams,
          atributos: ats,
          respostas: resps
        };
      }),
  }),

  // Rotas de Avaliação (Públicas)
  avaliacao: router({
    getExperimento: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const exp = await getExperimentoBySlug(input.slug);
        if (!exp || !exp.ativo) throw new TRPCError({ code: "NOT_FOUND", message: "Experimento não encontrado ou inativo" });
        const ams = await listAmostras(exp.id);
        const ats = await listAtributos(exp.id);
        return { experimento: exp, amostras: ams, atributos: ats };
      }),
    iniciarSessao: publicProcedure
      .input(z.object({ experimentoId: z.number(), idade: z.number(), cidade: z.string(), estado: z.string(), pais: z.string() }))
      .mutation(async ({ input }) => {
        const exp = await getExperimentoById(input.experimentoId);
        if (!exp) throw new TRPCError({ code: "NOT_FOUND" });
        return await createSessao({
          ...input,
          adminId: exp.adminId,
          finalizado: false
        });
      }),
    salvarResposta: publicProcedure
      .input(z.object({ sessaoId: z.number(), atributoId: z.number(), amostraId: z.number(), valor: z.number() }))
      .mutation(async ({ input }) => {
        return await upsertResposta(input);
      }),
    finalizar: publicProcedure
      .input(z.object({ sessaoId: z.number(), tempoTotal: z.number() }))
      .mutation(async ({ input }) => {
        return await finalizarSessao(input.sessaoId, input.tempoTotal);
      }),
  })
});

// Exportação do tipo para o Frontend/Client usar no trpc.ts
export type AppRouter = typeof appRouter;
export default appRouter;
