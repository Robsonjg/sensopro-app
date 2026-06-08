# 🚀 Guia de Deployment - Sensopro App

## Estrutura do Projeto

```
sensopro-app/
├── client/              # Frontend (React + Vite)
│   ├── src/
│   ├── dist/           # Build output
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── server/              # Backend (Express + tRPC)
│   ├── _core/
│   ├── dist/           # Build output
│   ├── package.json
│   ├── drizzle.config.ts
│   ├── railway.toml
│   └── .env.example
├── shared/              # Types compartilhadas
├── drizzle/             # Migrations do banco
├── package.json         # Root (workspaces)
└── vercel.json         # Vercel config
```

---

## 🚀 Deploy no Railway (Backend)

### 1. Criar Projeto no Railway
1. Acesse https://railway.app
2. Clique em **"Create New"** → **"Project"**
3. **"Deploy from GitHub repo"**
4. Selecione `sensopro-app`

### 2. Criar PostgreSQL
1. **"+ Create"** → **"Database"** → **"Postgres"**
2. Railway adiciona `DATABASE_URL` automaticamente

### 3. Adicionar Variáveis de Ambiente
Em **Variables**, adicione:
```
DATABASE_URL=postgresql://...(gerada automaticamente)
JWT_SECRET=sua_secret_super_secreta_aqui_12345
NODE_ENV=production
```

### 4. Fazer Deploy
- Railway detecta `railway.toml` na raiz
- Faz build e deploy automaticamente
- URL resultante: `https://sensopro-app-production.up.railway.app`

---

## 🔗 Deploy no Vercel (Frontend)

### 1. Conectar ao Vercel
1. Acesse https://vercel.com
2. **"Import Project"** → GitHub → `sensopro-app`
3. Vercel detecta `vercel.json`

### 2. Adicionar Environment Variable
Em **Settings** → **Environment Variables**:
```
VITE_API_URL=https://sensopro-app-production.up.railway.app/api/trpc
```

### 3. Deploy
- Clique **"Redeploy"** ou faça `git push`
- Vercel faz build do client automaticamente
- URL: `https://sensopro-app.vercel.app`

---

## 🛠️ Desenvolvimento Local

### Primeiro uso:
```bash
# Copiar .env.example para .env.local
cp .env.example .env.local

# Editar .env.local com suas credenciais
nano .env.local

# Instalar dependências
npm install
```

### Rodar tudo:
```bash
# Terminal 1: Backend (porta 3001)
npm run dev

# Terminal 2: Frontend (porta 3000/5173)
npm run dev:client
```

### Apenas builds:
```bash
npm run build          # Client + Server
npm run build:client   # Só client
npm run build:server   # Só server
```

---

## 📝 Variáveis Importantes

### Backend (.env.local)
```
DATABASE_URL=postgresql://user:pass@localhost:5432/sensopro
JWT_SECRET=qualquer_string_secreta
NODE_ENV=development
PORT=3001
```

### Frontend (Vercel - Environment Variables)
```
VITE_API_URL=https://sensopro-backend.onrender.com/api/trpc
```

---

## 🔄 Fluxo de Deploy

1. Fazer mudanças localmente
2. Testar com `npm run dev`
3. Fazer commit e push:
   ```bash
   git add .
   git commit -m "feat: descrição da mudança"
   git push origin main
   ```
4. **Railway** detecta mudanças → faz deploy automático
5. **Vercel** detecta mudanças → faz deploy automático

---

## ✅ Checklist Final

- [ ] Railway criado
- [ ] PostgreSQL criado no Railway
- [ ] DATABASE_URL adicionada
- [ ] JWT_SECRET adicionada
- [ ] Backend deployado com sucesso
- [ ] Vercel conectado
- [ ] VITE_API_URL configurada
- [ ] Frontend deployado com sucesso
- [ ] Testar login em produção

---

## 📞 Troubleshooting

### Build falha no Railway
```
Erro: "Cannot find module..."
→ Verifique se package.json está em server/
→ Verifique se railway.toml aponta para "npm --prefix server run start"
```

### CORS error no frontend
```
Erro: "Access to XMLHttpRequest blocked by CORS"
→ Verifique VITE_API_URL está correto
→ Verifique backend tem CORS habilitado
```

### Banco não conecta
```
Erro: "Cannot connect to database"
→ Copie DATABASE_URL de Railway variables
→ Adicione em Railway environment variables
```
