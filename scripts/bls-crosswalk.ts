/**
 * BLS Average Price → USDA Food Crosswalk
 *
 * Manually curated mapping of BLS Average Retail Price series to USDA food
 * descriptions. Used by seed-prices.ts to fetch real price data from the
 * BLS API and link it to specific food records.
 *
 * Series ID format: APU0000XXXXXX
 *   AP  = Average Retail Price
 *   U   = Urban
 *   0000 = U.S. city average
 *   XXXXXX = 6-digit item code
 *
 * unitConversionFactor: multiply the BLS-reported price (in the stated unit)
 * by this factor to obtain price_per_100g.
 *
 * Examples:
 *   Per lb  → 100 / 453.592 = 0.22046
 *   Per doz (large eggs, ≈600 g) → 100 / 600 = 0.16667
 *   Per ½ gal liquid (≈1892 g)   → 100 / 1892 = 0.05285
 *   Per 5 lb bag                  → 100 / 2268 = 0.04411
 */

export interface CrosswalkEntry {
  /** BLS series ID, e.g. "APU0000701111" */
  blsSeriesId: string
  /** Human-readable BLS item label */
  blsItemName: string
  /** Search term used to match a row in the USDA `foods` table (ILIKE) */
  usdaSearchTerm: string
  /** Multiply BLS price by this factor to get price_per_100g */
  unitConversionFactor: number
  /** BLS reported unit (for documentation) */
  blsUnit: string
  /** Optional annotation */
  notes?: string
}

// ─── Conversion constants ─────────────────────────────────────────────────────

const PER_LB    = 0.22046   // 100g / 453.592g
const PER_DOZEN = 0.16667   // 100g / 600g  (large egg ≈ 50g × 12)
const PER_HALF_GAL = 0.05285 // 100g / 1892g
const PER_5_LB  = 0.04411   // 100g / 2267.96g
const PER_6_OZ  = 0.58792   // 100g / 170.1g
const PER_8_OZ  = 0.44092   // 100g / 226.8g
const PER_12_OZ = 0.29394   // 100g / 340.2g
const PER_14P5_OZ = 0.24327 // 100g / 411.1g
const PER_15_OZ = 0.23513   // 100g / 425.2g
const PER_16_OZ = 0.22046   // 100g / 453.6g  (same as per lb)
const PER_18_OZ = 0.19597   // 100g / 510.3g
const PER_PINT  = 0.29412   // 100g / 340g    (berries by volume)
const PER_QT    = 0.10571   // 100g / 946g    (liquids)
const PER_2L    = 0.05000   // 100g / 2000g

// ─── Crosswalk entries ────────────────────────────────────────────────────────

export const CROSSWALK: CrosswalkEntry[] = [

  // ── Beef ──────────────────────────────────────────────────────────────────

  {
    blsSeriesId: 'APU0000701111',
    blsItemName: 'Ground beef, 100% beef, per lb.',
    usdaSearchTerm: 'Ground beef',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000701312',
    blsItemName: 'Ground beef, lean and extra lean, per lb.',
    usdaSearchTerm: 'Ground beef, lean',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000702111',
    blsItemName: 'Beef for stew, boneless, per lb.',
    usdaSearchTerm: 'Beef, chuck, arm pot roast',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000703112',
    blsItemName: 'Chuck roast, U.S. choice, bone-in, per lb.',
    usdaSearchTerm: 'Beef, chuck, blade roast',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000703411',
    blsItemName: 'Round roast, USDA choice, boneless, per lb.',
    usdaSearchTerm: 'Beef, round, eye of round roast',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000703511',
    blsItemName: 'Round steak, graded and ungraded, per lb.',
    usdaSearchTerm: 'Beef, round, bottom round steak',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000703611',
    blsItemName: 'Sirloin steak, U.S. choice, boneless, per lb.',
    usdaSearchTerm: 'Beef, loin, top sirloin steak',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },

  // ── Pork ──────────────────────────────────────────────────────────────────

  {
    blsSeriesId: 'APU0000706111',
    blsItemName: 'Pork chops, center cut, bone-in, per lb.',
    usdaSearchTerm: 'Pork, fresh, loin, center rib (chops)',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000706211',
    blsItemName: 'Pork chops, boneless, center cut, per lb.',
    usdaSearchTerm: 'Pork, fresh, loin, blade (chops)',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000706311',
    blsItemName: 'Ham, boneless, excluding canned, per lb.',
    usdaSearchTerm: 'Pork, cured, ham, boneless',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000706411',
    blsItemName: 'Ham, whole, bone-in, smoked, per lb.',
    usdaSearchTerm: 'Pork, cured, ham, whole',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000706511',
    blsItemName: 'Bacon, sliced, per lb.',
    usdaSearchTerm: 'Pork, cured, bacon',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000706611',
    blsItemName: 'Pork sausage, fresh, loose, per lb.',
    usdaSearchTerm: 'Pork sausage',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },

  // ── Processed meats ────────────────────────────────────────────────────────

  {
    blsSeriesId: 'APU0000708111',
    blsItemName: 'Frankfurters, all meat or all beef, per lb.',
    usdaSearchTerm: 'Frankfurter, beef',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000708211',
    blsItemName: 'Bologna, all beef or mixed, per lb.',
    usdaSearchTerm: 'Bologna, beef',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },

  // ── Poultry ────────────────────────────────────────────────────────────────

  {
    blsSeriesId: 'APU0000707111',
    blsItemName: 'Chicken, fresh, whole, per lb.',
    usdaSearchTerm: 'Chicken, broilers or fryers, whole',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000707211',
    blsItemName: 'Chicken breast, bone-in, per lb.',
    usdaSearchTerm: 'Chicken, broilers or fryers, breast, bone-in',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000707311',
    blsItemName: 'Chicken breast, boneless, per lb.',
    usdaSearchTerm: 'Chicken, broilers or fryers, breast, boneless',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000707411',
    blsItemName: 'Chicken legs, bone-in, per lb.',
    usdaSearchTerm: 'Chicken, broilers or fryers, leg',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000707511',
    blsItemName: 'Chicken thighs, bone-in, per lb.',
    usdaSearchTerm: 'Chicken, broilers or fryers, thigh',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000707611',
    blsItemName: 'Turkey, frozen, whole, per lb.',
    usdaSearchTerm: 'Turkey, whole',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },

  // ── Seafood ────────────────────────────────────────────────────────────────

  {
    blsSeriesId: 'APU0000714111',
    blsItemName: 'Tuna, light, canned in water, per 6 oz.',
    usdaSearchTerm: 'Tuna, light, canned in water',
    unitConversionFactor: PER_6_OZ,
    blsUnit: 'per 6 oz can',
    notes: '6 oz ≈ 170.1 g drained weight',
  },

  // ── Eggs ──────────────────────────────────────────────────────────────────

  {
    blsSeriesId: 'APU0000709111',
    blsItemName: 'Eggs, grade A, large, per dozen.',
    usdaSearchTerm: 'Egg, whole, raw',
    unitConversionFactor: PER_DOZEN,
    blsUnit: 'per dozen',
    notes: 'Large egg ≈ 50 g; dozen ≈ 600 g',
  },

  // ── Dairy ─────────────────────────────────────────────────────────────────

  {
    blsSeriesId: 'APU0000710111',
    blsItemName: 'Milk, fresh, whole, fortified, per 1/2 gal.',
    usdaSearchTerm: 'Milk, whole',
    unitConversionFactor: PER_HALF_GAL,
    blsUnit: 'per half gallon',
    notes: '½ gal ≈ 1892 g',
  },
  {
    blsSeriesId: 'APU0000710211',
    blsItemName: 'Milk, fresh, reduced fat (2%), per 1/2 gal.',
    usdaSearchTerm: 'Milk, reduced fat, fluid, 2%',
    unitConversionFactor: PER_HALF_GAL,
    blsUnit: 'per half gallon',
  },
  {
    blsSeriesId: 'APU0000710311',
    blsItemName: 'Milk, fresh, low fat (1%), per 1/2 gal.',
    usdaSearchTerm: 'Milk, low fat, fluid, 1%',
    unitConversionFactor: PER_HALF_GAL,
    blsUnit: 'per half gallon',
  },
  {
    blsSeriesId: 'APU0000710411',
    blsItemName: 'Milk, fresh, nonfat (skim), per 1/2 gal.',
    usdaSearchTerm: 'Milk, nonfat, fluid, skim',
    unitConversionFactor: PER_HALF_GAL,
    blsUnit: 'per half gallon',
  },
  {
    blsSeriesId: 'APU0000711111',
    blsItemName: 'Butter, salted, grade AA, per lb.',
    usdaSearchTerm: 'Butter, salted',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000711311',
    blsItemName: 'Cheddar cheese, natural, per lb.',
    usdaSearchTerm: 'Cheese, cheddar',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000711211',
    blsItemName: 'American processed cheese, per lb.',
    usdaSearchTerm: 'Cheese, american, processed',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000711411',
    blsItemName: 'Mozzarella, natural, per lb.',
    usdaSearchTerm: 'Cheese, mozzarella',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000711611',
    blsItemName: 'Ice cream, prepackaged, bulk, per 1/2 gal.',
    usdaSearchTerm: 'Ice cream, vanilla',
    unitConversionFactor: PER_HALF_GAL,
    blsUnit: 'per half gallon',
  },
  {
    blsSeriesId: 'APU0000711811',
    blsItemName: 'Yogurt, plain, per 8 oz.',
    usdaSearchTerm: 'Yogurt, plain, whole milk',
    unitConversionFactor: PER_8_OZ,
    blsUnit: 'per 8 oz container',
    notes: '8 oz ≈ 226.8 g',
  },

  // ── Grains & pasta ────────────────────────────────────────────────────────

  {
    blsSeriesId: 'APU0000715111',
    blsItemName: 'Rice, white, long grain, raw, per lb.',
    usdaSearchTerm: 'Rice, white, long-grain, raw',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000715211',
    blsItemName: 'Rice, white, long grain, instant (precooked), per lb.',
    usdaSearchTerm: 'Rice, white, long-grain, parboiled',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000715311',
    blsItemName: 'Spaghetti and macaroni, per lb.',
    usdaSearchTerm: 'Spaghetti, dry',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000715411',
    blsItemName: 'Bread, white, pan, per lb.',
    usdaSearchTerm: 'Bread, white, commercially prepared',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000715511',
    blsItemName: 'Bread, whole wheat, per lb.',
    usdaSearchTerm: 'Bread, whole-wheat, commercially prepared',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000715611',
    blsItemName: 'Flour, white, all purpose, per 5 lb.',
    usdaSearchTerm: 'Wheat flour, white, all-purpose',
    unitConversionFactor: PER_5_LB,
    blsUnit: 'per 5 lb bag',
    notes: '5 lb ≈ 2268 g',
  },
  {
    blsSeriesId: 'APU0000715711',
    blsItemName: 'Oatmeal, quick cook and regular, per lb.',
    usdaSearchTerm: 'Oats, regular and quick',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000715911',
    blsItemName: 'Cereals, corn flakes, 18 oz.',
    usdaSearchTerm: 'Cereals, KELLOGG\'S, CORN FLAKES',
    unitConversionFactor: PER_18_OZ,
    blsUnit: 'per 18 oz box',
    notes: '18 oz ≈ 510 g',
  },

  // ── Sweeteners & pantry ────────────────────────────────────────────────────

  {
    blsSeriesId: 'APU0000715811',
    blsItemName: 'Sugar, white, all sizes, per lb.',
    usdaSearchTerm: 'Sugars, granulated',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000719511',
    blsItemName: 'Honey, per lb.',
    usdaSearchTerm: 'Honey',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000719111',
    blsItemName: 'Peanut butter, creamy, all sizes, per lb.',
    usdaSearchTerm: 'Peanut butter, creamy',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000719211',
    blsItemName: 'Beans, dried, navy, per lb.',
    usdaSearchTerm: 'Beans, navy, mature seeds, raw',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000719311',
    blsItemName: 'Vegetable oil, per qt.',
    usdaSearchTerm: 'Oil, vegetable, soybean',
    unitConversionFactor: PER_QT,
    blsUnit: 'per quart',
    notes: '1 qt ≈ 946 g for oil',
  },
  {
    blsSeriesId: 'APU0000719411',
    blsItemName: 'Olive oil, extra virgin, per qt.',
    usdaSearchTerm: 'Oil, olive, salad or cooking',
    unitConversionFactor: PER_QT,
    blsUnit: 'per quart',
  },
  {
    blsSeriesId: 'APU0000719611',
    blsItemName: 'Tomatoes, canned, per 14.5 oz.',
    usdaSearchTerm: 'Tomatoes, red, canned',
    unitConversionFactor: PER_14P5_OZ,
    blsUnit: 'per 14.5 oz can',
    notes: '14.5 oz ≈ 411 g',
  },

  // ── Beverages ─────────────────────────────────────────────────────────────

  {
    blsSeriesId: 'APU0000716111',
    blsItemName: 'Coffee, 100%, ground roast, all sizes, per lb.',
    usdaSearchTerm: 'Coffee, brewed from grounds',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
    notes: 'Price is for dry ground coffee, not brewed beverage',
  },
  {
    blsSeriesId: 'APU0000716211',
    blsItemName: 'Cola, non-diet, per 2-liter.',
    usdaSearchTerm: 'Carbonated beverage, cola, contains caffeine',
    unitConversionFactor: PER_2L,
    blsUnit: 'per 2-liter bottle',
    notes: '2 L ≈ 2000 g',
  },
  {
    blsSeriesId: 'APU0000716311',
    blsItemName: 'Orange juice, frozen concentrate, per 12 oz.',
    usdaSearchTerm: 'Orange juice, frozen concentrate',
    unitConversionFactor: PER_12_OZ,
    blsUnit: 'per 12 oz can',
    notes: '12 oz ≈ 340 g',
  },
  {
    blsSeriesId: 'APU0000716411',
    blsItemName: 'Orange juice, fresh, per 1/2 gal.',
    usdaSearchTerm: 'Orange juice, raw',
    unitConversionFactor: PER_HALF_GAL,
    blsUnit: 'per half gallon',
  },

  // ── Vegetables ────────────────────────────────────────────────────────────

  {
    blsSeriesId: 'APU0000717111',
    blsItemName: 'Potatoes, white, all sizes, per lb.',
    usdaSearchTerm: 'Potatoes, white, flesh and skin, raw',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000717211',
    blsItemName: 'Sweet potatoes, per lb.',
    usdaSearchTerm: 'Sweet potato, raw',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000717311',
    blsItemName: 'Tomatoes, field grown, per lb.',
    usdaSearchTerm: 'Tomatoes, red, ripe, raw',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000718111',
    blsItemName: 'Lettuce, iceberg (head), per lb.',
    usdaSearchTerm: 'Lettuce, iceberg (includes crisphead types), raw',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000718211',
    blsItemName: 'Broccoli, per lb.',
    usdaSearchTerm: 'Broccoli, raw',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000718311',
    blsItemName: 'Carrots, short trimmed and topped, per lb.',
    usdaSearchTerm: 'Carrots, raw',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000718411',
    blsItemName: 'Celery, per lb.',
    usdaSearchTerm: 'Celery, raw',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000718511',
    blsItemName: 'Corn, sweet, frozen, cut, per 16 oz.',
    usdaSearchTerm: 'Corn, sweet, yellow, frozen, kernels cut off cob',
    unitConversionFactor: PER_16_OZ,
    blsUnit: 'per 16 oz bag',
  },
  {
    blsSeriesId: 'APU0000718611',
    blsItemName: 'Peas, sweet, canned, per 15 oz.',
    usdaSearchTerm: 'Peas, green, canned',
    unitConversionFactor: PER_15_OZ,
    blsUnit: 'per 15 oz can',
  },
  {
    blsSeriesId: 'APU0000718711',
    blsItemName: 'Beans, green, cut, canned, per 15 oz.',
    usdaSearchTerm: 'Beans, snap, green, canned',
    unitConversionFactor: PER_15_OZ,
    blsUnit: 'per 15 oz can',
  },
  {
    blsSeriesId: 'APU0000718811',
    blsItemName: 'Potatoes, frozen, French fried, per 16 oz.',
    usdaSearchTerm: 'Potatoes, french fried, all types, frozen',
    unitConversionFactor: PER_16_OZ,
    blsUnit: 'per 16 oz bag',
  },
  {
    blsSeriesId: 'APU0000718911',
    blsItemName: 'Mushrooms, fresh, per lb.',
    usdaSearchTerm: 'Mushrooms, white, raw',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },

  // ── Fruits ────────────────────────────────────────────────────────────────

  {
    blsSeriesId: 'APU0000717411',
    blsItemName: 'Bananas, per lb.',
    usdaSearchTerm: 'Bananas, raw',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000717511',
    blsItemName: 'Apples, Red Delicious, per lb.',
    usdaSearchTerm: 'Apples, raw, with skin',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000717611',
    blsItemName: 'Oranges, Navel, per lb.',
    usdaSearchTerm: 'Oranges, raw, navels',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000717711',
    blsItemName: 'Grapes, Thompson Seedless, per lb.',
    usdaSearchTerm: 'Grapes, american type (slip skin), raw',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000717811',
    blsItemName: 'Grapefruit, per lb.',
    usdaSearchTerm: 'Grapefruit, raw, pink and red',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000717911',
    blsItemName: 'Strawberries, dry pint.',
    usdaSearchTerm: 'Strawberries, raw',
    unitConversionFactor: PER_PINT,
    blsUnit: 'per dry pint',
    notes: 'Dry pint of strawberries ≈ 340 g',
  },
  {
    blsSeriesId: 'APU0000717012',
    blsItemName: 'Peaches, per lb.',
    usdaSearchTerm: 'Peaches, raw',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000717013',
    blsItemName: 'Pears, Anjou, per lb.',
    usdaSearchTerm: 'Pears, raw',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
  {
    blsSeriesId: 'APU0000717014',
    blsItemName: 'Lemons, per lb.',
    usdaSearchTerm: 'Lemons, raw, without peel',
    unitConversionFactor: PER_LB,
    blsUnit: 'per lb',
  },
]
