import 'dotenv/config';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import path from 'path';
import fs from 'fs';

// Carrega o .env.local manualmente
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '../../.env.local'), override: true });

console.log('🔧 Configuração carregada:');
console.log('   DATABASE_URL:', process.env.DATABASE_URL ? '✅ Presente' : '❌ Ausente');
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '✅ Presente' : '❌ Ausente');
console.log('   PORT:', process.env.PORT || 3001);
console.log('   NODE_ENV:', process.env.NODE_ENV || 'development');

import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from '../routers';
import { createContext } from './context';

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Configuração CORS - mais permissiva em produção
const corsOptions = {
  origin: isProduction 
    ? true // Aceita qualquer origem em produção
    : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(cookieParser());
app.use(express.json());

// ✅ Servir arquivos estáticos do frontend
let clientDistPath = path.join(__dirname, '../../client/dist');

// Tenta encontrar o caminho correto do client/dist
const possiblePaths = [
  path.join(__dirname, '../../client/dist'),
  path.join(__dirname, '../..', 'client', 'dist'),
  path.join(process.cwd(), 'client', 'dist'),
];

for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    clientDistPath = p;
    console.log('✅ Encontrado client/dist em:', clientDistPath);
    break;
  }
}

console.log('📂 Servindo frontend de:', clientDistPath);
app.use(express.static(clientDistPath, { 
  maxAge: '1d',
  etag: false 
}));

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

// ✅ SPA Fallback - redireciona rotas não encontradas para index.html
app.use('*', (req, res) => {
  const indexPath = path.join(clientDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.error('❌ index.html não encontrado em:', indexPath);
    res.status(404).json({ error: 'Página não encontrada' });
  }
});

const server = app.listen(PORT, () => {
  console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}/`);
  console.log(`📡 API tRPC: http://localhost:${PORT}/api/trpc`);
  console.log(`🔐 Login admin: http://localhost:3000/admin/login\n`);
  console.log(`📋 CORS configurado com credentials: true`);
  console.log(`📋 Ambiente: ${isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}`);
});

process.on('SIGTERM', () => {
  console.log('🛑 Recebido SIGTERM, fechando servidor...');
  server.close(() => {
    console.log('✅ Servidor fechado');
    process.exit(0);
  });
});
