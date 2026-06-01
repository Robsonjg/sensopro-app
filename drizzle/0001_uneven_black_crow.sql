CREATE TABLE `amostras` (
	`id` int AUTO_INCREMENT NOT NULL,
	`experimentoId` int NOT NULL,
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
	`experimentoId` int NOT NULL,
	`nome` varchar(128) NOT NULL,
	`descricao` text,
	`labelMin` varchar(64) DEFAULT 'Muito Baixo',
	`labelMax` varchar(64) DEFAULT 'Muito Alto',
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
	`criadoPor` int NOT NULL,
	`criadoEm` timestamp NOT NULL DEFAULT (now()),
	`atualizadoEm` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `experimentos_id` PRIMARY KEY(`id`),
	CONSTRAINT `experimentos_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `respostas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessaoId` int NOT NULL,
	`atributoId` int NOT NULL,
	`amostraId` int NOT NULL,
	`valor` float NOT NULL,
	`criadoEm` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `respostas_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_resposta` UNIQUE(`sessaoId`,`atributoId`,`amostraId`)
);
--> statement-breakpoint
CREATE TABLE `sessoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`experimentoId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`nome` varchar(255),
	`finalizado` boolean NOT NULL DEFAULT false,
	`finalizadoEm` timestamp,
	`criadoEm` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sessoes_id` PRIMARY KEY(`id`)
);
