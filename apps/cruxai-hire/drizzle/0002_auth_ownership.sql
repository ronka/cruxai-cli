-- Task 2: job_roles — replace recruiter_name with owner_id FK to better-auth user
ALTER TABLE "job_roles" ADD COLUMN "owner_id" text;
-- Orphaned rows (no owner) cannot satisfy NOT NULL; remove them before constraining.
DELETE FROM "job_roles" WHERE "owner_id" IS NULL;
ALTER TABLE "job_roles" ALTER COLUMN "owner_id" SET NOT NULL;
ALTER TABLE "job_roles" ADD CONSTRAINT "job_roles_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE CASCADE;
ALTER TABLE "job_roles" DROP COLUMN "recruiter_name";
--> statement-breakpoint

-- Task 3: questions — add owner_id (nullable to preserve existing rows) + is_public
ALTER TABLE "questions" ADD COLUMN "owner_id" text;
ALTER TABLE "questions" ADD COLUMN "is_public" boolean NOT NULL DEFAULT false;
ALTER TABLE "questions" ADD CONSTRAINT "questions_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE CASCADE;
--> statement-breakpoint

-- Task 5: drop legacy app-level users table (ownership now via better-auth user)
DROP TABLE IF EXISTS "users";
