# 🚀 Setup SensoPro com Supabase

Este guia explica como configurar o SensoPro para funcionar com Supabase PostgreSQL e trabalhar localmente no VS Code.

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Git instalado
- Conta Supabase (https://supabase.com)
- VS Code (ou editor de sua preferência)

## 🔧 Passo 1: Clonar o Projeto

```bash
git clone <seu-repositorio> sensopro
cd sensopro
pnpm install
```

## 🗄️ Passo 2: Criar Banco de Dados no Supabase

1. Acesse https://supabase.com e faça login
2. Crie um novo projeto (ou use um existente)
3. Vá para **SQL Editor** > **New Query**
4. Copie todo o conteúdo do arquivo `SQL_SUPABASE_SETUP.sql`
5. Cole no SQL Editor e execute (clique em "Run")

Aguarde a conclusão. Você verá mensagens de sucesso para cada tabela criada.

## 🔐 Passo 3: Obter Connection String

1. Vá para **Project Settings** > **Database**
2. Procure por **Connection Pooling** (não Connection String simples)
3. Copie a URL que começa com `postgresql://`
4. Substitua `[user]`, `[password]`, `[host]`, `[port]`, `[database]` pelos valores reais

**Exemplo:**
```
postgresql://postgres.abc123:senha123@db.abc123.supabase.co:5432/postgres
```

## 📝 Passo 4: Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Banco de Dados Supabase
DATABASE_URL=postgresql://postgres.abc123:senha123@db.abc123.supabase.co:5432/postgres

# Servidor
NODE_ENV=development
PORT=3000

# JWT Secret (gere um aleatório seguro)
JWT_SECRET=seu_secret_jwt_super_seguro_aqui_minimo_32_caracteres

# App Config
VITE_APP_TITLE=SensoPro
VITE_APP_LOGO=https://seu-logo-url.com/logo.png
```

**Como gerar um JWT_SECRET seguro:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## ▶️ Passo 5: Rodar o Projeto Localmente

```bash
# Instalar dependências
pnpm install

# Rodar em modo desenvolvimento
pnpm dev
```

O servidor estará disponível em `http://localhost:3000`

## 🧪 Passo 6: Testar Autenticação

1. Abra http://localhost:3000/admin/login
2. Clique em "Não tem conta? Registre-se"
3. Crie uma conta com email e senha
4. Faça login
5. Você deve ser redirecionado para o painel admin

## 📱 Estrutura do Projeto

```
sensopro/
├── client/                 # Frontend React
│   └── src/
│       ├── pages/         # Páginas (admin, público)
│       ├── components/    # Componentes reutilizáveis
│       └── lib/           # Utilitários (tRPC, etc)
├── server/                # Backend Express + tRPC
│   ├── db.ts             # Helpers de banco de dados
│   ├── routers.ts        # Rotas tRPC
│   └── _core/            # Configuração (context, auth, etc)
├── drizzle/              # Schema e migrations
│   ├── schema.ts         # Definição das tabelas
│   └── migrations/       # Histórico de mudanças
└── SQL_SUPABASE_SETUP.sql # Script SQL para criar tabelas
```

## 🔄 Fluxo de Desenvolvimento

### 1. Alterar Schema do Banco

Se precisar adicionar/modificar tabelas:

```bash
# 1. Edite drizzle/schema.ts
# 2. Gere a migration
pnpm drizzle-kit generate

# 3. Revise o SQL gerado em drizzle/migrations/
# 4. Execute no Supabase SQL Editor
```

### 2. Adicionar Novas Rotas tRPC

```typescript
// server/routers.ts
export const appRouter = router({
  minhaFeature: router({
    list: adminProcedure.query(async ({ ctx }) => {
      // ctx.adminId e ctx.admin estão disponíveis
      return [];
    }),
  }),
});
```

### 3. Usar no Frontend

```typescript
// client/src/pages/MyPage.tsx
import { trpc } from "@/lib/trpc";

export default function MyPage() {
  const { data } = trpc.minhaFeature.list.useQuery();
  return <div>{/* ... */}</div>;
}
```

## 🛠️ Troubleshooting

### Erro: "Database connection failed"
- Verifique se a `DATABASE_URL` está correta
- Confirme que o Supabase está rodando
- Teste a conexão: `psql <DATABASE_URL>`

### Erro: "Admin not found"
- Verifique se o admin foi criado no banco
- Acesse Supabase > SQL Editor e execute:
  ```sql
  SELECT * FROM admins;
  ```

### Erro: "Port 3000 already in use"
- Mude a porta: `PORT=3001 pnpm dev`
- Ou mate o processo: `lsof -i :3000` e `kill -9 <PID>`

### TypeScript errors
```bash
# Regenere tipos
pnpm drizzle-kit generate
pnpm tsc --noEmit
```

## 📦 Deploy (Opcional)

Para fazer deploy em produção, você pode usar:

- **Vercel** (recomendado para Next.js)
- **Railway** (suporta Node.js + PostgreSQL)
- **Render** (alternativa a Railway)
- **Heroku** (clássico, agora pago)

Todos suportam PostgreSQL do Supabase.

## 🤝 Suporte

Se encontrar problemas:

1. Verifique os logs: `pnpm dev` mostra erros em tempo real
2. Consulte a documentação: https://drizzle.orm.sh
3. Veja os testes: `pnpm test`

## ✅ Checklist de Setup

- [ ] Node.js 18+ instalado
- [ ] Projeto clonado e `pnpm install` executado
- [ ] Supabase criado e tabelas importadas
- [ ] `.env.local` configurado com DATABASE_URL
- [ ] `pnpm dev` rodando sem erros
- [ ] Login funcionando em http://localhost:3000/admin/login
- [ ] Dashboard carregando após login

Pronto! Você está com SensoPro rodando localmente com Supabase! 🎉
