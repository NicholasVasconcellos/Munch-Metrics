-- Enable pg_trgm extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─── Enums ──────────────────────────────────────────────────────────────────────

CREATE TYPE "public"."data_source" AS ENUM('foundation', 'survey', 'branded', 'sr_legacy');
CREATE TYPE "public"."image_source" AS ENUM('unsplash', 'manual');
CREATE TYPE "public"."nutrient_category" AS ENUM('macronutrient', 'vitamin', 'mineral', 'fatty_acid', 'amino_acid', 'other');
CREATE TYPE "public"."price_source" AS ENUM('bls', 'usda_estimate', 'manual');
CREATE TYPE "public"."tag_type" AS ENUM('dietary', 'allergen', 'processing_level', 'custom');

-- ─── Tables ─────────────────────────────────────────────────────────────────────

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

CREATE TABLE "nutrients" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "food_id" uuid NOT NULL,
  "nutrient_name" text NOT NULL,
  "nutrient_category" "nutrient_category",
  "amount" numeric,
  "unit" text,
  "per_100g" numeric
);

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

CREATE TABLE "bls_food_crosswalk" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "bls_series_id" text NOT NULL,
  "bls_item_name" text NOT NULL,
  "food_id" uuid NOT NULL,
  "unit_conversion_factor" numeric NOT NULL,
  "notes" text,
  CONSTRAINT "bls_food_crosswalk_bls_series_id_unique" UNIQUE("bls_series_id")
);

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

CREATE TABLE "food_tags" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "food_id" uuid NOT NULL,
  "tag_type" "tag_type" NOT NULL,
  "tag_value" text NOT NULL
);

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

CREATE TABLE "saved_views" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text,
  "name" text NOT NULL,
  "config_json" jsonb NOT NULL,
  "share_slug" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "saved_views_share_slug_unique" UNIQUE("share_slug")
);

-- ─── Foreign Keys ───────────────────────────────────────────────────────────────

ALTER TABLE "nutrients" ADD CONSTRAINT "nutrients_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "price_data" ADD CONSTRAINT "price_data_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "bls_food_crosswalk" ADD CONSTRAINT "bls_food_crosswalk_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "food_images" ADD CONSTRAINT "food_images_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "food_tags" ADD CONSTRAINT "food_tags_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;

-- ─── Base Table Indexes ─────────────────────────────────────────────────────────

CREATE INDEX "idx_foods_name" ON "foods" USING btree ("name");
CREATE INDEX "idx_foods_food_group" ON "foods" USING btree ("food_group");
CREATE INDEX "idx_nutrients_food_id" ON "nutrients" USING btree ("food_id");
CREATE INDEX "idx_nutrients_food_nutrient" ON "nutrients" USING btree ("food_id", "nutrient_name");
CREATE INDEX "idx_price_data_food_id" ON "price_data" USING btree ("food_id");
CREATE INDEX "idx_price_data_food_source" ON "price_data" USING btree ("food_id", "source");
CREATE INDEX "idx_bls_crosswalk_food_id" ON "bls_food_crosswalk" USING btree ("food_id");
CREATE INDEX "idx_food_tags_food_id" ON "food_tags" USING btree ("food_id");
CREATE INDEX "idx_food_tags_food_type" ON "food_tags" USING btree ("food_id", "tag_type");
CREATE INDEX "idx_food_tags_value" ON "food_tags" USING btree ("tag_value");
CREATE UNIQUE INDEX "idx_saved_views_share_slug" ON "saved_views" USING btree ("share_slug");

-- ─── Trigram Index (fuzzy search) ───────────────────────────────────────────────

CREATE INDEX "idx_foods_name_trgm" ON "foods" USING GIN ("name" gin_trgm_ops);

-- ─── Partial Indexes for Price Lookups ──────────────────────────────────────────

CREATE INDEX "idx_price_data_bls" ON "price_data" ("food_id") WHERE "source" = 'bls';
CREATE INDEX "idx_price_data_estimate" ON "price_data" ("food_id") WHERE "source" = 'usda_estimate';

-- ─── Materialized View: food_computed ────────────────────────────────────────────
-- Aggregates key nutrients, resolves price (BLS preferred over estimate),
-- and attaches image metadata for fast table queries.

CREATE MATERIALIZED VIEW food_computed AS
SELECT
  f.id,
  f.fdc_id,
  f.name,
  f.food_group,
  f.food_subgroup,
  f.data_source,
  f.serving_size_g,
  f.serving_unit,
  f.description,

  -- Key nutrients per 100g (pivoted from the nutrients table)
  MAX(CASE WHEN n.nutrient_name = 'Energy'                        THEN n.per_100g END) AS calories_per_100g,
  MAX(CASE WHEN n.nutrient_name = 'Protein'                       THEN n.per_100g END) AS protein_per_100g,
  MAX(CASE WHEN n.nutrient_name = 'Total lipid (fat)'             THEN n.per_100g END) AS fat_per_100g,
  MAX(CASE WHEN n.nutrient_name = 'Carbohydrate, by difference'   THEN n.per_100g END) AS carbs_per_100g,
  MAX(CASE WHEN n.nutrient_name = 'Fiber, total dietary'          THEN n.per_100g END) AS fiber_per_100g,
  MAX(CASE WHEN n.nutrient_name = 'Sugars, total including NLEA'  THEN n.per_100g END) AS sugar_per_100g,
  MAX(CASE WHEN n.nutrient_name = 'Sodium, Na'                    THEN n.per_100g END) AS sodium_per_100g,
  MAX(CASE WHEN n.nutrient_name = 'Calcium, Ca'                   THEN n.per_100g END) AS calcium_per_100g,
  MAX(CASE WHEN n.nutrient_name = 'Iron, Fe'                      THEN n.per_100g END) AS iron_per_100g,

  -- Price: prefer BLS real prices over USDA category estimates
  COALESCE(pd_bls.price_per_100g, pd_est.price_per_100g)   AS price_per_100g,
  COALESCE(pd_bls.source,         pd_est.source)::text      AS price_source,

  -- Computed metric: protein efficiency (g protein per $1 spent per 100g)
  CASE
    WHEN COALESCE(pd_bls.price_per_100g, pd_est.price_per_100g) > 0
    THEN MAX(CASE WHEN n.nutrient_name = 'Protein' THEN n.per_100g END)
         / COALESCE(pd_bls.price_per_100g, pd_est.price_per_100g)
    ELSE NULL
  END AS protein_per_dollar,

  -- Image metadata
  fi.image_url,
  fi.thumbnail_url

FROM foods f
LEFT JOIN nutrients  n       ON n.food_id  = f.id
LEFT JOIN price_data pd_bls  ON pd_bls.food_id = f.id AND pd_bls.source = 'bls'
LEFT JOIN price_data pd_est  ON pd_est.food_id = f.id AND pd_est.source = 'usda_estimate'
LEFT JOIN food_images fi      ON fi.food_id = f.id

GROUP BY
  f.id, f.fdc_id, f.name, f.food_group, f.food_subgroup, f.data_source,
  f.serving_size_g, f.serving_unit, f.description,
  pd_bls.price_per_100g, pd_bls.source,
  pd_est.price_per_100g, pd_est.source,
  fi.image_url, fi.thumbnail_url;

-- ─── Materialized View Indexes ──────────────────────────────────────────────────

CREATE UNIQUE INDEX idx_food_computed_id       ON food_computed (id);
CREATE INDEX idx_food_computed_food_group      ON food_computed (food_group);
CREATE INDEX idx_food_computed_name_trgm       ON food_computed USING GIN (name gin_trgm_ops);
CREATE INDEX idx_food_computed_protein_dollar  ON food_computed (protein_per_dollar DESC NULLS LAST);
CREATE INDEX idx_food_computed_price           ON food_computed (price_per_100g ASC NULLS LAST);
