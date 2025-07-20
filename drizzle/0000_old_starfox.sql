CREATE TABLE `bonzai_usage` (
	`id` integer PRIMARY KEY NOT NULL,
	`total_requests` integer DEFAULT 0 NOT NULL,
	`total_input_tokens` integer DEFAULT 0 NOT NULL,
	`total_output_tokens` integer DEFAULT 0 NOT NULL,
	`requests_today` integer DEFAULT 0 NOT NULL,
	`input_tokens_today` integer DEFAULT 0 NOT NULL,
	`output_tokens_today` integer DEFAULT 0 NOT NULL,
	`last_reset` text DEFAULT (date('now')) NOT NULL,
	`next_reset` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `brave_usage` (
	`id` integer PRIMARY KEY NOT NULL,
	`requests_this_month` integer DEFAULT 0 NOT NULL,
	`monthly_limit` integer DEFAULT 2000 NOT NULL,
	`requests_remaining` integer DEFAULT 2000 NOT NULL,
	`last_reset` text DEFAULT (date('now', 'start of month')) NOT NULL,
	`next_reset` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
