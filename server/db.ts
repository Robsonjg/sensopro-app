import 'dotenv/config';
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, desc, sql } from "drizzle-orm";

import {
  Admin,
  Amostra,
  Atributo,
  Convite,
  Experimento,
  InsertAdmin,
  InsertAmostra,
  InsertAtributo,
  InsertConvite,
  InsertExperimento,
  InsertResposta,
  InsertSessao,
  InsertUser,
  Resposta,
  Sessao,
  admins,
  amostras,
  atributos,
  convites,
  experimentos,
  respostas,
  sessoes,
  users,
} from "../drizzle/schema.js";

import { ENV } from "./_core/env.js";

let _db: ReturnType<typeof drizzle> | null = null;
let _client: postgres.Sql | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      console.log("📡 Conectando ao Supabase...");
      _client = postgres(process.env.DATABASE_URL, {
        ssl: { rejectUnauthorized: false }
      });
      _db = drizzle(_client);
      console.log("✅ Conectado ao Supabase!");
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
      _client = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db
    .insert(users)
    .values(values)
    .onConflictDoUpdate({ target: users.openId, set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).orderBy(users.createdAt);
}

export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ─── Experimentos ─────────────────────────────────────────────────────────────
export async function listExperimentos(adminId?: number): Promise<Experimento[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(experimentos).orderBy(desc(experimentos.criadoEm));
}

export async function getExperimentoById(id: number): Promise<Experimento | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(experimentos).where(eq(experimentos.id, id)).limit(1);
  return result[0];
}

export async function getExperimentoBySlug(slug: string): Promise<Experimento | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(experimentos).where(eq(experimentos.slug, slug)).limit(1);
  return result[0];
}

export async function createExperimento(data: InsertExperimento): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const result = await db.insert(experimentos).values(data).returning({ id: experimentos.id });
  return result[0]?.id || 0;
}

export async function updateExperimento(
  id: number,
  data: Partial<Omit<Experimento, "id" | "criadoEm">>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(experimentos)
    .set({ ...data, atualizadoEm: new Date() })
    .where(eq(experimentos.id, id));
}

export async function deleteExperimento(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(experimentos).where(eq(experimentos.id, id));
}

export async function ativarExperimento(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const exp = await getExperimentoById(id);
  if (exp) {
    await db.update(experimentos).set({ ativo: false }).where(eq(experimentos.adminId, exp.adminId));
  }
  await db.update(experimentos).set({ ativo: true }).where(eq(experimentos.id, id));
}

export async function desativarExperimento(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(experimentos).set({ ativo: false }).where(eq(experimentos.id, id));
}

// ─── Amostras ─────────────────────────────────────────────────────────────────
export async function listAmostras(experimentoId: number): Promise<Amostra[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(amostras)
    .where(eq(amostras.experimentoId, experimentoId))
    .orderBy(amostras.ordem);
}

export async function createAmostra(data: InsertAmostra): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const result = await db.insert(amostras).values(data).returning({ id: amostras.id });
  return result[0]?.id || 0;
}

export async function updateAmostra(id: number, data: Partial<Omit<Amostra, "id" | "criadoEm">>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(amostras).set(data).where(eq(amostras.id, id));
}

export async function deleteAmostra(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(amostras).where(eq(amostras.id, id));
}

// ─── Atributos ────────────────────────────────────────────────────────────────
export async function listAtributos(experimentoId: number): Promise<Atributo[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(atributos)
    .where(eq(atributos.experimentoId, experimentoId))
    .orderBy(atributos.ordem);
}

export async function createAtributo(data: InsertAtributo): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const result = await db.insert(atributos).values(data).returning({ id: atributos.id });
  return result[0]?.id || 0;
}

export async function updateAtributo(id: number, data: Partial<Omit<Atributo, "id" | "criadoEm">>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(atributos).set(data).where(eq(atributos.id, id));
}

export async function deleteAtributo(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(atributos).where(eq(atributos.id, id));
}

// ─── Sessões ──────────────────────────────────────────────────────────────────
export async function createSessao(data: InsertSessao): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const result = await db.insert(sessoes).values(data).returning({ id: sessoes.id });
  return result[0]?.id || 0;
}

export async function getSessaoExistente(experimentoId: number): Promise<Sessao | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(sessoes)
    .where(and(eq(sessoes.experimentoId, experimentoId), eq(sessoes.finalizado, false)))
    .limit(1);
  return result[0];
}

export async function finalizarSessao(
  sessaoId: number,
  tempoTotal: number,
  finalizadoEm?: Date
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  console.log("📝 Atualizando sessão:", sessaoId, "Tempo:", tempoTotal);
  await db
    .update(sessoes)
    .set({ finalizado: true, tempoTotal, finalizadoEm: finalizadoEm || new Date() })
    .where(eq(sessoes.id, sessaoId));
  console.log("✅ Sessão finalizada com sucesso!");
}

// ─── Respostas ────────────────────────────────────────────────────────────────
export async function upsertResposta(data: InsertResposta): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(respostas)
    .values(data)
    .onConflictDoUpdate({
      target: [respostas.sessaoId, respostas.atributoId, respostas.amostraId],
      set: { valor: data.valor },
    });
}

export async function listRespostasBySessao(sessaoId: number): Promise<Resposta[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(respostas).where(eq(respostas.sessaoId, sessaoId));
}

export async function getRespostasCompletas(experimentoId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      sessaoId: sessoes.id,
      idade: sessoes.idade,
      cidade: sessoes.cidade,
      estado: sessoes.estado,
      pais: sessoes.pais,
      tempoTotal: sessoes.tempoTotal,
      atributoNome: atributos.nome,
      amostraNome: amostras.nome,
      valor: respostas.valor,
    })
    .from(sessoes)
    .innerJoin(respostas, eq(respostas.sessaoId, sessoes.id))
    .innerJoin(atributos, eq(atributos.id, respostas.atributoId))
    .innerJoin(amostras, eq(amostras.id, respostas.amostraId))
    .where(eq(sessoes.experimentoId, experimentoId));
}

export async function getDashboardData(experimentoId: number) {
  const db = await getDb();
  if (!db) {
    console.error("❌ Database not connected");
    return { totalSessoes: 0, sessoesConcluidas: 0, tempoMedio: 0 };
  }

  try {
    // Buscar total de sessões
    const totalResult = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM sessoes 
      WHERE "experimentoId" = ${experimentoId}
    `);
    
    // Buscar sessões concluídas
    const concluidasResult = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM sessoes 
      WHERE "experimentoId" = ${experimentoId} 
      AND finalizado = true
    `);
    
    // Buscar tempo médio
    const tempoResult = await db.execute(sql`
      SELECT AVG("tempoTotal") as avg 
      FROM sessoes 
      WHERE "experimentoId" = ${experimentoId}
    `);

    const totalSessoes = Number(totalResult[0]?.count) || 0;
    const sessoesConcluidas = Number(concluidasResult[0]?.count) || 0;
    const tempoMedio = Number(tempoResult[0]?.avg) || 0;

    console.log("📊 Dashboard DB - Resultados:", { totalSessoes, sessoesConcluidas, tempoMedio });

    return {
      totalSessoes,
      sessoesConcluidas,
      tempoMedio
    };
  } catch (error) {
    console.error("❌ Erro em getDashboardData:", error);
    return { totalSessoes: 0, sessoesConcluidas: 0, tempoMedio: 0 };
  }
}

// ─── Admins ───────────────────────────────────────────────────────────────────
export async function createAdmin(data: InsertAdmin): Promise<Admin> {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const result = await db.insert(admins).values(data).returning();
  return result[0];
}

export async function getAdminByEmail(email: string): Promise<Admin | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
  return result[0];
}

export async function getAdminById(id: number): Promise<Admin | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(admins).where(eq(admins.id, id)).limit(1);
  return result[0];
}

export async function listAdmins(): Promise<Admin[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(admins).orderBy(admins.criadoEm);
}

export async function updateAdmin(id: number, data: Partial<Omit<Admin, "id" | "criadoEm">>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(admins)
    .set({ ...data, atualizadoEm: new Date() })
    .where(eq(admins.id, id));
}

export async function promoteAdminByEmail(email: string): Promise<Admin | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .update(admins)
    .set({ ativo: true, atualizadoEm: new Date() })
    .where(eq(admins.email, email))
    .returning();
  return result[0];
}

export async function deactivateAdminByEmail(email: string): Promise<Admin | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .update(admins)
    .set({ ativo: false, atualizadoEm: new Date() })
    .where(eq(admins.email, email))
    .returning();
  return result[0];
}

// ─── Convites ─────────────────────────────────────────────────────────────────
export async function createConvite(data: InsertConvite): Promise<Convite> {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const result = await db.insert(convites).values(data).returning();
  return result[0];
}

export async function getConviteByCode(codigo: string): Promise<Convite | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(convites).where(eq(convites.codigo, codigo)).limit(1);
  return result[0];
}

export async function listConvites(criadoPor: number): Promise<Convite[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(convites).where(eq(convites.criadoPor, criadoPor)).orderBy(desc(convites.criadoEm));
}

export async function acceptConvite(codigo: string, adminId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(convites)
    .set({ usado: true, usadoPor: adminId, usadoEm: new Date() })
    .where(eq(convites.codigo, codigo));
}