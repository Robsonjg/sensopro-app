# Diagnóstico e Guia de Deploy - SensoPro

## 1. Diagnóstico: Por que o frontend não estava aparecendo?

Após analisar a estrutura do projeto, identifiquei os motivos pelos quais o frontend não estava sendo renderizado (ficando com a tela em branco), tanto localmente quanto no Vercel:

1.  **Ponto de Entrada (Entrypoint) Incompleto:** O arquivo `client/src/main.tsx`, que é o ponto de entrada principal da aplicação React, estava praticamente vazio (continha apenas um `.`). Ele não estava renderizando o componente principal (`App`) na div `root` do `index.html`.
2.  **Falta de Roteamento (App.tsx):** Não existia um arquivo `App.tsx` para gerenciar as rotas da aplicação (usando o `wouter`, que está nas dependências). Sem ele, o React não sabia qual página exibir (HomePage, AdminPage, etc.) com base na URL.
3.  **Configuração do tRPC Ausente:** O arquivo `client/src/lib/trpc.ts` também estava vazio. Ele é essencial para conectar o frontend ao backend. Sem ele, qualquer componente que tentasse usar o `trpc` (como o `useAuth`) falharia silenciosamente ou causaria um erro fatal na renderização.
4.  **Localização Incorreta de Arquivos de Configuração:**
    *   O arquivo `index.html` estava dentro de `client/src/`, mas o Vite (por padrão) espera que ele esteja na raiz do projeto frontend (`client/`).
    *   O arquivo `vite.config.ts` também estava dentro de `client/src/`, o que impedia o Vite de encontrá-lo ao rodar os scripts na pasta `client`.
    *   O arquivo `vercel.json` estava dentro de `client/src/`, o que fazia com que o Vercel não o lesse corretamente para configurar o roteamento do SPA (Single Page Application).
5.  **Conflito de `package.json`:** Havia um `package.json` extra dentro de `client/src/`, o que poderia causar confusão na resolução de dependências e scripts.

## 2. O que foi corrigido (Pronto para uso)

Já realizei as seguintes correções no seu projeto localmente, sem alterar nenhum layout:

*   **Criação do `App.tsx`:** Criei o arquivo `client/src/App.tsx` configurando as rotas principais (`/`, `/admin/login`, `/admin`, `/avaliacao/:slug`) usando o `wouter` e envolvendo a aplicação com os provedores do `tRPC` e `React Query`.
*   **Atualização do `main.tsx`:** Preenchi o `client/src/main.tsx` com o código padrão do React 18 para renderizar o componente `App` dentro da div `root`.
*   **Configuração do `trpc.ts`:** Configurei o `client/src/lib/trpc.ts` para criar o cliente tRPC, apontando para a URL correta da API (usando a variável de ambiente `VITE_API_URL` em produção ou `localhost` localmente).
*   **Reorganização de Arquivos:**
    *   Movi `index.html` de `client/src/` para `client/`.
    *   Movi `vite.config.ts` de `client/src/` para `client/` e atualizei a configuração para refletir a nova estrutura.
    *   Movi `vercel.json` de `client/src/` para `client/`.
    *   Removi o `package.json` duplicado que estava em `client/src/`.

## 3. Guia de Deploy (Vercel, Render e Supabase)

Com as correções acima, o projeto está estruturalmente pronto. Siga os passos abaixo para colocar tudo no ar.

### 3.1. Banco de Dados (Supabase)

O seu backend já está configurado para usar o Supabase (via `postgres-js` e `drizzle-orm`).

1.  Acesse o [Supabase](https://supabase.com/) e crie um novo projeto.
2.  Vá em **Project Settings -> Database** e copie a **Connection string** (URI).
3.  Certifique-se de que a string termine com `?sslmode=require` ou que o backend esteja configurado para aceitar conexões SSL (o que já está feito no seu `db.ts`).
4.  Guarde essa URL, você a usará no Render.

### 3.2. Backend (Render)

O Render é uma excelente alternativa ao Railway para hospedar o backend Node.js (Express).

1.  Crie uma conta no [Render](https://render.com/).
2.  Clique em **New +** e selecione **Web Service**.
3.  Conecte o seu repositório do GitHub.
4.  Na configuração do Web Service:
    *   **Name:** `sensopro-backend` (ou o nome que preferir).
    *   **Root Directory:** `server` (Isso é crucial, pois o backend está na pasta `server`).
    *   **Environment:** `Node`.
    *   **Build Command:** `npm install && npm run build`
    *   **Start Command:** `npm start` (Certifique-se de que o `package.json` do `server` tenha um script `"start": "node dist/_core/index.js"` ou similar após o build. Se não tiver, use `node dist/_core/index.js` diretamente).
5.  Em **Environment Variables**, adicione:
    *   `DATABASE_URL`: A URL de conexão do Supabase.
    *   `JWT_SECRET`: Uma string longa e aleatória (ex: `sua_secret_super_secreta_aqui_12345`).
    *   `NODE_ENV`: `production`.
6.  Clique em **Create Web Service**.
7.  Após o deploy, copie a URL gerada pelo Render (ex: `https://sensopro-backend.onrender.com`).

### 3.3. Frontend (Vercel)

1.  Faça o commit e push de todas as alterações que fiz localmente para o seu repositório no GitHub.
2.  Acesse o [Vercel](https://vercel.com/) e clique em **Add New... -> Project**.
3.  Importe o repositório do SensoPro.
4.  Na configuração do projeto:
    *   **Framework Preset:** `Vite`.
    *   **Root Directory:** `client` (Crucial, pois o frontend está na pasta `client`).
    *   **Build Command:** `npm run build` (O Vercel deve detectar automaticamente).
    *   **Output Directory:** `dist` (O Vercel deve detectar automaticamente).
5.  Em **Environment Variables**, adicione:
    *   `VITE_API_URL`: A URL do seu backend no Render seguida de `/api/trpc` (ex: `https://sensopro-backend.onrender.com`).
6.  Clique em **Deploy**.

### 3.4. Ajuste Final de CORS (Importante)

Após ter a URL final do Vercel (ex: `https://sensopro-app.vercel.app`) e do seu domínio personalizado, você precisa atualizar o backend para permitir requisições dessas origens.

No arquivo `server/_core/index.ts`, atualize a lista `allowedOrigins`:

```typescript
const allowedOrigins: string[] = isProduction 
  ? [
      'https://sensopro-app.vercel.app', // URL padrão do Vercel
      'https://seu-dominio-comprado.com.br', // Seu domínio personalizado
      'https://www.seu-dominio-comprado.com.br'
    ]
  : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'];
```

Faça o commit dessa alteração e o Render fará o deploy automático da nova versão do backend.

### 3.5. Usando seu Domínio Personalizado

1.  No Vercel, vá nas configurações do seu projeto frontend.
2.  Acesse a aba **Domains**.
3.  Adicione o domínio que você comprou (ex: `sensopro.com.br`).
4.  O Vercel fornecerá as instruções de DNS (geralmente um registro A apontando para um IP ou um CNAME apontando para `cname.vercel-dns.com`).
5.  Vá no painel da empresa onde você comprou o domínio (Registro.br, GoDaddy, Hostinger, etc.) e configure os registros DNS conforme instruído pelo Vercel.
6.  Aguarde a propagação (pode levar algumas horas) e seu site estará acessível pelo seu domínio.
