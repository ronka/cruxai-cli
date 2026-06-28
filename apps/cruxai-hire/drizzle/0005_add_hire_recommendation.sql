CREATE TYPE "public"."hire_recommendation" AS ENUM('strong', 'medium', 'no_hire');--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "hire_recommendation" "hire_recommendation";--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "hire_reasoning" text;
