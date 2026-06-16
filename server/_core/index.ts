import 'dotenv/config';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import fs from 'fs';
import path from 'path';

import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from '../routers.js';
import { createContext } from './context.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const localEnvPath = resolve(process.cwd(), '../.env.local');

if (fs.existsSync(localEnvPath)) {
  config({ path: localEnvPath, override: true });
}

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';
let httpServer: ReturnType<typeof app.listen> | undefined;

const envOrigins = [
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
].filter(Boolean) as string[];

const allowedOrigins: string[] = isProduction
  ? [
      ...envOrigins,
      'https://sensopro-app.vercel.app',
      'https://sensopro-app-git-main.vercel.app',
      'https://sensopro.vercel.app',
    ]
  : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'];

console.log('Configuracao carregada:');
console.log('   DATABASE_URL:', process.env.DATABASE_URL ? 'presente' : 'ausente');
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? 'presente' : 'ausente');
console.log('   PORT:', PORT);
console.log('   NODE_ENV:', process.env.NODE_ENV || 'development');

const corsOptions: cors.CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || !isProduction) {
      callback(null, true);
    } else {
      console.warn('CORS bloqueado para origem:', origin);
      callback(new Error('CORS bloqueado'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
};

app.use(cors(corsOptions));
app.options(/^(.*)$/, cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/trpc', createExpressMiddleware({
  router: appRouter,
  createContext,
  onError: ({ error, type, path: trpcPath }) => {
    console.error(`tRPC Error on ${type} "${trpcPath}":`, error.message);
  },
}));

// Frontend fica no Vercel. Render roda somente API.
// Em production, não servir/servir fallback do client.
if (isProduction) {
  // noop
} else {
  httpServer = app.listen(PORT);
  logServerReady();
}


app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint nao encontrado' });
});

if (isProduction) {
  httpServer = app.listen(PORT, logServerReady);
}

function logServerReady() {
  console.log(`\nServidor rodando em http://localhost:${PORT}/`);
  console.log(`API tRPC: http://localhost:${PORT}/api/trpc`);
  console.log(`Ambiente: ${isProduction ? 'producao' : 'desenvolvimento'}`);
  console.log(`CORS permitido para: ${allowedOrigins.join(', ')}`);
}

process.on('SIGTERM', () => {
  console.log('Encerrando servidor...');
  httpServer?.close(() => {
    console.log('Servidor encerrado');
    process.exit(0);
  }) ?? process.exit(0);
});
