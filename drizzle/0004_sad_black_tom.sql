CREATE TABLE "brewers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"method" "brew_method" DEFAULT 'v60' NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coffees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"roaster" text,
	"origin" text,
	"roast_level" "roast_level",
	"process" text,
	"photo_url" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grinders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "default_grinder_id" uuid;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "default_brewer_id" uuid;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "coffee_id" uuid;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "grinder_id" uuid;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "brewer_id" uuid;--> statement-breakpoint
ALTER TABLE "brewers" ADD CONSTRAINT "brewers_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coffees" ADD CONSTRAINT "coffees_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grinders" ADD CONSTRAINT "grinders_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "brewers_owner_idx" ON "brewers" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "coffees_owner_idx" ON "coffees" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "grinders_owner_idx" ON "grinders" USING btree ("owner_id");