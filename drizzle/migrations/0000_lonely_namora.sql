CREATE TYPE "public"."data_source" AS ENUM('foundation', 'survey', 'branded', 'sr_legacy');--> statement-breakpoint
CREATE TYPE "public"."image_source" AS ENUM('unsplash', 'manual');--> statement-breakpoint
CREATE TYPE "public"."nutrient_category" AS ENUM('macronutrient', 'vitamin', 'mineral', 'fatty_acid', 'amino_acid', 'other');--> statement-breakpoint
CREATE TYPE "public"."price_source" AS ENUM('bls', 'usda_estimate', 'manual');--> statement-breakpoint
CREATE TYPE "public"."tag_type" AS ENUM('dietary', 'allergen', 'processing_level', 'custom');--> statement-breakpoint
CREATE TABLE "bls_food_crosswalk" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bls_series_id" text NOT NULL,
	"bls_item_name" text NOT NULL,
	"food_id" uuid NOT NULL,
	"unit_conversion_factor" numeric NOT NULL,
	"notes" text,
	CONSTRAINT "bls_food_crosswalk_bls_series_id_unique" UNIQUE("bls_series_id")
);
--> statement-breakpoint
CREATE TABLE "food_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"food_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"thumbnail_url" text NOT NULL,
	"source" "image_source" NOT NULL,
	"photographer_name" text,
	"photographer_url" text,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "food_images_food_id_unique" UNIQUE("food_id")
);
--> statement-breakpoint
CREATE TABLE "food_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"food_id" uuid NOT NULL,
	"tag_type" "tag_type" NOT NULL,
	"tag_value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "foods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fdc_id" integer,
	"name" text NOT NULL,
	"food_group" text,
	"food_subgroup" text,
	"data_source" "data_source",
	"serving_size_g" numeric,
	"serving_unit" text,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "foods_fdc_id_unique" UNIQUE("fdc_id")
);
--> statement-breakpoint
CREATE TABLE "nutrients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"food_id" uuid NOT NULL,
	"nutrient_name" text NOT NULL,
	"nutrient_category" "nutrient_category",
	"amount" numeric,
	"unit" text,
	"per_100g" numeric
);
--> statement-breakpoint
CREATE TABLE "price_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"food_id" uuid,
	"food_group" text,
	"bls_series_id" text,
	"price_per_unit" numeric,
	"unit" text,
	"price_per_100g" numeric,
	"source" "price_source" NOT NULL,
	"period" text,
	"region" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"config_json" jsonb NOT NULL,
	"share_slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saved_views_share_slug_unique" UNIQUE("share_slug")
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"dietary_profile" jsonb,
	"excluded_foods" uuid[],
	"default_columns" text[],
	"accent_color" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "bls_food_crosswalk" ADD CONSTRAINT "bls_food_crosswalk_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_images" ADD CONSTRAINT "food_images_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_tags" ADD CONSTRAINT "food_tags_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nutrients" ADD CONSTRAINT "nutrients_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_data" ADD CONSTRAINT "price_data_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_bls_crosswalk_food_id" ON "bls_food_crosswalk" USING btree ("food_id");--> statement-breakpoint
CREATE INDEX "idx_food_tags_food_id" ON "food_tags" USING btree ("food_id");--> statement-breakpoint
CREATE INDEX "idx_food_tags_food_type" ON "food_tags" USING btree ("food_id","tag_type");--> statement-breakpoint
CREATE INDEX "idx_food_tags_value" ON "food_tags" USING btree ("tag_value");--> statement-breakpoint
CREATE INDEX "idx_foods_name" ON "foods" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_foods_food_group" ON "foods" USING btree ("food_group");--> statement-breakpoint
CREATE INDEX "idx_nutrients_food_id" ON "nutrients" USING btree ("food_id");--> statement-breakpoint
CREATE INDEX "idx_nutrients_food_nutrient" ON "nutrients" USING btree ("food_id","nutrient_name");--> statement-breakpoint
CREATE INDEX "idx_price_data_food_id" ON "price_data" USING btree ("food_id");--> statement-breakpoint
CREATE INDEX "idx_price_data_food_source" ON "price_data" USING btree ("food_id","source");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_saved_views_share_slug" ON "saved_views" USING btree ("share_slug");