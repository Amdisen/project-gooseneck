CREATE TYPE "public"."brew_outcome" AS ENUM('better', 'same', 'worse');--> statement-breakpoint
ALTER TABLE "brew_logs" ADD COLUMN "outcome" "brew_outcome";