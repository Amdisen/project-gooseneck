CREATE TYPE "public"."brew_method" AS ENUM('v60');--> statement-breakpoint
CREATE TYPE "public"."roast_level" AS ENUM('light', 'medium-light', 'medium', 'medium-dark', 'dark');--> statement-breakpoint
CREATE TYPE "public"."visibility" AS ENUM('private', 'public');--> statement-breakpoint
CREATE TABLE "brew_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"recipe_id" uuid NOT NULL,
	"recipe_version_id" uuid,
	"rating" integer,
	"notes" text,
	"brewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"username" text,
	"display_name" text,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "recipe_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"version_number" integer,
	"is_draft" boolean DEFAULT true NOT NULL,
	"bean_name" text,
	"roaster" text,
	"origin" text,
	"roast_level" "roast_level",
	"bean_photo_url" text,
	"grinder_name" text,
	"grind_setting" text,
	"grind_photo_url" text,
	"dose_grams" real NOT NULL,
	"water_grams" real NOT NULL,
	"water_temp_c" real,
	"filter_type" text,
	"technique_notes" text,
	"bloom_water_grams" real,
	"bloom_seconds" integer,
	"pours" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ratio" real,
	"total_brew_seconds" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"title" text NOT NULL,
	"method" "brew_method" DEFAULT 'v60' NOT NULL,
	"visibility" "visibility" DEFAULT 'private' NOT NULL,
	"current_version_id" uuid,
	"forked_from_recipe_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brew_logs" ADD CONSTRAINT "brew_logs_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brew_logs" ADD CONSTRAINT "brew_logs_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brew_logs" ADD CONSTRAINT "brew_logs_recipe_version_id_recipe_versions_id_fk" FOREIGN KEY ("recipe_version_id") REFERENCES "public"."recipe_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_versions" ADD CONSTRAINT "recipe_versions_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "brew_logs_recipe_idx" ON "brew_logs" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "brew_logs_user_idx" ON "brew_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "recipe_versions_recipe_idx" ON "recipe_versions" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "recipes_owner_idx" ON "recipes" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "recipes_visibility_idx" ON "recipes" USING btree ("visibility");