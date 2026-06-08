// server/_core/oauth.ts
// Arquivo mantido para compatibilidade, mas OAuth está desabilitado

export const oauth = {
  isConfigured: false,
  getAuthorizationUrl: () => {
    console.warn("⚠️ OAuth não está configurado - usando autenticação local");
    return "/admin/login";
  },
  handleCallback: async () => {
    throw new Error("OAuth não está configurado. Use autenticação local.");
  },
  exchangeCodeForSession: async (code: string) => {
    throw new Error("OAuth não está configurado. Use autenticação local.");
  }
};