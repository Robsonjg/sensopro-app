export const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3001/api/trpc";

export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const getLoginUrl = () => "/admin/login";
