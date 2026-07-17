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
  serial,
} from "drizzle-orm/pg-core";

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

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Admins ──────────────────────────────────────────────────────────────────
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  senha_hash: text("senha_hash").notNull(),
  nome: varchar("nome", { length: 255 }),
  ativo: boolean("ativo").default(true).notNull(),
  criado_em: timestamp("criado_em").defaultNow().notNull(),
  atualizado_em: timestamp("atualizado_em").defaultNow().notNull(),
});

export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = typeof admins.$inferInsert;

// ─── Experimentos ────────────────────────────────────────────────────────────
export const experimentos = pgTable("experimentos", {
  id: serial("id").primaryKey(),
  admin_id: integer("admin_id").notNull(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  descricao: text("descricao"),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  ativo: boolean("ativo").default(false).notNull(),
  criado_por: integer("criado_por").notNull(),
  criado_em: timestamp("criado_em").defaultNow().notNull(),
  atualizado_em: timestamp("atualizado_em").defaultNow().notNull(),
});

export type Experimento = typeof experimentos.$inferSelect;
export type InsertExperimento = typeof experimentos.$inferInsert;

// ─── Amostras ────────────────────────────────────────────────────────────────
export const amostras = pgTable("amostras", {
  id: serial("id").primaryKey(),
  experimento_id: integer("experimento_id").notNull(),
  codigo: varchar("codigo", { length: 64 }).notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  ordem: integer("ordem").default(0).notNull(),
  criado_em: timestamp("criado_em").defaultNow().notNull(),
});

export type Amostra = typeof amostras.$inferSelect;
export type InsertAmostra = typeof amostras.$inferInsert;

// ─── Atributos ───────────────────────────────────────────────────────────────
export const atributos = pgTable("atributos", {
  id: serial("id").primaryKey(),
  experimento_id: integer("experimento_id").notNull(),
  nome: varchar("nome", { length: 128 }).notNull(),
  descricao: text("descricao"),
  label_min: varchar("label_min", { length: 64 }).default("Muito Baixo"),
  label_max: varchar("label_max", { length: 64 }).default("Muito Alto"),
  ordem: integer("ordem").default(0).notNull(),
  criado_em: timestamp("criado_em").defaultNow().notNull(),
});

export type Atributo = typeof atributos.$inferSelect;
export type InsertAtributo = typeof atributos.$inferInsert;

// ─── Sessões ─────────────────────────────────────────────────────────────────
export const sessoes = pgTable("sessoes", {
  id: serial("id").primaryKey(),
  admin_id: integer("admin_id").notNull(),
  experimento_id: integer("experimento_id").notNull(),
  nome: varchar("nome", { length: 255 }),
  idade: integer("idade"),
  cidade: varchar("cidade", { length: 128 }),
  estado: varchar("estado", { length: 64 }),
  pais: varchar("pais", { length: 128 }),
  finalizado: boolean("finalizado").default(false).notNull(),
  tempo_total: integer("tempo_total"),
  finalizado_em: timestamp("finalizado_em"),
  criado_em: timestamp("criado_em").defaultNow().notNull(),
});

export type Sessao = typeof sessoes.$inferSelect;
export type InsertSessao = typeof sessoes.$inferInsert;

// ─── Respostas ───────────────────────────────────────────────────────────────
export const respostas = pgTable(
  "respostas",
  {
    id: serial("id").primaryKey(),
    sessao_id: integer("sessao_id").notNull(),
    atributo_id: integer("atributo_id").notNull(),
    amostra_id: integer("amostra_id").notNull(),
    valor: real("valor").notNull(),
    criado_em: timestamp("criado_em").defaultNow().notNull(),
  },
  (t) => [unique("uq_resposta").on(t.sessao_id, t.atributo_id, t.amostra_id)]
);

export type Resposta = typeof respostas.$inferSelect;
export type InsertResposta = typeof respostas.$inferInsert;

// ─── Convites ──────────────────────────────────────────────────────────────
export const convites = pgTable("convites", {
  id: serial("id").primaryKey(),
  codigo: varchar("codigo", { length: 32 }).notNull().unique(),
  email: varchar("email", { length: 320 }),
  criado_por: integer("criado_por").notNull(),
  usado: boolean("usado").default(false).notNull(),
  usadoPor: integer("usadoPor"),
  usado_em: timestamp("usado_em"),
  expiradoEm: timestamp("expiradoEm"),
  criado_em: timestamp("criado_em").defaultNow().notNull(),
});

export type Convite = typeof convites.$inferSelect;
export type InsertConvite = typeof convites.$inferInsert;

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
