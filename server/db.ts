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
} from "../drizzle/schema.js"; // Mantido .js pois o Node/TS em ESM exige a extensão de saída, mas a remoção do arquivo duplicado local garante que ele leia o build novo.

import { ENV } from "./_core/env.js";

let _db: ReturnType<typeof drizzle> | null = null;
let _client: postgres.Sql | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      console.log("📡 Conectando ao Supabase via Pooler...");
      
      // CORREÇÃO CRUCIAL: Adicionado prepare: false para ser aceito pelo Transaction Pooler (6543)
      _client = postgres(process.env.DATABASE_URL, {
        ssl: { rejectUnauthorized: false },
        prepare: false
      });
      
      _db = drizzle(_client);
      console.log("✅ Conectado ao Supabase com sucesso!");
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
export async function listExperimentos(admin_id?: number): Promise<Experimento[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(experimentos).orderBy(desc(experimentos.criado_em));
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
  data: Partial<Omit<Experimento, "id" | "criado_em">>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(experimentos)
    .set({ ...data, atualizado_em: new Date() })
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

  await db
    .update(experimentos)
    .set({ ativo: true })
    .where(eq(experimentos.id, id));
}

export async function desativarExperimento(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(experimentos).set({ ativo: false }).where(eq(experimentos.id, id));
}

// ─── Amostras ─────────────────────────────────────────────────────────────────
export async function listAmostras(experimento_id: number): Promise<Amostra[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(amostras)
    .where(eq(amostras.experimento_id, experimento_id))
    .orderBy(amostras.ordem);
}
export async function getAmostraByCodigo(
  experimento_id: number,
  codigo: string
): Promise<Amostra | undefined> {
  const db = await getDb();

  if (!db) {
    return undefined;
  }

  const codigoNormalizado = codigo.trim();

  const result = await db
    .select()
    .from(amostras)
    .where(
      and(
        eq(amostras.experimento_id, experimento_id),
        eq(amostras.codigo, codigoNormalizado)
      )
    )
    .limit(1);

  return result[0];
}

export async function createAmostra(data: InsertAmostra): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const result = await db.insert(amostras).values(data).returning({ id: amostras.id });
  return result[0]?.id || 0;
}

export async function updateAmostra(id: number, data: Partial<Omit<Amostra, "id" | "criado_em">>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(amostras).set(data).where(eq(amostras.id, id));
}

export async function deleteAmostra(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(amostras).where(eq(amostras.id, id));
}

export async function getAmostraByCodigoGlobal(codigo: string) {
  const db = await getDb();
  if (!db) return undefined;

  const codigoNormalizado = codigo.trim();

  const result = await db
    .select({
      id: amostras.id,
      experimento_id: amostras.experimento_id,
      codigo: amostras.codigo,
      nome: amostras.nome,
      descricao: amostras.descricao,
      ordem: amostras.ordem,
      criado_em: amostras.criado_em,
    })
    .from(amostras)
    .where(eq(amostras.codigo, codigoNormalizado))
    .limit(1);

  return result[0];
}
// ─── Atributos ────────────────────────────────────────────────────────────────
export async function listAtributos(experimento_id: number): Promise<Atributo[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(atributos)
    .where(eq(atributos.experimento_id, experimento_id))
    .orderBy(atributos.ordem);
}

export async function createAtributo(data: InsertAtributo): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const result = await db.insert(atributos).values(data).returning({ id: atributos.id });
  return result[0]?.id || 0;
}

export async function updateAtributo(id: number, data: Partial<Omit<Atributo, "id" | "criado_em">>): Promise<void> {
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

export async function getSessaoExistente(experimento_id: number): Promise<Sessao | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(sessoes)
    .where(and(eq(sessoes.experimento_id, experimento_id), eq(sessoes.finalizado, false)))
    .limit(1);
  return result[0];
}

export async function finalizarSessao(
  sessao_id: number,
  tempo_total: number,
  finalizado_em?: Date
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  console.log("📝 Atualizando sessão:", sessao_id, "Tempo:", tempo_total);
  await db
    .update(sessoes)
    .set({ finalizado: true, tempo_total, finalizado_em: finalizado_em || new Date() })
    .where(eq(sessoes.id, sessao_id));
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
      target: [respostas.sessao_id, respostas.atributo_id, respostas.amostra_id],
      set: { valor: data.valor },
    });
}

export async function listRespostasBySessao(sessao_id: number): Promise<Resposta[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(respostas).where(eq(respostas.sessao_id, sessao_id));
}

export async function getRespostasCompletas(experimento_id: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
  sessao_id: sessoes.id,
  nome: sessoes.nome,
  idade: sessoes.idade,
  cidade: sessoes.cidade,
  estado: sessoes.estado,
  pais: sessoes.pais,
  tempo_total: sessoes.tempo_total,
  atributoNome: atributos.nome,
  amostraNome: amostras.nome,
  valor: respostas.valor,
})
    .from(sessoes)
    .innerJoin(respostas, eq(respostas.sessao_id, sessoes.id))
    .innerJoin(atributos, eq(atributos.id, respostas.atributo_id))
    .innerJoin(amostras, eq(amostras.id, respostas.amostra_id))
    .where(eq(sessoes.experimento_id, experimento_id));
}

export async function getDashboardData(experimento_id: number) {
  const db = await getDb();
  if (!db) {
    console.error("❌ Database not connected");
    return { totalSessoes: 0, sessoesConcluidas: 0, tempoMedio: 0 };
  }

  try {
    const totalResult = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM sessoes 
      WHERE "experimento_id" = ${experimento_id}
    `);
    
    const concluidasResult = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM sessoes 
      WHERE "experimento_id" = ${experimento_id} 
      AND finalizado = true
    `);
    
    const tempoResult = await db.execute(sql`
      SELECT AVG("tempo_total") as avg 
      FROM sessoes 
      WHERE "experimento_id" = ${experimento_id}
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

export async function getAdminByEmail(email: string) {
  try {
    // 1. Força a obter a instância correta e atualizada do banco
    const currentDb = await getDb();
    
    if (!currentDb) throw new Error("Não foi possível estabelecer ligação com a base de dados.");

    const result = await currentDb
      .select()
      .from(admins)
      .where(eq(admins.email, email))
      .limit(1);

    console.log("Resultado:", result);
    return result[0];
  } catch (err) {
    console.error("ERRO getAdminByEmail:", err);
    throw err;
  }
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
  return db.select().from(admins).orderBy(admins.criado_em);
}

export async function updateAdmin(id: number, data: Partial<Omit<Admin, "id" | "criado_em">>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(admins)
    .set({ ...data, atualizado_em: new Date() })
    .where(eq(admins.id, id));
}

export async function promoteAdminByEmail(email: string): Promise<Admin | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .update(admins)
    .set({ ativo: true, atualizado_em: new Date() })
    .where(eq(admins.email, email))
    .returning();
  return result[0];
}

export async function deactivateAdminByEmail(email: string): Promise<Admin | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .update(admins)
    .set({ ativo: false, atualizado_em: new Date() })
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

export async function listConvites(criado_por: number): Promise<Convite[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(convites).where(eq(convites.criado_por, criado_por)).orderBy(desc(convites.criado_em));
}
export async function listSessoesFinalizadas(experimento_id: number): Promise<Sessao[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(sessoes)
    .where(eq(sessoes.experimento_id, experimento_id)); // 👈 Removido o filtro estrito de finalizado para computar todos os testes feitos
}

export async function acceptConvite(codigo: string, admin_id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(convites)
    .set({ usado: true, usadoPor: admin_id, usado_em: new Date() })
    .where(eq(convites.codigo, codigo));
}
