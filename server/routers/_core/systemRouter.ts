import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { getDb } from '../../db.js';
import { sql } from 'drizzle-orm';

const t = initTRPC.create();
const publicProcedure = t.procedure;
const router = t.router;

export const systemRouter = router({
  // Uma rota simples para checar a saúde do sistema e do banco de dados
  status: publicProcedure.query(async () => {
  try {
    const db = await getDb();

    if (!db) {
      throw new Error("Database não inicializado");
    }

    await db.execute(sql`SELECT 1`);

    return {
      status: "online",
      database: "connected",
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: "online",
      database: "disconnected",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    };
  }
}),

  // Rota de exemplo para retornar a versão do app
  version: publicProcedure.query(() => {
    return { version: "1.0.0" };
  })
});