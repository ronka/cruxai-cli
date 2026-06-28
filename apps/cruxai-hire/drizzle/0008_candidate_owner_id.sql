-- Add owner_id to candidates: backfill, enforce NOT NULL, swap unique constraint
ALTER TABLE "candidates" ADD COLUMN "owner_id" text;--> statement-breakpoint
UPDATE "candidates" SET "owner_id" = 'oF6JJgGWc4ewWqaIQuSKwZIv4IPYfdl0';--> statement-breakpoint
ALTER TABLE "candidates" ALTER COLUMN "owner_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "candidates" DROP CONSTRAINT "candidates_email_unique";--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_owner_id_email_unique" UNIQUE("owner_id","email");
