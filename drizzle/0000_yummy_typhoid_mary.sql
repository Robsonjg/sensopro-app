CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "admins" (
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
CREATE TABLE "amostras" (
	"id" serial PRIMARY KEY NOT NULL,
	"experimento_id" integer NOT NULL,
	"codigo" varchar(64) NOT NULL,
	"nome" varchar(255) NOT NULL,
	"descricao" text,
	"ordem" integer DEFAULT 0 NOT NULL,
	"criadoEm" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "atributos" (
	"id" serial PRIMARY KEY NOT NULL,
	"experimento_id" integer NOT NULL,
	"nome" varchar(128) NOT NULL,
	"descricao" text,
	"label_min" varchar(64) DEFAULT 'Muito Baixo',
	"label_max" varchar(64) DEFAULT 'Muito Alto',
	"ordem" integer DEFAULT 0 NOT NULL,
	"criadoEm" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "convites" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" varchar(32) NOT NULL,
	"email" varchar(320),
	"criado_por" integer NOT NULL,
	"usado" boolean DEFAULT false NOT NULL,
	"usadoPor" integer,
	"usado_em" timestamp,
	"expiradoEm" timestamp,
	"criadoEm" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "convites_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "experimentos" (
	"id" serial PRIMARY KEY NOT NULL,
	"adminId" integer NOT NULL,
	"titulo" varchar(255) NOT NULL,
	"descricao" text,
	"slug" varchar(128) NOT NULL,
	"ativo" boolean DEFAULT false NOT NULL,
	"criado_por" integer NOT NULL,
	"criadoEm" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "experimentos_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "respostas" (
	"id" serial PRIMARY KEY NOT NULL,
	"sessao_id" integer NOT NULL,
	"atributo_id" integer NOT NULL,
	"amostra_id" integer NOT NULL,
	"valor" real NOT NULL,
	"criadoEm" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_resposta" UNIQUE("sessao_id","atributo_id","amostra_id")
);
--> statement-breakpoint
CREATE TABLE "sessoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"adminId" integer NOT NULL,
	"experimento_id" integer NOT NULL,
	"idade" integer,
	"cidade" varchar(128),
	"estado" varchar(64),
	"pais" varchar(128),
	"finalizado" boolean DEFAULT false NOT NULL,
	"tempo_total" integer,
	"finalizado_em" timestamp,
	"criadoEm" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
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
