import { describe, it, expect } from 'vitest'

/**
 * BLS unit conversion math tests.
 *
 * The BLS reports average retail prices in various units (per lb, per dozen,
 * per half-gallon, etc.). These are converted to price_per_100g by multiplying
 * the reported price by a unitConversionFactor.
 *
 * Formula: price_per_100g = bls_price_per_unit * unitConversionFactor
 * Where:   unitConversionFactor = 100 / weight_of_one_unit_in_grams
 */

// Conversion factors from bls-crosswalk.ts
const PER_LB       = 100 / 453.592    // ≈ 0.22046
const PER_DOZEN    = 100 / 600        // ≈ 0.16667  (large egg ≈ 50g × 12)
const PER_HALF_GAL = 100 / 1892       // ≈ 0.05285
const PER_5_LB     = 100 / 2267.96    // ≈ 0.04411
const PER_6_OZ     = 100 / 170.1      // ≈ 0.58792
const PER_8_OZ     = 100 / 226.8      // ≈ 0.44092
const PER_12_OZ    = 100 / 340.2      // ≈ 0.29394
const PER_16_OZ    = 100 / 453.6      // ≈ 0.22046

function pricePer100g(blsPrice: number, factor: number): number {
  return blsPrice * factor
}

function approxEqual(a: number, b: number, tolerance = 0.0001): boolean {
  return Math.abs(a - b) < tolerance
}

describe('unit conversion factors', () => {
  it('PER_LB = 100 / 453.592', () => {
    expect(approxEqual(PER_LB, 0.22046)).toBe(true)
  })

  it('PER_DOZEN = 100 / 600', () => {
    expect(approxEqual(PER_DOZEN, 0.16667)).toBe(true)
  })

  it('PER_HALF_GAL = 100 / 1892', () => {
    expect(approxEqual(PER_HALF_GAL, 0.05285)).toBe(true)
  })

  it('PER_5_LB = 100 / 2267.96', () => {
    expect(approxEqual(PER_5_LB, 0.04411)).toBe(true)
  })

  it('PER_6_OZ = 100 / 170.1', () => {
    expect(approxEqual(PER_6_OZ, 0.58792)).toBe(true)
  })

  it('PER_8_OZ = 100 / 226.8', () => {
    expect(approxEqual(PER_8_OZ, 0.44092)).toBe(true)
  })

  it('PER_12_OZ = 100 / 340.2', () => {
    expect(approxEqual(PER_12_OZ, 0.29394)).toBe(true)
  })

  it('PER_16_OZ equals PER_LB (same weight)', () => {
    expect(approxEqual(PER_16_OZ, PER_LB, 0.001)).toBe(true)
  })
})

describe('price_per_100g calculations', () => {
  it('chicken breast at $3.00/lb → ≈ $0.661/100g', () => {
    const result = pricePer100g(3.00, PER_LB)
    expect(approxEqual(result, 3.00 * 0.22046, 0.0001)).toBe(true)
    // Sanity: ≈ $0.66/100g
    expect(result).toBeGreaterThan(0.65)
    expect(result).toBeLessThan(0.68)
  })

  it('large eggs at $3.60/dozen → ≈ $0.60/100g', () => {
    const result = pricePer100g(3.60, PER_DOZEN)
    expect(approxEqual(result, 3.60 * 0.16667, 0.0001)).toBe(true)
    // Sanity: ≈ $0.60/100g
    expect(result).toBeGreaterThan(0.59)
    expect(result).toBeLessThan(0.62)
  })

  it('whole milk at $4.00/half-gallon → ≈ $0.211/100g', () => {
    const result = pricePer100g(4.00, PER_HALF_GAL)
    expect(approxEqual(result, 4.00 * 0.05285, 0.0001)).toBe(true)
    // Sanity: ≈ $0.21/100g
    expect(result).toBeGreaterThan(0.20)
    expect(result).toBeLessThan(0.22)
  })

  it('flour at $3.50/5lb bag → ≈ $0.154/100g', () => {
    const result = pricePer100g(3.50, PER_5_LB)
    expect(approxEqual(result, 3.50 * 0.04411, 0.0001)).toBe(true)
    // Sanity: ≈ $0.15/100g
    expect(result).toBeGreaterThan(0.15)
    expect(result).toBeLessThan(0.16)
  })

  it('zero price produces zero price_per_100g', () => {
    const result = pricePer100g(0, PER_LB)
    expect(result).toBe(0)
  })

  it('price is proportional — doubling price doubles price_per_100g', () => {
    const base = pricePer100g(2.00, PER_LB)
    const doubled = pricePer100g(4.00, PER_LB)
    expect(approxEqual(doubled, base * 2)).toBe(true)
  })

  it('100g of food at $1.00/lb costs exactly PER_LB dollars', () => {
    const result = pricePer100g(1.00, PER_LB)
    expect(approxEqual(result, PER_LB)).toBe(true)
  })
})

describe('inverse: recover original price from price_per_100g', () => {
  it('recovers original price per lb within rounding tolerance', () => {
    const originalPrice = 5.49
    const computed = pricePer100g(originalPrice, PER_LB)
    const recovered = computed / PER_LB
    expect(approxEqual(recovered, originalPrice, 0.001)).toBe(true)
  })

  it('recovers original price per dozen within rounding tolerance', () => {
    const originalPrice = 2.99
    const computed = pricePer100g(originalPrice, PER_DOZEN)
    const recovered = computed / PER_DOZEN
    expect(approxEqual(recovered, originalPrice, 0.001)).toBe(true)
  })
})

describe('CATEGORY_FALLBACKS sanity checks', () => {
  // These are the USDA category fallback prices from seed-prices.ts
  // Verify they're in a plausible range ($0.01 – $3.00 per 100g)
  const CATEGORY_FALLBACKS = [
    { foodGroup: 'Beef Products',                     pricePer100g: 0.88 },
    { foodGroup: 'Pork Products',                     pricePer100g: 0.66 },
    { foodGroup: 'Poultry Products',                  pricePer100g: 0.44 },
    { foodGroup: 'Lamb, Veal, and Game Products',     pricePer100g: 1.10 },
    { foodGroup: 'Finfish and Shellfish Products',    pricePer100g: 1.10 },
    { foodGroup: 'Dairy and Egg Products',            pricePer100g: 0.28 },
    { foodGroup: 'Cereal Grains and Pasta',           pricePer100g: 0.11 },
    { foodGroup: 'Beverages',                         pricePer100g: 0.06 },
    { foodGroup: 'Spices and Herbs',                  pricePer100g: 1.65 },
  ]

  it('all category fallback prices are positive', () => {
    for (const cat of CATEGORY_FALLBACKS) {
      expect(cat.pricePer100g, `${cat.foodGroup} price should be positive`).toBeGreaterThan(0)
    }
  })

  it('all category fallback prices are in plausible range ($0.01–$3.00/100g)', () => {
    for (const cat of CATEGORY_FALLBACKS) {
      expect(cat.pricePer100g, `${cat.foodGroup} price too low`).toBeGreaterThanOrEqual(0.01)
      expect(cat.pricePer100g, `${cat.foodGroup} price too high`).toBeLessThanOrEqual(3.00)
    }
  })

  it('protein foods are more expensive than grains (general plausibility)', () => {
    const beef = CATEGORY_FALLBACKS.find((c) => c.foodGroup === 'Beef Products')!
    const grains = CATEGORY_FALLBACKS.find((c) => c.foodGroup === 'Cereal Grains and Pasta')!
    expect(beef.pricePer100g).toBeGreaterThan(grains.pricePer100g)
  })
})
