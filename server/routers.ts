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

  // Rotas de Administração / Experimentos
  experimentos: router({
    listar: protectedProcedure.query(async () => {
      return await listExperimentos();
    }),
    buscarPorSlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return await getExperimentoBySlug(input.slug);
      }),
    criar: protectedProcedure
      .input(z.object({ nome: z.string(), descricao: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        // Agora passando o objeto completo com os parâmetros que o Drizzle exige
        return await createExperimento({
          titulo: input.nome,
          slug: input.nome.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""), 
          descricao: input.descricao ?? "",
          adminId: ctx.user.id,
          criadoPor: ctx.user.id
        });
      }),
  }),
});

// Exportação do tipo para o Frontend/Client usar no trpc.ts
export type AppRouter = typeof appRouter;