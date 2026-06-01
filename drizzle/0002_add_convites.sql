CREATE TABLE `convites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigo` varchar(32) NOT NULL,
	`email` varchar(320),
	`criadoPor` int NOT NULL,
	`usado` boolean NOT NULL DEFAULT false,
	`usadoPor` int,
	`usadoEm` timestamp,
	`expiradoEm` timestamp,
	`criadoEm` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `convites_id` PRIMARY KEY(`id`),
	CONSTRAINT `convites_codigo_unique` UNIQUE(`codigo`)
);
