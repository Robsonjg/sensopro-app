import 'dotenv/config';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Carrega o .env.local manualmente
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '../../.env.local'), override: true });

console.log('🔧 Configuração carregada:');
console.log('   DATABASE_URL:', process.env.DATABASE_URL ? '✅ Presente' : '❌ Ausente');
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '✅ Presente' : '❌ Ausente');
console.log('   PORT:', process.env.PORT || 3001);

import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from '../routers';
import { createContext } from './context';

const app = express();
const PORT = process.env.PORT || 3001;

// Configuração CORS correta - ACEITANDO CREDENCIAIS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'],
  credentials: true,  // ← CRÍTICO: permite envio de cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
}));

// Middleware para OPTIONS (pre-flight)
app.options('*', cors());

app.use(cookieParser());
app.use(express.json());

// Rota de health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// tRPC middleware
app.use('/api/trpc', createExpressMiddleware({
  router: appRouter,
  createContext,
  onError: ({ error, type, path }) => {
    console.error(`❌ tRPC Error on ${type} "${path}":`, error.message);
  },
}));

// Rota de fallback
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

const server = app.listen(PORT, () => {
  console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}/`);
  console.log(`📡 API tRPC: http://localhost:${PORT}/api/trpc`);
  console.log(`🔐 Login admin: http://localhost:3000/admin/login\n`);
  console.log(`📋 CORS configurado com credentials: true`);
});

process.on('SIGTERM', () => {
  console.log('🛑 Recebido SIGTERM, fechando servidor...');
  server.close(() => {
    console.log('✅ Servidor fechado');
    process.exit(0);
  });
});