CREATE TABLE "comparisons" (
	"id" text PRIMARY KEY NOT NULL,
	"master_file" text NOT NULL,
	"secondary_file" text NOT NULL,
	"total_rows" integer NOT NULL,
	"matched_rows" integer NOT NULL,
	"unmatched_rows" integer NOT NULL,
	"master_data" text NOT NULL,
	"secondary_data" text NOT NULL,
	"comparison_data" text NOT NULL,
	"master_columns" text,
	"secondary_columns" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "comparisons_created_at_idx" ON "comparisons" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "comparisons_master_file_idx" ON "comparisons" USING btree ("master_file");--> statement-breakpoint
CREATE INDEX "comparisons_secondary_file_idx" ON "comparisons" USING btree ("secondary_file");