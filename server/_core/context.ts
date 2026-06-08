import { inferAsyncReturnType } from "@trpc/server";
import { CreateExpressContextOptions } from "@trpc/server/adapters/express";

// Tipo simplificado para o admin no contexto
export type AdminContext = {
  id: number;
  email: string;
  nome: string | null;
  ativo: boolean;
};

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  adminId?: number;
  admin?: AdminContext | null;
};

/**
 * Cria o contexto para cada requisição tRPC
 * O middleware emailPasswordAdminProcedure será responsável por
 * ler o cookie e popular admin/adminId
 */
export async function createContext({ req, res }: CreateExpressContextOptions): Promise<TrpcContext> {
  // Contexto inicial - sem autenticação
  // O middleware vai preencher admin/adminId se houver cookie válido
  return {
    req,
    res,
  };
}