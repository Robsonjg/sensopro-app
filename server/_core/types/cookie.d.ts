import { CookieOptions } from "express";
import { IncomingMessage } from "http";

export function getSessionCookieOptions(req: IncomingMessage): CookieOptions {
  const isProduction = process.env.NODE_ENV === "production";
  const isHttps = req.headers["x-forwarded-proto"] === "https" || req.headers["x-forwarded-proto"] === "https";
  
  return {
    httpOnly: true,
    secure: isProduction && isHttps,
    sameSite: "lax",
    path: "/",
    maxAge: 2592000000, // 30 days
  };
}