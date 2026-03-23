CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `cv_versions` ADD `comment` text;--> statement-breakpoint
ALTER TABLE `recruiters` ADD `tg_synced_at` text;--> statement-breakpoint
ALTER TABLE `vacancies` ADD `description` text;