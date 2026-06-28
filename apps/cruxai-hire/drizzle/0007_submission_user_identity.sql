-- Submission identity: add user_id, drop legacy null-null rows, enforce CHECK constraint.
DELETE FROM "submissions" WHERE "invite_id" IS NULL;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_identity_check" CHECK ("invite_id" IS NOT NULL OR "user_id" IS NOT NULL);
