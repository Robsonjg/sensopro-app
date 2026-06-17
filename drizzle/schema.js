import { boolean, integer, pgEnum, pgTable, text, timestamp, varchar, real, unique, serial, } from "drizzle-orm/pg-core";
export const roleEnum = pgEnum("role", ["user", "admin"]);
// ─── Users ───────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    openId: varchar("openId", { length: 64 }).notNull().unique(),
    name: text("name"),
    email: varchar("email", { length: 320 }),
    loginMethod: varchar("loginMethod", { length: 64 }),
    role: roleEnum("role").default("user").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
// ─── Admins ──────────────────────────────────────────────────────────────────
export const admins = pgTable("admins", {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 320 }).notNull().unique(),
    // CORREÇÃO: Força o Drizzle a buscar "senhaHash" com o 'H' maiúsculo do banco
    senhaHash: text("senhaHash").notNull(),
    nome: varchar("nome", { length: 255 }),
    ativo: boolean("ativo").default(true).notNull(),
    // CORREÇÃO: Força o mapeamento do 'Em' maiúsculo do Supabase
    criadoEm: timestamp("criadoEm").defaultNow().notNull(),
    atualizadoEm: timestamp("atualizadoEm").defaultNow().notNull(),
});
// ─── Experimentos ────────────────────────────────────────────────────────────
export const experimentos = pgTable("experimentos", {
    id: serial("id").primaryKey(),
    adminId: integer("adminId").notNull(),
    titulo: varchar("titulo", { length: 255 }).notNull(),
    descricao: text("descricao"),
    slug: varchar("slug", { length: 128 }).notNull().unique(),
    ativo: boolean("ativo").default(false).notNull(),
    criadoPor: integer("criadoPor").notNull(),
    criadoEm: timestamp("criadoEm").defaultNow().notNull(),
    atualizadoEm: timestamp("atualizadoEm").defaultNow().notNull(),
});
// ─── Amostras ────────────────────────────────────────────────────────────────
export const amostras = pgTable("amostras", {
    id: serial("id").primaryKey(),
    experimentoId: integer("experimentoId").notNull(),
    codigo: varchar("codigo", { length: 64 }).notNull(),
    nome: varchar("nome", { length: 255 }).notNull(),
    descricao: text("descricao"),
    ordem: integer("ordem").default(0).notNull(),
    criadoEm: timestamp("criadoEm").defaultNow().notNull(),
});
// ─── Atributos ───────────────────────────────────────────────────────────────
export const atributos = pgTable("atributos", {
    id: serial("id").primaryKey(),
    experimentoId: integer("experimentoId").notNull(),
    nome: varchar("nome", { length: 128 }).notNull(),
    descricao: text("descricao"),
    labelMin: varchar("labelMin", { length: 64 }).default("Muito Baixo"),
    labelMax: varchar("labelMax", { length: 64 }).default("Muito Alto"),
    ordem: integer("ordem").default(0).notNull(),
    criadoEm: timestamp("criadoEm").defaultNow().notNull(),
});
// ─── Sessões ─────────────────────────────────────────────────────────────────
export const sessoes = pgTable("sessoes", {
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
    criadoEm: timestamp("criadoEm").defaultNow().notNull(),
});
// ─── Respostas ───────────────────────────────────────────────────────────────
export const respostas = pgTable("respostas", {
    id: serial("id").primaryKey(),
    sessaoId: integer("sessaoId").notNull(),
    atributoId: integer("atributoId").notNull(),
    amostraId: integer("amostraId").notNull(),
    valor: real("valor").notNull(),
    criadoEm: timestamp("criadoEm").defaultNow().notNull(),
}, (t) => [unique("uq_resposta").on(t.sessaoId, t.atributoId, t.amostraId)]);
// ─── Convites ──────────────────────────────────────────────────────────────
export const convites = pgTable("convites", {
    id: serial("id").primaryKey(),
    codigo: varchar("codigo", { length: 32 }).notNull().unique(),
    email: varchar("email", { length: 320 }),
    criadoPor: integer("criadoPor").notNull(),
    usado: boolean("usado").default(false).notNull(),
    usadoPor: integer("usadoPor"),
    usadoEm: timestamp("usadoEm"),
    expiradoEm: timestamp("expiradoEm"),
    criadoEm: timestamp("criadoEm").defaultNow().notNull(),
});
// Exportação unificada por conveniência
export const schema = {
    users,
    admins,
    experimentos,
    amostras,
    atributos,
    sessoes,
    respostas,
    convites,
};
