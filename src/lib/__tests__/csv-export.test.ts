import { describe, it, expect } from 'vitest'
import { exportToCSV, getCSVFilename } from '../csv-export'
import type { FoodComputed } from '@/types/food'
import type { ColumnKey } from '@/types/table'

function makeFood(overrides: Partial<FoodComputed> = {}): FoodComputed {
  return {
    id: 'test-id',
    fdcId: 12345,
    name: 'Test Food',
    foodGroup: 'Test Group',
    foodSubgroup: null,
    dataSource: 'foundation',
    servingSizeG: '100',
    servingUnit: 'g',
    description: null,
    caloriesPer100g: '200',
    proteinPer100g: '25',
    fatPer100g: '5',
    carbsPer100g: '10',
    fiberPer100g: '2',
    sugarPer100g: '1',
    sodiumPer100g: '50',
    calciumPer100g: '10',
    ironPer100g: '1',
    pricePer100g: '0.44',
    priceSource: 'bls',
    proteinPerDollar: '56.8',
    imageUrl: null,
    thumbnailUrl: null,
    ...overrides,
  }
}

const DEFAULT_COLS: ColumnKey[] = ['name', 'caloriesPer100g', 'proteinPer100g', 'fatPer100g', 'carbsPer100g', 'foodGroup']

describe('exportToCSV', () => {
  it('returns a Blob', () => {
    const blob = exportToCSV([makeFood()], DEFAULT_COLS)
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('text/csv;charset=utf-8;')
  })

  it('first row is headers matching column order', async () => {
    const blob = exportToCSV([makeFood()], DEFAULT_COLS)
    const text = await blob.text()
    const lines = text.split('\n')
    expect(lines[0]).toBe('Name,Calories (kcal/100g),Protein (g/100g),Fat (g/100g),Carbs (g/100g),Food Group')
  })

  it('data row contains correct values', async () => {
    const blob = exportToCSV([makeFood()], DEFAULT_COLS)
    const text = await blob.text()
    const lines = text.split('\n')
    expect(lines[1]).toBe('Test Food,200,25,5,10,Test Group')
  })

  it('empty rows produce only header line', async () => {
    const blob = exportToCSV([], DEFAULT_COLS)
    const text = await blob.text()
    const lines = text.split('\n')
    expect(lines).toHaveLength(1)
    expect(lines[0]).toContain('Name')
  })

  it('produces correct number of data rows', async () => {
    const foods = [makeFood({ name: 'Food A' }), makeFood({ name: 'Food B' }), makeFood({ name: 'Food C' })]
    const blob = exportToCSV(foods, ['name'])
    const text = await blob.text()
    const lines = text.split('\n')
    expect(lines).toHaveLength(4) // header + 3 rows
  })

  it('wraps values containing commas in double quotes', async () => {
    const food = makeFood({ name: 'Beef, ground' })
    const blob = exportToCSV([food], ['name'])
    const text = await blob.text()
    const lines = text.split('\n')
    expect(lines[1]).toBe('"Beef, ground"')
  })

  it('escapes double quotes inside values', async () => {
    const food = makeFood({ name: 'So-called "natural" food' })
    const blob = exportToCSV([food], ['name'])
    const text = await blob.text()
    const lines = text.split('\n')
    expect(lines[1]).toBe('"So-called ""natural"" food"')
  })

  it('wraps values containing newlines in double quotes', async () => {
    const food = makeFood({ name: 'Food\nwith newline' })
    const blob = exportToCSV([food], ['name'])
    const text = await blob.text()
    // The value itself contains a newline, so we check the full output
    expect(text).toContain('"Food\nwith newline"')
  })

  it('wraps values containing carriage returns in double quotes', async () => {
    const food = makeFood({ name: 'Food\rwith CR' })
    const blob = exportToCSV([food], ['name'])
    const text = await blob.text()
    expect(text).toContain('"Food\rwith CR"')
  })

  it('renders null values as empty string', async () => {
    const food = makeFood({ pricePer100g: null })
    const blob = exportToCSV([food], ['name', 'pricePer100g'])
    const text = await blob.text()
    const lines = text.split('\n')
    expect(lines[1]).toBe('Test Food,')
  })

  it('handles single column export', async () => {
    const blob = exportToCSV([makeFood()], ['name'])
    const text = await blob.text()
    const lines = text.split('\n')
    expect(lines[0]).toBe('Name')
    expect(lines[1]).toBe('Test Food')
  })

  it('includes all 13 column keys in headers when specified', async () => {
    const allCols: ColumnKey[] = [
      'name', 'foodGroup', 'caloriesPer100g', 'proteinPer100g', 'fatPer100g',
      'carbsPer100g', 'fiberPer100g', 'sugarPer100g', 'sodiumPer100g',
      'pricePer100g', 'proteinPerDollar', 'servingSizeG', 'dataSource',
    ]
    const blob = exportToCSV([makeFood()], allCols)
    const text = await blob.text()
    const headerLine = text.split('\n')[0]
    const headers = headerLine.split(',')
    expect(headers).toHaveLength(13)
    expect(headers[0]).toBe('Name')
    expect(headers[headers.length - 1]).toBe('Data Source')
  })
})

describe('getCSVFilename', () => {
  it('returns a string ending in .csv', () => {
    const name = getCSVFilename()
    expect(name).toMatch(/\.csv$/)
  })

  it('includes munch-metrics-export prefix', () => {
    const name = getCSVFilename()
    expect(name).toMatch(/^munch-metrics-export-/)
  })

  it('includes a date in YYYY-MM-DD format', () => {
    const name = getCSVFilename()
    expect(name).toMatch(/\d{4}-\d{2}-\d{2}/)
  })

  it('uses today\'s date', () => {
    const today = new Date().toISOString().slice(0, 10)
    const name = getCSVFilename()
    expect(name).toContain(today)
  })
})
