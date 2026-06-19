import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import bcrypt from "bcrypt";

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
  listAdmins,
  listAmostras,
  listAtributos,
  listExperimentos,
  updateAmostra,
  updateAtributo,
  updateExperimento,
  promoteAdminByEmail,
  deactivateAdminByEmail,
  acceptConvite,
  createConvite,
  getConviteByCode,
  upsertResposta,
} from "./db.js";

import {
  protectedProcedure,
  publicProcedure,
  router,
} from "./_core/trpc.js";

/* =========================
   HELPERS
========================= */

function getAdminIdFromReq(req: any): number | undefined {
  const cookieHeader = req?.headers?.cookie;
  if (!cookieHeader) return;

  const cookies = cookieHeader.split("; ");

  for (const cookie of cookies) {
    if (cookie.startsWith("admin_session=")) {
      try {
        const value = cookie.replace("admin_session=", "");
        const parsed = JSON.parse(decodeURIComponent(value));
        return parsed.adminId;
      } catch {
        return;
      }
    }
  }
}

/* =========================
   CORE AUTH LOGIC (REUTILIZÁVEL)
========================= */

const loginAdmin = async ({ input, ctx }: any) => {
  const admin = await getAdminByEmail(input.email);

  if (!admin || !admin.senhaHash) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const valid = await bcrypt.compare(input.senha, admin.senhaHash);

  if (!valid) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const session = JSON.stringify({ adminId: admin.id });

  ctx.res.setHeader(
    "Set-Cookie",
    `admin_session=${encodeURIComponent(session)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`
  );

  return {
    success: true,
    admin: {
      id: admin.id,
      email: admin.email,
      nome: admin.nome,
    },
  };
};

const logoutAdmin = async ({ ctx }: any) => {
  ctx.res.setHeader(
    "Set-Cookie",
    "admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
  );

  return { success: true };
};

const meAdmin = async ({ ctx }: any) => {
  const adminId = getAdminIdFromReq(ctx.req);
  if (!adminId) return null;

  const admin = await getAdminById(adminId);
  if (!admin) return null;

  return {
    id: admin.id,
    email: admin.email,
    nome: admin.nome,
  };
};

/* =========================
   APP ROUTER
========================= */

export const appRouter = router({
  /* -------- SYSTEM -------- */
  healthCheck: publicProcedure.query(() => {
    return { status: "ok", uptime: process.uptime() };
  }),

  /* -------- AUTH (REAL) -------- */
  auth: router({
    login: publicProcedure
      .input(z.object({ email: z.string().email(), senha: z.string() }))
      .mutation(loginAdmin),

    logout: publicProcedure.mutation(logoutAdmin),

    me: publicProcedure.query(meAdmin),

    registro: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          senha: z.string(),
          nome: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const exists = await getAdminByEmail(input.email);

        if (exists) {
          throw new TRPCError({ code: "CONFLICT" });
        }

        const hash = await bcrypt.hash(input.senha, 10);

        return createAdmin({
          nome: input.nome,
          email: input.email,
          senhaHash: hash,
          ativo: false,
        });
      }),
  }),

  adminAuth: router({
  login: loginAdmin,
  logout: logoutAdmin,
  me: meAdmin,

  validateConvite: publicProcedure
    .input(z.object({ codigo: z.string() }))
    .query(async ({ input }) => {
      const convite = await getConviteByCode(input.codigo);

      if (!convite || convite.usado) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return { email: convite.email };
    }),

  acceptConviteAndRegister: publicProcedure
    .input(
      z.object({
        codigo: z.string(),
        email: z.string().email(),
        senha: z.string(),
        nome: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const convite = await getConviteByCode(input.codigo);

      if (!convite || convite.usado) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const hash = await bcrypt.hash(input.senha, 10);

      const admin = await createAdmin({
        nome: input.nome,
        email: input.email,
        senhaHash: hash,
        ativo: true,
      });

      await acceptConvite(input.codigo, admin.id);

      return { success: true };
    }),
}),

  /* -------- ADMINS -------- */
  admin: router({
    list: protectedProcedure.query(() => listAdmins()),

    promoteByEmail: protectedProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(({ input }) => promoteAdminByEmail(input.email)),

    deactivateByEmail: protectedProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(({ input }) => deactivateAdminByEmail(input.email)),

    createConvite: protectedProcedure
      .input(z.object({ email: z.string().email().optional() }))
      .mutation(async ({ input, ctx }) => {
        const codigo = nanoid(10);

        await createConvite({
          email: input.email ?? "",
          codigo,
          criadoPor: ctx.admin.id,
        });

        const base =
          process.env.FRONTEND_URL ||
          process.env.CLIENT_URL ||
          "http://localhost:5173";

        return {
          codigo,
          link: `${base}/admin/registro?codigo=${codigo}`,
        };
      }),
  }),

  /* -------- EXPERIMENTOS -------- */
  experimentos: router({
    listar: protectedProcedure.query(() => listExperimentos()),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getExperimentoById(input.id)),

    criar: protectedProcedure
      .input(z.object({ titulo: z.string(), descricao: z.string().optional() }))
      .mutation(({ input, ctx }) => {
        return createExperimento({
          titulo: input.titulo,
          slug: input.titulo
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, ""),
          descricao: input.descricao ?? "",
          adminId: ctx.admin.id,
          criadoPor: ctx.admin.id,
        });
      }),

    update: protectedProcedure
      .input(z.object({ id: z.number(), titulo: z.string().optional() }))
      .mutation(({ input }) => updateExperimento(input.id, input)),

    ativar: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => ativarExperimento(input.id)),

    desativar: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => desativarExperimento(input.id)),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteExperimento(input.id)),
  }),

  /* -------- AMOSTRAS -------- */
  amostras: router({
    listar: publicProcedure
      .input(z.object({ experimentoId: z.number() }))
      .query(({ input }) => listAmostras(input.experimentoId)),

    create: protectedProcedure
      .input(
        z.object({
          experimentoId: z.number(),
          nome: z.string(),
          codigo: z.string(),
          descricao: z.string().optional(),
        })
      )
      .mutation(({ input }) =>
        createAmostra({ ...input, ordem: 0 })
      ),

    update: protectedProcedure
      .input(z.object({ id: z.number(), nome: z.string().optional() }))
      .mutation(({ input }) => updateAmostra(input.id, input)),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteAmostra(input.id)),
  }),

  /* -------- ATRIBUTOS -------- */
  atributos: router({
    listar: publicProcedure
      .input(z.object({ experimentoId: z.number() }))
      .query(({ input }) => listAtributos(input.experimentoId)),

    create: protectedProcedure
      .input(z.object({ experimentoId: z.number(), nome: z.string() }))
      .mutation(({ input }) =>
        createAtributo({ ...input, ordem: 0 })
      ),

    update: protectedProcedure
      .input(z.object({ id: z.number(), nome: z.string().optional() }))
      .mutation(({ input }) => updateAtributo(input.id, input)),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteAtributo(input.id)),
  }),

  /* -------- DASHBOARD -------- */
  dashboard: router({
    getData: protectedProcedure
      .input(z.object({ experimentoId: z.number() }))
      .query(async ({ input }) => {
        const exp = await getExperimentoById(input.experimentoId);

        return {
          total: 0,
          sessoesFinalizadas: [],
          amostras: await listAmostras(input.experimentoId),
          atributos: await listAtributos(input.experimentoId),
          medias: [],
          experimento: exp,
        };
      }),

    exportar: protectedProcedure
      .input(z.object({ experimentoId: z.number() }))
      .query(async ({ input }) => {
        return {
          amostras: await listAmostras(input.experimentoId),
          atributos: await listAtributos(input.experimentoId),
          respostas: await getRespostasCompletas(input.experimentoId),
        };
      }),
  }),

  /* -------- AVALIAÇÃO -------- */
  avaliacao: router({
    getExperimento: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const exp = await getExperimentoBySlug(input.slug);

        if (!exp || !exp.ativo) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        return {
          experimento: exp,
          amostras: await listAmostras(exp.id),
          atributos: await listAtributos(exp.id),
        };
      }),

    iniciarSessao: publicProcedure
      .input(
        z.object({
          experimentoId: z.number(),
          idade: z.number(),
          cidade: z.string(),
          estado: z.string(),
          pais: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const exp = await getExperimentoById(input.experimentoId);

        if (!exp) throw new TRPCError({ code: "NOT_FOUND" });

        return createSessao({
          ...input,
          adminId: exp.adminId,
          finalizado: false,
        });
      }),

    salvarResposta: publicProcedure
      .input(
        z.object({
          sessaoId: z.number(),
          atributoId: z.number(),
          amostraId: z.number(),
          valor: z.number(),
        })
      )
      .mutation(({ input }) => upsertResposta(input)),

    finalizar: publicProcedure
      .input(
        z.object({
          sessaoId: z.number(),
          tempoTotal: z.number(),
        })
      )
      .mutation(({ input }) =>
        finalizarSessao(input.sessaoId, input.tempoTotal)
      ),
  }),
});

export type AppRouter = typeof appRouter;
export default appRouter;