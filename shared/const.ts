export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';

// Funções que funcionam tanto no backend quanto no frontend
export function getAppTitle() {
  // Frontend (Vite)
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_TITLE) {
    return import.meta.env.VITE_APP_TITLE;
  }
  // Backend (Node.js)
  if (typeof process !== 'undefined' && process.env?.VITE_APP_TITLE) {
    return process.env.VITE_APP_TITLE;
  }
  return 'SensoPro';
}

export function getAppLogo() {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_LOGO) {
    return import.meta.env.VITE_APP_LOGO;
  }
  if (typeof process !== 'undefined' && process.env?.VITE_APP_LOGO) {
    return process.env.VITE_APP_LOGO;
  }
  return '';
}

/**
 * Obtém a URL de login - funciona no backend e frontend
 */
export function getLoginUrl(returnPath?: string) {
  // Detectar se está no navegador
  const isBrowser = typeof window !== 'undefined';
  
  // Para backend, retorna URL padrão
  if (!isBrowser) {
    return 'http://localhost:3000';
  }
  
  const origin = window.location.origin;
  const redirectTo = returnPath ? `${origin}${returnPath}` : origin;
  
  // Para desenvolvimento local
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    return redirectTo;
  }
  
  // Configuração do Manus OAuth (apenas no frontend)
  const clientId = import.meta.env?.VITE_APP_ID;
  const oauthServer = import.meta.env?.OAUTH_SERVER_URL || 'https://api.manus.im';
  
  if (clientId) {
    const state = encodeURIComponent(JSON.stringify({ origin, redirectTo }));
    return `${oauthServer}/oauth/authorize?client_id=${clientId}&redirect_uri=${origin}/api/oauth/callback&response_type=code&state=${state}`;
  }
  
  return redirectTo;
}

// Constantes que NÃO podem ser usadas no backend
// Use as funções getAppTitle() e getAppLogo() em vez disso
export const APP_TITLE = 'SensoPro'; // Valor fixo para backend
export const APP_LOGO = ''; // Valor fixo para backend