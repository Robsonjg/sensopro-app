CREATE TABLE `amostras` (
	`id` int AUTO_INCREMENT NOT NULL,
	`experimento_id` int NOT NULL,
	`codigo` varchar(64) NOT NULL,
	`nome` varchar(255) NOT NULL,
	`descricao` text,
	`ordem` int NOT NULL DEFAULT 0,
	`criadoEm` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `amostras_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `atributos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`experimento_id` int NOT NULL,
	`nome` varchar(128) NOT NULL,
	`descricao` text,
	`label_min` varchar(64) DEFAULT 'Muito Baixo',
	`label_max` varchar(64) DEFAULT 'Muito Alto',
	`ordem` int NOT NULL DEFAULT 0,
	`criadoEm` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `atributos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `experimentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`descricao` text,
	`slug` varchar(128) NOT NULL,
	`ativo` boolean NOT NULL DEFAULT false,
	`criado_por` int NOT NULL,
	`criadoEm` timestamp NOT NULL DEFAULT (now()),
	`atualizado_em` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `experimentos_id` PRIMARY KEY(`id`),
	CONSTRAINT `experimentos_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `respostas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessao_id` int NOT NULL,
	`atributo_id` int NOT NULL,
	`amostra_id` int NOT NULL,
	`valor` float NOT NULL,
	`criadoEm` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `respostas_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_resposta` UNIQUE(`sessao_id`,`atributo_id`,`amostra_id`)
);
--> statement-breakpoint
CREATE TABLE `sessoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`experimento_id` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`nome` varchar(255),
	`finalizado` boolean NOT NULL DEFAULT false,
	`finalizado_em` timestamp,
	`criadoEm` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sessoes_id` PRIMARY KEY(`id`)
);
