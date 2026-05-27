-- SensoPro - SQL Setup para Supabase PostgreSQL
-- Execute este script no SQL Editor do Supabase para criar todas as tabelas

-- ─── Tabela: admins ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  email VARCHAR(320) NOT NULL UNIQUE,
  "senhaHash" TEXT NOT NULL,
  nome VARCHAR(255),
  ativo BOOLEAN NOT NULL DEFAULT true,
  "criadoEm" TIMESTAMP NOT NULL DEFAULT NOW(),
  "atualizadoEm" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── Tabela: experimentos ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS experimentos (
  id SERIAL PRIMARY KEY,
  "adminId" INTEGER NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  slug VARCHAR(128) NOT NULL UNIQUE,
  ativo BOOLEAN NOT NULL DEFAULT false,
  "criadoPor" INTEGER NOT NULL,
  "criadoEm" TIMESTAMP NOT NULL DEFAULT NOW(),
  "atualizadoEm" TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY ("adminId") REFERENCES admins(id) ON DELETE CASCADE,
  FOREIGN KEY ("criadoPor") REFERENCES admins(id) ON DELETE CASCADE
);

-- ─── Tabela: amostras ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS amostras (
  id SERIAL PRIMARY KEY,
  "experimentoId" INTEGER NOT NULL,
  codigo VARCHAR(64) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  "criadoEm" TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY ("experimentoId") REFERENCES experimentos(id) ON DELETE CASCADE
);

-- ─── Tabela: atributos ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS atributos (
  id SERIAL PRIMARY KEY,
  "experimentoId" INTEGER NOT NULL,
  nome VARCHAR(128) NOT NULL,
  descricao TEXT,
  "labelMin" VARCHAR(64) NOT NULL DEFAULT 'Muito Baixo',
  "labelMax" VARCHAR(64) NOT NULL DEFAULT 'Muito Alto',
  ordem INTEGER NOT NULL DEFAULT 0,
  "criadoEm" TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY ("experimentoId") REFERENCES experimentos(id) ON DELETE CASCADE
);

-- ─── Tabela: sessoes ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessoes (
  id SERIAL PRIMARY KEY,
  "adminId" INTEGER NOT NULL,
  "experimentoId" INTEGER NOT NULL,
  idade INTEGER,
  cidade VARCHAR(128),
  estado VARCHAR(64),
  pais VARCHAR(128),
  finalizado BOOLEAN NOT NULL DEFAULT false,
  "tempoTotal" INTEGER,
  "finalizadoEm" TIMESTAMP,
  "criadoEm" TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY ("adminId") REFERENCES admins(id) ON DELETE CASCADE,
  FOREIGN KEY ("experimentoId") REFERENCES experimentos(id) ON DELETE CASCADE
);

-- ─── Tabela: respostas ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS respostas (
  id SERIAL PRIMARY KEY,
  "sessaoId" INTEGER NOT NULL,
  "atributoId" INTEGER NOT NULL,
  "amostraId" INTEGER NOT NULL,
  valor FLOAT NOT NULL,
  "criadoEm" TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY ("sessaoId") REFERENCES sessoes(id) ON DELETE CASCADE,
  FOREIGN KEY ("atributoId") REFERENCES atributos(id) ON DELETE CASCADE,
  FOREIGN KEY ("amostraId") REFERENCES amostras(id) ON DELETE CASCADE,
  UNIQUE ("sessaoId", "atributoId", "amostraId")
);

-- ─── Tabela: convites ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS convites (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(32) NOT NULL UNIQUE,
  email VARCHAR(320),
  "criadoPor" INTEGER NOT NULL,
  usado BOOLEAN NOT NULL DEFAULT false,
  "usadoPor" INTEGER,
  "usadoEm" TIMESTAMP,
  "expiradoEm" TIMESTAMP,
  "criadoEm" TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY ("criadoPor") REFERENCES admins(id) ON DELETE CASCADE,
  FOREIGN KEY ("usadoPor") REFERENCES admins(id) ON DELETE SET NULL
);

-- ─── Tabela: users (mantida para compatibilidade futura, opcional) ──────────────
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  "openId" VARCHAR(64) NOT NULL UNIQUE,
  name TEXT,
  email VARCHAR(320),
  "loginMethod" VARCHAR(64),
  role VARCHAR(32) NOT NULL DEFAULT 'user',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "lastSignedIn" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── Índices para melhor performance ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_experimentos_adminId ON experimentos("adminId");
CREATE INDEX IF NOT EXISTS idx_experimentos_slug ON experimentos(slug);
CREATE INDEX IF NOT EXISTS idx_amostras_experimentoId ON amostras("experimentoId");
CREATE INDEX IF NOT EXISTS idx_atributos_experimentoId ON atributos("experimentoId");
CREATE INDEX IF NOT EXISTS idx_sessoes_adminId ON sessoes("adminId");
CREATE INDEX IF NOT EXISTS idx_sessoes_experimentoId ON sessoes("experimentoId");
CREATE INDEX IF NOT EXISTS idx_respostas_sessaoId ON respostas("sessaoId");
CREATE INDEX IF NOT EXISTS idx_respostas_atributoId ON respostas("atributoId");
CREATE INDEX IF NOT EXISTS idx_respostas_amostraId ON respostas("amostraId");
CREATE INDEX IF NOT EXISTS idx_convites_codigo ON convites(codigo);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- ✅ Pronto! Todas as tabelas foram criadas com sucesso.
-- Agora configure as variáveis de ambiente:
-- DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]
-- Você pode encontrar a connection string em Supabase > Project Settings > Database > Connection Pooling
