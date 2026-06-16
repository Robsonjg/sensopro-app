/**
 * Cria o contexto para cada requisição tRPC
 * O middleware emailPasswordAdminProcedure será responsável por
 * ler o cookie e popular admin/adminId
 */
export async function createContext({ req, res }) {
    // Contexto inicial - sem autenticação
    // O middleware vai preencher admin/adminId se houver cookie válido
    return {
        req,
        res,
    };
}
