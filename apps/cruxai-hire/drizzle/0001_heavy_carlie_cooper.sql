ALTER TYPE "public"."submission_status" ADD VALUE 'analyzing' BEFORE 'reviewed';--> statement-breakpoint
ALTER TABLE "submissions" ALTER COLUMN "invite_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "question_id" uuid;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE set null ON UPDATE no action;