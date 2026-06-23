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
   HELPERS (PADRÃO: admin_id)
========================= */

function getadmin_idFromReq(req: any): number | undefined {
  const cookieHeader = req?.headers?.cookie;
  if (!cookieHeader) return undefined;

  // Divide os cookies tratando espaços extras comuns entre navegadores
  const cookies = cookieHeader.split(";").map((c: string) => c.trim());

  for (const cookie of cookies) {
    if (cookie.startsWith("admin_session=")) {
      try {
        const value = cookie.replace("admin_session=", "");
        // Crucial: Desfaz a codificação de URL que o cookie sofre ao ser gravado
        const decoded = decodeURIComponent(value);
        const parsed = JSON.parse(decoded);
        
        // PADRÃO FORÇADO: Busca estritamente pela chave minúscula do banco
        return parsed.admin_id; 
      } catch (err) {
        console.error("❌ Erro ao decodificar cookie de sessão:", err);
        return undefined;
      }
    }
  }
  return undefined;
}

async function loginAdminFn({ input, ctx }: { input: any; ctx: any }) {
  const admin = await getAdminByEmail(input.email);
  if (!admin || !admin.ativo || !admin.senha_hash) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas" });
  }

  const senhaValida = await bcrypt.compare(input.senha, admin.senha_hash);
  if (!senhaValida) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas" });
  }

  const sessionData = JSON.stringify({ admin_id: admin.id });
  
  // CORRIGIDO PARA PRODUÇÃO: SameSite=None e Secure são obrigatórios para Vercel + Railway
  ctx.res.setHeader(
    "Set-Cookie",
    `admin_session=${encodeURIComponent(sessionData)}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${60 * 60 * 24 * 7}`
  );

  return { 
    success: true,
    admin: {
      id: admin.id,
      email: admin.email,
      nome: admin.nome,
    }
  };
}

async function logoutAdminFn({ ctx }: { ctx: any }) {
  // CORRIGIDO PARA PRODUÇÃO: Mesmas diretivas no logout para limpar com sucesso
  ctx.res.setHeader(
    "Set-Cookie",
    "admin_session=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0"
  );
  return { success: true };
}

async function meAdminFn({ ctx }: { ctx: any }) {
  const admin_id = getadmin_idFromReq(ctx.req);
  if (!admin_id) return null;

  const admin = await getAdminById(admin_id);
  if (!admin) return null;

  return {
    id: admin.id,
    email: admin.email,
    nome: admin.nome,
  };
}

/* =========================
   ROUTER
========================= */

export const appRouter = router({
  /* -------- SYSTEM -------- */
  healthCheck: publicProcedure.query(() => {
    return { status: "ok", uptime: process.uptime() };
  }),

  /* -------- AUTH -------- */
  auth: router({
    login: publicProcedure
      .input(z.object({ email: z.string().email(), senha: z.string() }))
      .mutation(loginAdminFn),

    logout: publicProcedure.mutation(logoutAdminFn),

    me: publicProcedure.query(meAdminFn),

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
          senha_hash: hash,
          ativo: true,
        });
      }),
  }),

  /* -------- ADMIN AUTH & MANAGEMENT -------- */
  adminAuth: router({
    login: publicProcedure
      .input(z.object({ email: z.string().email(), senha: z.string() }))
      .mutation(loginAdminFn),

    logout: publicProcedure.mutation(logoutAdminFn),

    me: publicProcedure.query(meAdminFn),

    // ADICIONE ESTA ROTA AQUI: Sanando o erro do "trpc.adminAuth.registro"
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
          senha_hash: hash,
          ativo: false, // Criado como falso até aprovação ou link
        });
      }),

    list: protectedProcedure.query(() => listAdmins()),

    promoteByEmail: protectedProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(({ input }) => promoteAdminByEmail(input.email)),

    deactivateByEmail: protectedProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(({ input }) => deactivateAdminByEmail(input.email)),

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
          senha_hash: hash,
          ativo: true,
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
          criado_por: ctx.admin.id, 
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
          criado_por: ctx.admin.id,
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
      .mutation(({ input, ctx }) =>
        createExperimento({
          titulo: input.titulo,
          slug: input.titulo
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, ""),
          descricao: input.descricao ?? "",
          admin_id: ctx.admin.id,
          criado_por: ctx.admin.id,
        })
      ),

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
      .input(z.object({ experimento_id: z.number() }))
      .query(({ input }) => listAmostras(input.experimento_id)),

    create: protectedProcedure
      .input(
        z.object({
          experimento_id: z.number(),
          nome: z.string(),
          codigo: z.string(),
          descricao: z.string().optional(),
          ordem: z.number(),
        })
      )
      .mutation(({ input }) =>
        createAmostra({ ...input })
      ),

    reorder: protectedProcedure
      .input(
        z.object({
          items: z.array(z.object({ id: z.number(), ordem: z.number() })),
        })
      )
      .mutation(async ({ input }) => {
        for (const item of input.items) {
          await updateAmostra(item.id, { ordem: item.ordem });
        }
        return { success: true };
      }),

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
      .input(z.object({ experimento_id: z.number() }))
      .query(({ input }) => listAtributos(input.experimento_id)),

    create: protectedProcedure
      .input(
        z.object({ 
          experimento_id: z.number(), 
          nome: z.string(),
          ordem: z.number(),
        })
      )
      .mutation(({ input }) =>
        createAtributo({ ...input })
      ),

    reorder: protectedProcedure
      .input(
        z.object({
          // CORRIGIDO: Alterado de a.number() para z.number()
          items: z.array(z.object({ id: z.number(), ordem: z.number() })),
        })
      )
      .mutation(async ({ input }) => {
        for (const item of input.items) {
          await updateAtributo(item.id, { ordem: item.ordem });
        }
        return { success: true };
      }),

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
      .input(z.object({ experimento_id: z.number() }))
      .query(async ({ input }) => {
        const exp = await getExperimentoById(input.experimento_id);

        return {
          total: 0,
          sessoesFinalizadas: [],
          amostras: await listAmostras(input.experimento_id),
          atributos: await listAtributos(input.experimento_id),
          medias: [],
          experimento: exp,
        };
      }),

    exportar: protectedProcedure
      .input(z.object({ experimento_id: z.number() }))
      .query(async ({ input }) => {
        return {
          amostras: await listAmostras(input.experimento_id),
          atributos: await listAtributos(input.experimento_id),
          respostas: await getRespostasCompletas(input.experimento_id),
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
          experimento_id: z.number(),
          idade: z.number(),
          cidade: z.string(),
          estado: z.string(),
          pais: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const exp = await getExperimentoById(input.experimento_id);

        if (!exp) throw new TRPCError({ code: "NOT_FOUND" });

        return createSessao({
          ...input,
          admin_id: exp.admin_id,
          finalizado: false,
        });
      }),

    salvarResposta: publicProcedure
      .input(
        z.object({
          sessao_id: z.number(),
          atributo_id: z.number(),
          amostra_id: z.number(),
          valor: z.number(),
        })
      )
      .mutation(({ input }) => upsertResposta(input)),

    finalizar: publicProcedure
      .input(
        z.object({
          sessao_id: z.number(),
          tempo_total: z.number(),
        })
      )
      .mutation(({ input }) =>
        finalizarSessao(input.sessao_id, input.tempo_total)
      ),
  }),
});

export type AppRouter = typeof appRouter;
export default appRouter;