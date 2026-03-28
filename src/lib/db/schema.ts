import {
  pgTable,
  pgEnum,
  uuid,
  integer,
  text,
  numeric,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const dataSourceEnum = pgEnum('data_source', [
  'foundation',
  'survey',
  'branded',
  'sr_legacy',
])

export const nutrientCategoryEnum = pgEnum('nutrient_category', [
  'macronutrient',
  'vitamin',
  'mineral',
  'fatty_acid',
  'amino_acid',
  'other',
])

export const priceSourceEnum = pgEnum('price_source', [
  'bls',
  'usda_estimate',
  'manual',
])

export const imageSourceEnum = pgEnum('image_source', [
  'unsplash',
  'manual',
])

export const tagTypeEnum = pgEnum('tag_type', [
  'dietary',
  'allergen',
  'processing_level',
  'custom',
])

// ─── Tables ───────────────────────────────────────────────────────────────────

export const foods = pgTable(
  'foods',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    fdcId: integer('fdc_id').unique(),
    name: text('name').notNull(),
    foodGroup: text('food_group'),
    foodSubgroup: text('food_subgroup'),
    dataSource: dataSourceEnum('data_source'),
    servingSizeG: numeric('serving_size_g'),
    servingUnit: text('serving_unit'),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_foods_name').on(t.name),
    index('idx_foods_food_group').on(t.foodGroup),
  ]
)

export const nutrients = pgTable(
  'nutrients',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    foodId: uuid('food_id')
      .notNull()
      .references(() => foods.id, { onDelete: 'cascade' }),
    nutrientName: text('nutrient_name').notNull(),
    nutrientCategory: nutrientCategoryEnum('nutrient_category'),
    amount: numeric('amount'),
    unit: text('unit'),
    per100g: numeric('per_100g'),
  },
  (t) => [
    index('idx_nutrients_food_id').on(t.foodId),
    index('idx_nutrients_food_nutrient').on(t.foodId, t.nutrientName),
  ]
)

export const priceData = pgTable(
  'price_data',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    foodId: uuid('food_id').references(() => foods.id, { onDelete: 'set null' }),
    foodGroup: text('food_group'),
    blsSeriesId: text('bls_series_id'),
    pricePerUnit: numeric('price_per_unit'),
    unit: text('unit'),
    pricePer100g: numeric('price_per_100g'),
    source: priceSourceEnum('source').notNull(),
    period: text('period'),
    region: text('region'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_price_data_food_id').on(t.foodId),
    index('idx_price_data_food_source').on(t.foodId, t.source),
  ]
)

export const blsFoodCrosswalk = pgTable(
  'bls_food_crosswalk',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    blsSeriesId: text('bls_series_id').notNull().unique(),
    blsItemName: text('bls_item_name').notNull(),
    foodId: uuid('food_id')
      .notNull()
      .references(() => foods.id, { onDelete: 'cascade' }),
    unitConversionFactor: numeric('unit_conversion_factor').notNull(),
    notes: text('notes'),
  },
  (t) => [
    index('idx_bls_crosswalk_food_id').on(t.foodId),
  ]
)

export const foodImages = pgTable(
  'food_images',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    foodId: uuid('food_id')
      .notNull()
      .unique()
      .references(() => foods.id, { onDelete: 'cascade' }),
    imageUrl: text('image_url').notNull(),
    thumbnailUrl: text('thumbnail_url').notNull(),
    source: imageSourceEnum('source').notNull(),
    photographerName: text('photographer_name'),
    photographerUrl: text('photographer_url'),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).defaultNow().notNull(),
  }
)

export const foodTags = pgTable(
  'food_tags',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    foodId: uuid('food_id')
      .notNull()
      .references(() => foods.id, { onDelete: 'cascade' }),
    tagType: tagTypeEnum('tag_type').notNull(),
    tagValue: text('tag_value').notNull(),
  },
  (t) => [
    index('idx_food_tags_food_id').on(t.foodId),
    index('idx_food_tags_food_type').on(t.foodId, t.tagType),
    index('idx_food_tags_value').on(t.tagValue),
  ]
)

export const userPreferences = pgTable(
  'user_preferences',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().unique(),
    dietaryProfile: jsonb('dietary_profile'),
    excludedFoods: uuid('excluded_foods').array(),
    defaultColumns: text('default_columns').array(),
    accentColor: text('accent_color'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  }
)

export const savedViews = pgTable(
  'saved_views',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id'),
    name: text('name').notNull(),
    configJson: jsonb('config_json').notNull(),
    shareSlug: text('share_slug').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('idx_saved_views_share_slug').on(t.shareSlug),
  ]
)
