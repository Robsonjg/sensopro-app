DO $$ BEGIN
 CREATE TYPE "role" AS ENUM('user', 'admin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"senha_hash" text NOT NULL,
	"nome" varchar(255),
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "experimentos" (
	"id" serial PRIMARY KEY NOT NULL,
	"adminId" integer NOT NULL,
	"titulo" varchar(255) NOT NULL,
	"descricao" text,
	"slug" varchar(128) NOT NULL,
	"ativo" boolean DEFAULT false NOT NULL,
	"criadoPor" integer NOT NULL,
	"criadoEm" timestamp DEFAULT now() NOT NULL,
	"atualizadoEm" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "experimentos_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "amostras" (
	"id" serial PRIMARY KEY NOT NULL,
	"experimentoId" integer NOT NULL,
	"codigo" varchar(64) NOT NULL,
	"nome" varchar(255) NOT NULL,
	"descricao" text,
	"ordem" integer DEFAULT 0 NOT NULL,
	"criadoEm" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "atributos" (
	"id" serial PRIMARY KEY NOT NULL,
	"experimentoId" integer NOT NULL,
	"nome" varchar(128) NOT NULL,
	"descricao" text,
	"labelMin" varchar(64) DEFAULT 'Muito Baixo',
	"labelMax" varchar(64) DEFAULT 'Muito Alto',
	"ordem" integer DEFAULT 0 NOT NULL,
	"criadoEm" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"adminId" integer NOT NULL,
	"experimentoId" integer NOT NULL,
	"idade" integer,
	"cidade" varchar(128),
	"estado" varchar(64),
	"pais" varchar(128),
	"finalizado" boolean DEFAULT false NOT NULL,
	"tempoTotal" integer,
	"finalizadoEm" timestamp,
	"criadoEm" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "respostas" (
	"id" serial PRIMARY KEY NOT NULL,
	"sessaoId" integer NOT NULL,
	"atributoId" integer NOT NULL,
	"amostraId" integer NOT NULL,
	"valor" real NOT NULL,
	"criadoEm" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_resposta" UNIQUE("sessaoId","atributoId","amostraId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "convites" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" varchar(32) NOT NULL,
	"email" varchar(320),
	"criadoPor" integer NOT NULL,
	"usado" boolean DEFAULT false NOT NULL,
	"usadoPor" integer,
	"usadoEm" timestamp,
	"expiradoEm" timestamp,
	"criadoEm" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "convites_codigo_unique" UNIQUE("codigo")
);
