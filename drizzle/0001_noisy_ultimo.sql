CREATE TABLE "admin_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"old_id" text NOT NULL,
	"assigned_to" text NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comparisons" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "comparisons" ADD COLUMN "comparison_method" text DEFAULT 'exact' NOT NULL;--> statement-breakpoint
ALTER TABLE "comparisons" ADD COLUMN "similarity_threshold" integer;--> statement-breakpoint
ALTER TABLE "comparisons" ADD COLUMN "fuzzy_algorithm" text DEFAULT 'jaro-winkler';--> statement-breakpoint
CREATE INDEX "admin_assignments_assigned_to_idx" ON "admin_assignments" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "comparisons_user_id_idx" ON "comparisons" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "comparisons_comparison_method_idx" ON "comparisons" USING btree ("comparison_method");