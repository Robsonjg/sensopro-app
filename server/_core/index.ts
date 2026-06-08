import 'dotenv/config';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const localEnvPath = join(__dirname, '../../.env.local');

// SÓ carrega o arquivo .env.local se ele existir fisicamente (ambiente local)
if (fs.existsSync(localEnvPath)) {
  config({ path: localEnvPath, override: true });
}

console.log('🔧 Configuração carregada:');
console.log('   DATABASE_URL:', process.env.DATABASE_URL ? '✅ Presente' : '❌ Ausente');
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '✅ Presente' : '❌ Ausente');
console.log('   PORT:', process.env.PORT || 3001);
console.log('   NODE_ENV:', process.env.NODE_ENV || 'development');

import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from '../routers.js';
import { createContext } from './context.js';

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// URLs permitidas no CORS
const allowedOrigins: string[] = isProduction 
  ? [
      'https://sensopro-app.vercel.app',
      'https://sensopro-app-git-main.vercel.app',
      'https://sensopro.vercel.app'
    ]
  : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'];

const corsOptions: cors.CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Permitir requisições sem origem (como ferramentas de teste ou mobile)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || !isProduction) {
      callback(null, true);
    } else {
      console.warn('❌ CORS bloqueado para origem:', origin);
      callback(new Error('CORS bloqueado'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
};

app.use(cors(corsOptions));

// 🟢 CORREÇÃO 1: Removido o '*' para aplicar OPTIONS globalmente de forma compatível
app.options(/^(.*)$/, cors(corsOptions));

app.use(cookieParser());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Configuração do tRPC API
app.use('/api/trpc', createExpressMiddleware({
  router: appRouter,
  createContext,
  onError: ({ error, type, path }) => {
    console.error(`❌ tRPC Error on ${type} "${path}":`, error.message);
  },
}));

// 🟢 CORREÇÃO 2: Removido o '*' do 404. Deixar sem rota faz o Express pegar qualquer sobra automaticamente
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado' });
});

const server = app.listen(PORT, () => {
  console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}/`);
  console.log(`📡 API tRPC: http://localhost:${PORT}/api/trpc`);
  console.log(`📋 Ambiente: ${isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}`);
  console.log(`🔗 CORS permitido para: ${allowedOrigins.join(', ')}`);
});

process.on('SIGTERM', () => {
  console.log('🛑 Encerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor encerrado');
    process.exit(0);
  });
});