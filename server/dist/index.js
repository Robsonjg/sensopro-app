// _core/index.ts
import "dotenv/config";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import path from "path";
import fs from "fs";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// routers.ts
import { eq as eq2, and as and2, desc as desc2, sql as sql2 } from "drizzle-orm";

// db.ts
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, desc, sql } from "drizzle-orm";

// ../drizzle/schema.ts
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  real,
  unique,
  serial
} from "drizzle-orm/pg-core";
var roleEnum = pgEnum("role", ["user", "admin"]);
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  senhaHash: text("senhaHash").notNull(),
  nome: varchar("nome", { length: 255 }),
  ativo: boolean("ativo").default(true).notNull(),
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizadoEm").defaultNow().notNull()
});
var experimentos = pgTable("experimentos", {
  id: serial("id").primaryKey(),
  adminId: integer("adminId").notNull(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  descricao: text("descricao"),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  ativo: boolean("ativo").default(false).notNull(),
  criadoPor: integer("criadoPor").notNull(),
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizadoEm").defaultNow().notNull()
});
var amostras = pgTable("amostras", {
  id: serial("id").primaryKey(),
  experimentoId: integer("experimentoId").notNull(),
  codigo: varchar("codigo", { length: 64 }).notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  ordem: integer("ordem").default(0).notNull(),
  criadoEm: timestamp("criadoEm").defaultNow().notNull()
});
var atributos = pgTable("atributos", {
  id: serial("id").primaryKey(),
  experimentoId: integer("experimentoId").notNull(),
  nome: varchar("nome", { length: 128 }).notNull(),
  descricao: text("descricao"),
  labelMin: varchar("labelMin", { length: 64 }).default("Muito Baixo"),
  labelMax: varchar("labelMax", { length: 64 }).default("Muito Alto"),
  ordem: integer("ordem").default(0).notNull(),
  criadoEm: timestamp("criadoEm").defaultNow().notNull()
});
var sessoes = pgTable("sessoes", {
  id: serial("id").primaryKey(),
  adminId: integer("adminId").notNull(),
  experimentoId: integer("experimentoId").notNull(),
  idade: integer("idade"),
  cidade: varchar("cidade", { length: 128 }),
  estado: varchar("estado", { length: 64 }),
  pais: varchar("pais", { length: 128 }),
  finalizado: boolean("finalizado").default(false).notNull(),
  tempoTotal: integer("tempoTotal"),
  finalizadoEm: timestamp("finalizadoEm"),
  criadoEm: timestamp("criadoEm").defaultNow().notNull()
});
var respostas = pgTable(
  "respostas",
  {
    id: serial("id").primaryKey(),
    sessaoId: integer("sessaoId").notNull(),
    atributoId: integer("atributoId").notNull(),
    amostraId: integer("amostraId").notNull(),
    valor: real("valor").notNull(),
    criadoEm: timestamp("criadoEm").defaultNow().notNull()
  },
  (t2) => [unique("uq_resposta").on(t2.sessaoId, t2.atributoId, t2.amostraId)]
);
var convites = pgTable("convites", {
  id: serial("id").primaryKey(),
  codigo: varchar("codigo", { length: 32 }).notNull().unique(),
  email: varchar("email", { length: 320 }),
  criadoPor: integer("criadoPor").notNull(),
  usado: boolean("usado").default(false).notNull(),
  usadoPor: integer("usadoPor"),
  usadoEm: timestamp("usadoEm"),
  expiradoEm: timestamp("expiradoEm"),
  criadoEm: timestamp("criadoEm").defaultNow().notNull()
});

// _core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// db.ts
var _db = null;
var _client = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      console.log("\u{1F4E1} Conectando ao Supabase...");
      _client = postgres(process.env.DATABASE_URL, {
        ssl: { rejectUnauthorized: false }
      });
      _db = drizzle(_client);
      console.log("\u2705 Conectado ao Supabase!");
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
      _client = null;
    }
  }
  return _db;
}
async function listUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).orderBy(users.createdAt);
}
async function updateUserRole(userId, role) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}
async function listExperimentos(adminId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(experimentos).orderBy(desc(experimentos.criadoEm));
}
async function getExperimentoById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(experimentos).where(eq(experimentos.id, id)).limit(1);
  return result[0];
}
async function getExperimentoBySlug(slug) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(experimentos).where(eq(experimentos.slug, slug)).limit(1);
  return result[0];
}
async function createExperimento(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const result = await db.insert(experimentos).values(data).returning({ id: experimentos.id });
  return result[0]?.id || 0;
}
async function updateExperimento(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(experimentos).set({ ...data, atualizadoEm: /* @__PURE__ */ new Date() }).where(eq(experimentos.id, id));
}
async function deleteExperimento(id) {
  const db = await getDb();
  if (!db) return;
  await db.delete(experimentos).where(eq(experimentos.id, id));
}
async function ativarExperimento(id) {
  const db = await getDb();
  if (!db) return;
  const exp = await getExperimentoById(id);
  if (exp) {
    await db.update(experimentos).set({ ativo: false }).where(eq(experimentos.adminId, exp.adminId));
  }
  await db.update(experimentos).set({ ativo: true }).where(eq(experimentos.id, id));
}
async function desativarExperimento(id) {
  const db = await getDb();
  if (!db) return;
  await db.update(experimentos).set({ ativo: false }).where(eq(experimentos.id, id));
}
async function listAmostras(experimentoId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(amostras).where(eq(amostras.experimentoId, experimentoId)).orderBy(amostras.ordem);
}
async function createAmostra(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const result = await db.insert(amostras).values(data).returning({ id: amostras.id });
  return result[0]?.id || 0;
}
async function updateAmostra(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(amostras).set(data).where(eq(amostras.id, id));
}
async function deleteAmostra(id) {
  const db = await getDb();
  if (!db) return;
  await db.delete(amostras).where(eq(amostras.id, id));
}
async function listAtributos(experimentoId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(atributos).where(eq(atributos.experimentoId, experimentoId)).orderBy(atributos.ordem);
}
async function createAtributo(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const result = await db.insert(atributos).values(data).returning({ id: atributos.id });
  return result[0]?.id || 0;
}
async function updateAtributo(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(atributos).set(data).where(eq(atributos.id, id));
}
async function deleteAtributo(id) {
  const db = await getDb();
  if (!db) return;
  await db.delete(atributos).where(eq(atributos.id, id));
}
async function createSessao(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const result = await db.insert(sessoes).values(data).returning({ id: sessoes.id });
  return result[0]?.id || 0;
}
async function finalizarSessao(sessaoId, tempoTotal, finalizadoEm) {
  const db = await getDb();
  if (!db) return;
  console.log("\u{1F4DD} Atualizando sess\xE3o:", sessaoId, "Tempo:", tempoTotal);
  await db.update(sessoes).set({ finalizado: true, tempoTotal, finalizadoEm: finalizadoEm || /* @__PURE__ */ new Date() }).where(eq(sessoes.id, sessaoId));
  console.log("\u2705 Sess\xE3o finalizada com sucesso!");
}
async function upsertResposta(data) {
  const db = await getDb();
  if (!db) return;
  await db.insert(respostas).values(data).onConflictDoUpdate({
    target: [respostas.sessaoId, respostas.atributoId, respostas.amostraId],
    set: { valor: data.valor }
  });
}
async function getRespostasCompletas(experimentoId) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    sessaoId: sessoes.id,
    idade: sessoes.idade,
    cidade: sessoes.cidade,
    estado: sessoes.estado,
    pais: sessoes.pais,
    tempoTotal: sessoes.tempoTotal,
    atributoNome: atributos.nome,
    amostraNome: amostras.nome,
    valor: respostas.valor
  }).from(sessoes).innerJoin(respostas, eq(respostas.sessaoId, sessoes.id)).innerJoin(atributos, eq(atributos.id, respostas.atributoId)).innerJoin(amostras, eq(amostras.id, respostas.amostraId)).where(eq(sessoes.experimentoId, experimentoId));
}
async function createAdmin(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const result = await db.insert(admins).values(data).returning();
  return result[0];
}
async function getAdminByEmail(email) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
  return result[0];
}
async function getAdminById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(admins).where(eq(admins.id, id)).limit(1);
  return result[0];
}
async function listAdmins() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(admins).orderBy(admins.criadoEm);
}
async function promoteAdminByEmail(email) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.update(admins).set({ ativo: true, atualizadoEm: /* @__PURE__ */ new Date() }).where(eq(admins.email, email)).returning();
  return result[0];
}
async function deactivateAdminByEmail(email) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.update(admins).set({ ativo: false, atualizadoEm: /* @__PURE__ */ new Date() }).where(eq(admins.email, email)).returning();
  return result[0];
}
async function createConvite(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const result = await db.insert(convites).values(data).returning();
  return result[0];
}
async function getConviteByCode(codigo) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(convites).where(eq(convites.codigo, codigo)).limit(1);
  return result[0];
}
async function acceptConvite(codigo, adminId) {
  const db = await getDb();
  if (!db) return;
  await db.update(convites).set({ usado: true, usadoPor: adminId, usadoEm: /* @__PURE__ */ new Date() }).where(eq(convites.codigo, codigo));
}

// routers.ts
import { TRPCError as TRPCError3 } from "@trpc/server";
import { nanoid } from "nanoid";
import { z as z2 } from "zod";
import bcrypt from "bcrypt";

// ../shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;

// _core/cookies.ts
var LOCAL_HOSTS = /* @__PURE__ */ new Set(["localhost", "127.0.0.1", "::1"]);
function isIpAddress(host) {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  const hostname = req.hostname;
  const isLocal = LOCAL_HOSTS.has(hostname) || isIpAddress(hostname);
  return {
    httpOnly: true,
    path: "/",
    sameSite: isLocal ? "lax" : "none",
    secure: !isLocal && isSecureRequest(req),
    maxAge: 2592e6
    // 30 dias
  };
}

// _core/systemRouter.ts
import { z } from "zod";

// _core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// _core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var emailPasswordAdminProcedure = t.procedure.use(
  t.middleware(async ({ ctx, next }) => {
    console.log("\u{1F510} Middleware - Verificando autentica\xE7\xE3o...");
    let adminId;
    try {
      const cookieHeader = ctx.req.headers.cookie;
      console.log("\u{1F4DD} Cookie header recebido:", cookieHeader ? "Sim" : "N\xE3o");
      if (cookieHeader) {
        const cookies = cookieHeader.split("; ");
        for (const cookie of cookies) {
          if (cookie.startsWith("admin_session=")) {
            const cookieValue = cookie.substring("admin_session=".length);
            const decodedValue = decodeURIComponent(cookieValue);
            const sessionData = JSON.parse(decodedValue);
            adminId = sessionData.adminId;
            console.log("\u2705 Admin ID encontrado no cookie:", adminId);
            break;
          }
        }
      }
    } catch (error) {
      console.error("\u274C Erro ao parsear cookie:", error);
    }
    if (!adminId) {
      console.log("\u274C N\xE3o autenticado - adminId n\xE3o encontrado");
      throw new TRPCError2({ code: "FORBIDDEN", message: "N\xE3o autenticado" });
    }
    const adminData = await getAdminById(adminId);
    if (!adminData) {
      console.log("\u274C Admin n\xE3o encontrado no banco para ID:", adminId);
      throw new TRPCError2({ code: "FORBIDDEN", message: "Admin n\xE3o encontrado" });
    }
    if (!adminData.ativo) {
      console.log("\u274C Admin desativado:", adminData.email);
      throw new TRPCError2({ code: "FORBIDDEN", message: "Admin desativado" });
    }
    const admin = {
      id: adminData.id,
      email: adminData.email,
      nome: adminData.nome,
      ativo: adminData.ativo
    };
    console.log("\u2705 Autenticado como:", admin.email);
    return next({
      ctx: {
        ...ctx,
        adminId: admin.id,
        admin
      }
    });
  })
);
var adminProcedure = emailPasswordAdminProcedure;
var protectedProcedure = emailPasswordAdminProcedure;

// _core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// routers.ts
function slugify(text2) {
  return text2.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => null),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  // ─── Experimentos ──────────────────────────────────────────────────────────
  experimentos: router({
    list: emailPasswordAdminProcedure.query(async ({ ctx }) => {
      return listExperimentos(ctx.adminId);
    }),
    getById: emailPasswordAdminProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      const exp = await getExperimentoById(input.id);
      if (!exp) throw new TRPCError3({ code: "NOT_FOUND" });
      return exp;
    }),
    create: emailPasswordAdminProcedure.input(
      z2.object({
        titulo: z2.string().min(1),
        descricao: z2.string().optional()
      })
    ).mutation(async ({ input, ctx }) => {
      const baseSlug = slugify(input.titulo);
      const slug = `${baseSlug}-${nanoid(6)}`;
      const id = await createExperimento({
        adminId: ctx.adminId,
        titulo: input.titulo,
        descricao: input.descricao ?? null,
        slug,
        ativo: false,
        criadoPor: ctx.adminId
      });
      return { id, slug };
    }),
    update: emailPasswordAdminProcedure.input(
      z2.object({
        id: z2.number(),
        titulo: z2.string().min(1).optional(),
        descricao: z2.string().optional()
      })
    ).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateExperimento(id, data);
      return { success: true };
    }),
    delete: emailPasswordAdminProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deleteExperimento(input.id);
      return { success: true };
    }),
    ativar: emailPasswordAdminProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      const exp = await getExperimentoById(input.id);
      if (!exp) throw new TRPCError3({ code: "NOT_FOUND" });
      await ativarExperimento(input.id);
      return { success: true };
    }),
    desativar: emailPasswordAdminProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      const exp = await getExperimentoById(input.id);
      if (!exp) throw new TRPCError3({ code: "NOT_FOUND" });
      await desativarExperimento(input.id);
      return { success: true };
    })
  }),
  // ─── Amostras ──────────────────────────────────────────────────────────────
  amostras: router({
    list: emailPasswordAdminProcedure.input(z2.object({ experimentoId: z2.number() })).query(async ({ input }) => {
      return listAmostras(input.experimentoId);
    }),
    create: emailPasswordAdminProcedure.input(
      z2.object({
        experimentoId: z2.number(),
        codigo: z2.string().min(1),
        nome: z2.string().min(1),
        descricao: z2.string().optional(),
        ordem: z2.number().default(0)
      })
    ).mutation(async ({ input }) => {
      const id = await createAmostra(input);
      return { id };
    }),
    update: emailPasswordAdminProcedure.input(
      z2.object({
        id: z2.number(),
        codigo: z2.string().min(1).optional(),
        nome: z2.string().min(1).optional(),
        descricao: z2.string().optional(),
        ordem: z2.number().optional()
      })
    ).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateAmostra(id, data);
      return { success: true };
    }),
    delete: emailPasswordAdminProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deleteAmostra(input.id);
      return { success: true };
    }),
    reorder: emailPasswordAdminProcedure.input(z2.object({ items: z2.array(z2.object({ id: z2.number(), ordem: z2.number() })) })).mutation(async ({ input }) => {
      await Promise.all(input.items.map((item) => updateAmostra(item.id, { ordem: item.ordem })));
      return { success: true };
    })
  }),
  // ─── Atributos ─────────────────────────────────────────────────────────────
  atributos: router({
    list: emailPasswordAdminProcedure.input(z2.object({ experimentoId: z2.number() })).query(async ({ input }) => {
      return listAtributos(input.experimentoId);
    }),
    create: emailPasswordAdminProcedure.input(
      z2.object({
        experimentoId: z2.number(),
        nome: z2.string().min(1),
        descricao: z2.string().optional(),
        labelMin: z2.string().optional(),
        labelMax: z2.string().optional(),
        ordem: z2.number().default(0)
      })
    ).mutation(async ({ input }) => {
      const id = await createAtributo(input);
      return { id };
    }),
    update: emailPasswordAdminProcedure.input(
      z2.object({
        id: z2.number(),
        nome: z2.string().min(1).optional(),
        descricao: z2.string().optional(),
        labelMin: z2.string().optional(),
        labelMax: z2.string().optional(),
        ordem: z2.number().optional()
      })
    ).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateAtributo(id, data);
      return { success: true };
    }),
    delete: emailPasswordAdminProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deleteAtributo(input.id);
      return { success: true };
    }),
    reorder: emailPasswordAdminProcedure.input(z2.object({ items: z2.array(z2.object({ id: z2.number(), ordem: z2.number() })) })).mutation(async ({ input }) => {
      await Promise.all(
        input.items.map((item) => updateAtributo(item.id, { ordem: item.ordem }))
      );
      return { success: true };
    })
  }),
  // ─── Avaliação Pública ─────────────────────────────────────────────────────
  avaliacao: router({
    getExperimento: publicProcedure.input(z2.object({ slug: z2.string() })).query(async ({ input }) => {
      const exp = await getExperimentoBySlug(input.slug);
      if (!exp || !exp.ativo)
        throw new TRPCError3({ code: "NOT_FOUND", message: "Avalia\xE7\xE3o n\xE3o encontrada ou inativa." });
      const [amostrasData, atributosData] = await Promise.all([
        listAmostras(exp.id),
        listAtributos(exp.id)
      ]);
      return { experimento: exp, amostras: amostrasData, atributos: atributosData };
    }),
    iniciarSessao: publicProcedure.input(
      z2.object({
        idade: z2.number(),
        cidade: z2.string(),
        estado: z2.string(),
        pais: z2.string(),
        experimentoId: z2.number()
      })
    ).mutation(async ({ input }) => {
      console.log("\u{1F680} Iniciando sess\xE3o para experimento:", input.experimentoId);
      const experimento = await getExperimentoById(input.experimentoId);
      if (!experimento) {
        throw new TRPCError3({ code: "NOT_FOUND", message: "Experimento n\xE3o encontrado" });
      }
      const sessao = await createSessao({
        adminId: experimento.adminId,
        // Usa o adminId do experimento
        idade: input.idade,
        cidade: input.cidade.trim(),
        estado: input.estado.trim(),
        pais: input.pais.trim(),
        experimentoId: input.experimentoId,
        finalizado: false
      });
      console.log("\u2705 Sess\xE3o criada com ID:", sessao);
      return sessao;
    }),
    salvarResposta: publicProcedure.input(
      z2.object({
        sessaoId: z2.number(),
        atributoId: z2.number(),
        amostraId: z2.number(),
        valor: z2.number().min(0).max(100)
      })
    ).mutation(async ({ input }) => {
      await upsertResposta(input);
      return { success: true };
    }),
    finalizar: publicProcedure.input(z2.object({ sessaoId: z2.number(), tempoTotal: z2.number() })).mutation(async ({ input }) => {
      await finalizarSessao(input.sessaoId, input.tempoTotal);
      return { success: true };
    })
  }),
  // ─── Dashboard ─────────────────────────────────────────────────────────────
  dashboard: router({
    getData: emailPasswordAdminProcedure.input(z2.object({ experimentoId: z2.number() })).query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not connected");
      const [exp, amostrasData, atributosData] = await Promise.all([
        getExperimentoById(input.experimentoId),
        listAmostras(input.experimentoId),
        listAtributos(input.experimentoId)
      ]);
      if (!exp) throw new TRPCError3({ code: "NOT_FOUND" });
      if (ctx.adminId && exp.criadoPor !== ctx.adminId) {
        throw new TRPCError3({ code: "FORBIDDEN" });
      }
      const totalResult = await db.select({ count: sql2`count(*)` }).from(sessoes).where(eq2(sessoes.experimentoId, input.experimentoId));
      const totalSessoes = Number(totalResult[0]?.count) || 0;
      const concluidasResult = await db.select({ count: sql2`count(*)` }).from(sessoes).where(and2(eq2(sessoes.experimentoId, input.experimentoId), eq2(sessoes.finalizado, true)));
      const sessoesConcluidas = Number(concluidasResult[0]?.count) || 0;
      const tempoResult = await db.select({ avg: sql2`avg(${sessoes.tempoTotal})` }).from(sessoes).where(eq2(sessoes.experimentoId, input.experimentoId));
      const tempoMedio = tempoResult[0]?.avg || 0;
      const sessoesFinalizadas = await db.select({
        id: sessoes.id,
        idade: sessoes.idade,
        cidade: sessoes.cidade,
        estado: sessoes.estado,
        pais: sessoes.pais,
        tempoTotal: sessoes.tempoTotal,
        finalizadoEm: sessoes.finalizadoEm
      }).from(sessoes).where(and2(eq2(sessoes.experimentoId, input.experimentoId), eq2(sessoes.finalizado, true))).orderBy(desc2(sessoes.criadoEm));
      const mediasResult = await db.execute(sql2`
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
        medias: mediasResult || []
      };
    }),
    exportar: emailPasswordAdminProcedure.input(z2.object({ experimentoId: z2.number() })).query(async ({ input, ctx }) => {
      const exp = await getExperimentoById(input.experimentoId);
      if (!exp) throw new TRPCError3({ code: "NOT_FOUND" });
      if (ctx.adminId && exp.criadoPor !== ctx.adminId) {
        throw new TRPCError3({ code: "FORBIDDEN" });
      }
      const [amostrasData, atributosData, respostasData] = await Promise.all([
        listAmostras(input.experimentoId),
        listAtributos(input.experimentoId),
        getRespostasCompletas(input.experimentoId)
      ]);
      return { amostras: amostrasData, atributos: atributosData, respostas: respostasData };
    })
  }),
  adminManagement: router({
    listUsers: emailPasswordAdminProcedure.query(async () => {
      return await listUsers();
    }),
    promoteToAdmin: emailPasswordAdminProcedure.input(z2.object({ userId: z2.number() })).mutation(async ({ input }) => {
      await updateUserRole(input.userId, "admin");
      return { success: true };
    }),
    demoteToUser: emailPasswordAdminProcedure.input(z2.object({ userId: z2.number() })).mutation(async ({ input }) => {
      await updateUserRole(input.userId, "user");
      return { success: true };
    })
  }),
  adminAuth: router({
    registro: publicProcedure.input(z2.object({ email: z2.string().email(), senha: z2.string().min(6), nome: z2.string().optional() })).mutation(async ({ input }) => {
      const existente = await getAdminByEmail(input.email);
      if (existente) throw new TRPCError3({ code: "CONFLICT", message: "Email j\xE1 registrado" });
      const senhaHash = await bcrypt.hash(input.senha, 10);
      const admin = await createAdmin({ email: input.email, senhaHash, nome: input.nome, ativo: true });
      return { id: admin.id, email: admin.email, nome: admin.nome };
    }),
    login: publicProcedure.input(z2.object({ email: z2.string().email(), senha: z2.string() })).mutation(async ({ input, ctx }) => {
      console.log("\u{1F511} Tentando login para:", input.email);
      const admin = await getAdminByEmail(input.email);
      if (!admin) {
        console.log("\u274C Admin n\xE3o encontrado:", input.email);
        throw new TRPCError3({ code: "UNAUTHORIZED", message: "Credenciais inv\xE1lidas" });
      }
      if (!admin.ativo) {
        console.log("\u274C Admin desativado:", input.email);
        throw new TRPCError3({ code: "FORBIDDEN", message: "Admin desativado" });
      }
      const senhaValida = await bcrypt.compare(input.senha, admin.senhaHash);
      if (!senhaValida) {
        console.log("\u274C Senha inv\xE1lida para:", input.email);
        throw new TRPCError3({ code: "UNAUTHORIZED", message: "Credenciais inv\xE1lidas" });
      }
      const sessionData = JSON.stringify({ adminId: admin.id, email: admin.email });
      console.log("\u{1F36A} Criando cookie com:", sessionData);
      ctx.res.cookie("admin_session", sessionData, {
        httpOnly: false,
        secure: false,
        sameSite: "lax",
        maxAge: 2592e6,
        path: "/"
      });
      console.log("\u2705 Login bem sucedido para:", admin.email);
      console.log("\u{1F4CB} Headers de resposta configurados");
      return { id: admin.id, email: admin.email, nome: admin.nome };
    }),
    me: emailPasswordAdminProcedure.query(async ({ ctx }) => {
      console.log("\u{1F4E1} Rota me chamada - ctx.admin:", ctx.admin ? "Presente" : "Ausente");
      if (ctx.admin) {
        return {
          id: ctx.admin.id,
          email: ctx.admin.email,
          nome: ctx.admin.nome
        };
      }
      return null;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie("admin_session", { ...cookieOptions, httpOnly: true });
      return { success: true };
    }),
    listAll: protectedProcedure.query(async () => {
      const adminsList = await listAdmins();
      return adminsList.map((a) => ({ id: a.id, email: a.email, nome: a.nome, ativo: a.ativo, criadoEm: a.criadoEm }));
    }),
    promoteByEmail: protectedProcedure.input(z2.object({ email: z2.string().email() })).mutation(async ({ input }) => {
      const admin = await promoteAdminByEmail(input.email);
      if (!admin) throw new TRPCError3({ code: "NOT_FOUND", message: "Admin nao encontrado" });
      return { id: admin.id, email: admin.email, nome: admin.nome, ativo: admin.ativo };
    }),
    deactivateByEmail: protectedProcedure.input(z2.object({ email: z2.string().email() })).mutation(async ({ input }) => {
      const admin = await deactivateAdminByEmail(input.email);
      if (!admin) throw new TRPCError3({ code: "NOT_FOUND", message: "Admin nao encontrado" });
      return { id: admin.id, email: admin.email, nome: admin.nome, ativo: admin.ativo };
    }),
    createConvite: protectedProcedure.input(z2.object({ email: z2.string().email().optional() })).mutation(async ({ input, ctx }) => {
      const codigo = nanoid(8);
      const adminId = ctx.adminId || 1;
      const convite = await createConvite({
        codigo,
        email: input.email,
        criadoPor: adminId,
        expiradoEm: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3)
      });
      return { codigo: convite.codigo, link: `${process.env.VITE_APP_URL || "http://localhost:3000"}/admin/convite/${convite.codigo}` };
    }),
    validateConvite: publicProcedure.input(z2.object({ codigo: z2.string() })).query(async ({ input }) => {
      const convite = await getConviteByCode(input.codigo);
      if (!convite) throw new TRPCError3({ code: "NOT_FOUND", message: "Convite n\xE3o encontrado" });
      if (convite.usado) throw new TRPCError3({ code: "CONFLICT", message: "Convite j\xE1 foi utilizado" });
      if (convite.expiradoEm && /* @__PURE__ */ new Date() > convite.expiradoEm) throw new TRPCError3({ code: "CONFLICT", message: "Convite expirado" });
      return { valido: true, email: convite.email };
    }),
    acceptConviteAndRegister: publicProcedure.input(z2.object({ codigo: z2.string(), email: z2.string().email(), senha: z2.string().min(6), nome: z2.string() })).mutation(async ({ input }) => {
      const convite = await getConviteByCode(input.codigo);
      if (!convite) throw new TRPCError3({ code: "NOT_FOUND", message: "Convite n\xE3o encontrado" });
      if (convite.usado) throw new TRPCError3({ code: "CONFLICT", message: "Convite j\xE1 foi utilizado" });
      if (convite.expiradoEm && /* @__PURE__ */ new Date() > convite.expiradoEm) throw new TRPCError3({ code: "CONFLICT", message: "Convite expirado" });
      const existente = await getAdminByEmail(input.email);
      if (existente) throw new TRPCError3({ code: "CONFLICT", message: "Email j\xE1 registrado" });
      const senhaHash = await bcrypt.hash(input.senha, 10);
      const admin = await createAdmin({ email: input.email, senhaHash, nome: input.nome, ativo: false });
      await acceptConvite(input.codigo, admin.id);
      return { id: admin.id, email: admin.email, nome: admin.nome, mensagem: "Conta criada! Aguarde ativa\xE7\xE3o do admin" };
    })
  })
});

// _core/context.ts
async function createContext({ req, res }) {
  return {
    req,
    res
  };
}

// _core/index.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
config({ path: join(__dirname, "../../.env.local"), override: true });
console.log("\u{1F527} Configura\xE7\xE3o carregada:");
console.log("   DATABASE_URL:", process.env.DATABASE_URL ? "\u2705 Presente" : "\u274C Ausente");
console.log("   JWT_SECRET:", process.env.JWT_SECRET ? "\u2705 Presente" : "\u274C Ausente");
console.log("   PORT:", process.env.PORT || 3001);
console.log("   NODE_ENV:", process.env.NODE_ENV || "development");
var app = express();
var PORT = process.env.PORT || 3001;
var isProduction = process.env.NODE_ENV === "production";
var corsOptions = {
  origin: isProduction ? true : ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie", "X-Requested-With"],
  exposedHeaders: ["Set-Cookie"]
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
var clientDistPath = path.join(__dirname, "../../client/dist");
var possiblePaths = [
  path.join(__dirname, "../../client/dist"),
  path.join(__dirname, "../..", "client", "dist"),
  path.join(process.cwd(), "client", "dist")
];
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    clientDistPath = p;
    console.log("\u2705 Encontrado client/dist em:", clientDistPath);
    break;
  }
}
console.log("\u{1F4C2} Servindo frontend de:", clientDistPath);
app.use(express.static(clientDistPath, {
  maxAge: "1d",
  etag: false
}));
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.use("/api/trpc", createExpressMiddleware({
  router: appRouter,
  createContext,
  onError: ({ error, type, path: path2 }) => {
    console.error(`\u274C tRPC Error on ${type} "${path2}":`, error.message);
  }
}));
app.use("*", (req, res) => {
  const indexPath = path.join(clientDistPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.error("\u274C index.html n\xE3o encontrado em:", indexPath);
    res.status(404).json({ error: "P\xE1gina n\xE3o encontrada" });
  }
});
var server = app.listen(PORT, () => {
  console.log(`
\u{1F680} Servidor rodando em http://localhost:${PORT}/`);
  console.log(`\u{1F4E1} API tRPC: http://localhost:${PORT}/api/trpc`);
  console.log(`\u{1F510} Login admin: http://localhost:3000/admin/login
`);
  console.log(`\u{1F4CB} CORS configurado com credentials: true`);
  console.log(`\u{1F4CB} Ambiente: ${isProduction ? "PRODU\xC7\xC3O" : "DESENVOLVIMENTO"}`);
});
process.on("SIGTERM", () => {
  console.log("\u{1F6D1} Recebido SIGTERM, fechando servidor...");
  server.close(() => {
    console.log("\u2705 Servidor fechado");
    process.exit(0);
  });
});
