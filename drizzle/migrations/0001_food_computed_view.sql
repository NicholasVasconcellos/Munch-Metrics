-- Enable pg_trgm extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- pg_trgm GIN index on foods.name for fuzzy search
CREATE INDEX IF NOT EXISTS idx_foods_name_trgm ON foods USING GIN (name gin_trgm_ops);

-- Composite index: price_data lookup by food + source
CREATE INDEX IF NOT EXISTS idx_price_data_bls ON price_data (food_id) WHERE source = 'bls';
CREATE INDEX IF NOT EXISTS idx_price_data_estimate ON price_data (food_id) WHERE source = 'usda_estimate';

-- food_computed materialized view
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

-- Indexes on the materialized view
CREATE UNIQUE INDEX idx_food_computed_id       ON food_computed (id);
CREATE INDEX idx_food_computed_food_group      ON food_computed (food_group);
CREATE INDEX idx_food_computed_name_trgm       ON food_computed USING GIN (name gin_trgm_ops);
CREATE INDEX idx_food_computed_protein_dollar  ON food_computed (protein_per_dollar DESC NULLS LAST);
CREATE INDEX idx_food_computed_price           ON food_computed (price_per_100g ASC NULLS LAST);
