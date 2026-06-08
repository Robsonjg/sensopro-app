import { NOT_ADMIN_ERR_MSG } from '../../shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import type { TrpcContext, AdminContext } from "./context";
import { getAdminById } from "../db";

// Removemos o bloco do transformer: superjson daqui
const t = initTRPC.context<TrpcContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware para autenticação de admin via cookie
export const emailPasswordAdminProcedure = t.procedure.use(
  t.middleware(async ({ ctx, next }) => {
    console.log("🔐 Middleware - Verificando autenticação...");
    
    let adminId: number | undefined;
    
    try {
      const cookieHeader = ctx.req.headers.cookie;
      console.log("📝 Cookie header recebido:", cookieHeader ? "Sim" : "Não");
      
      if (cookieHeader) {
        // Decodificar o cookie corretamente
        const cookies = cookieHeader.split("; ");
        for (const cookie of cookies) {
          if (cookie.startsWith("admin_session=")) {
            const cookieValue = cookie.substring("admin_session=".length);
            const decodedValue = decodeURIComponent(cookieValue);
            const sessionData = JSON.parse(decodedValue);
            adminId = sessionData.adminId;
            console.log("✅ Admin ID encontrado no cookie:", adminId);
            break;
          }
        }
      }
    } catch (error) {
      console.error("❌ Erro ao parsear cookie:", error);
    }
    
    if (!adminId) {
      console.log("❌ Não autenticado - adminId não encontrado");
      throw new TRPCError({ code: "FORBIDDEN", message: "Não autenticado" });
    }
    
    const adminData = await getAdminById(adminId);
    if (!adminData) {
      console.log("❌ Admin não encontrado no banco para ID:", adminId);
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin não encontrado" });
    }
    
    if (!adminData.ativo) {
      console.log("❌ Admin desativado:", adminData.email);
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin desativado" });
    }
    
    const admin: AdminContext = {
      id: adminData.id,
      email: adminData.email,
      nome: adminData.nome,
      ativo: adminData.ativo
    };
    
    console.log("✅ Autenticado como:", admin.email);
    
    return next({
      ctx: {
        ...ctx,
        adminId: admin.id,
        admin: admin
      }
    });
  })
);

export const adminProcedure = emailPasswordAdminProcedure;
export const protectedProcedure = emailPasswordAdminProcedure;