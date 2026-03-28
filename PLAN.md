# Munch Metrics — Product & Technical Plan

## 1. Product Overview

**Munch Metrics** is a free, web-based food intelligence tool that lets users search, filter, sort, and group a comprehensive nutritional database using custom metrics. It targets health-conscious individuals, meal planners, and fitness enthusiasts who want data-driven food decisions — not just calorie counts.

**Primary Goals:**
- Portfolio-quality application showcasing advanced data querying, design systems, and full-stack engineering
- Real product aiming for organic user adoption
- Free forever, no monetization

**Core Value Proposition:** Users build complex, multi-dimensional views of nutritional data — sort by protein-per-dollar, group by food category, filter by "vegan + no soy + high iron" — and everything resolves dynamically against a server-side database. The query engine itself is the product.

---

## 2. Tech Stack

| Layer | Technology | Version / Notes |
|---|---|---|
| Framework | Next.js (App Router) | Latest stable (15.x+) |
| Language | TypeScript | Strict mode |
| UI Library | shadcn/ui | Latest, with Tailwind CSS v4 |
| Data Table | TanStack Table v8 | Headless, server-side mode |
| Database | PostgreSQL 16 (self-hosted) | Oracle Cloud Always Free VM |
| ORM | Drizzle ORM | Type-safe queries, migrations |
| Auth | Supabase Auth | Email + Google OAuth (auth-only, no DB) |
| Image Source | Unsplash API | Free tier (50 req/hr), cached |
| Food Data API | USDA FoodData Central | Free, CC0 license |
| Price Data API | BLS Average Price (v2) | Free, registration required |
| Deployment | Vercel | Free tier to start |
| Testing | Vitest + msw (Mock Service Worker) | Unit + integration tests |
| Package Manager | pnpm | Latest |

---

## 3. Architecture

### 3.1 High-Level Data Flow

```
User Browser (Next.js Client)
    ↕ (Server Actions / API Routes)
Next.js Server (Vercel Edge/Serverless)
    ↕ (Drizzle ORM / raw SQL)
PostgreSQL 16 (Oracle Cloud VM)
    ↕ (Seeded/synced from)
USDA FoodData Central API  ← nutrition data (quarterly)
BLS Average Price API      ← real food prices (monthly)

Supabase (Auth only)       ← email magic link + Google OAuth
```

### 3.2 Data Strategy

**Primary Source:** USDA FoodData Central (Phase 1)
- Bulk import Foundation Foods + SR Legacy datasets into Postgres on initial seed
- Store normalized nutrient data in relational tables
- Quarterly refresh via scheduled seed script (USDA updates quarterly)
- ~8,000 Foundation/SR Legacy foods with full micronutrient profiles for MVP

**Secondary Source:** Open Food Facts (Phase 2 — post-MVP)
- Adds branded/barcode products (3M+ items)
- Product images, allergens, additives, NOVA processing scores
- Merged into same Postgres schema with source flag

**Price Data:** BLS Average Price Data API (primary) + USDA category estimates (fallback)
- **BLS Average Price series** provides real dollar prices per standard unit (per lb, per gallon, per dozen) for ~60-80 specific food items (ground beef, chicken breast, eggs, milk, rice, bread, etc.)
- Updated monthly by the Bureau of Labor Statistics — significantly fresher than annual USDA data
- BLS API v2 (free registration): up to 50 series per request, 500 queries/day, 20 years of history
- Regional pricing available (U.S. city average + regional breakdowns)
- Prices are narrowly defined to minimize quality differences (e.g., "Rice, white, long grain, uncooked" not just "rice")
- **Fallback:** USDA "Purchase to Plate" crosswalk for foods without a BLS match — mapped at food group/subgroup level (e.g., "poultry avg $/lb")
- Stored in `price_data` table with source flag (`bls_average_price` vs `usda_category_estimate`)
- BLS series IDs mapped to USDA food items via a manual crosswalk table (~60-80 mappings)
- Seed script fetches latest BLS prices on initial load; monthly refresh via cron or manual re-run
- Enables computed metrics: calories-per-dollar, protein-per-dollar — with real prices for common foods and estimates for the rest

**Image Strategy:**
- On first request for a food, query Unsplash API with the food's description
- Cache the returned image URL + thumbnail in `food_images` table in Postgres
- Fallback: category-level placeholder icons (e.g., generic protein, grain, vegetable icon)
- Unsplash free tier: 50 requests/hour — aggressive caching is mandatory
- Images are fetched server-side (Next.js API route) to hide API key and enforce cache-first

### 3.3 Caching Architecture

All USDA data is imported into Postgres — there are no runtime calls to the USDA API during normal user interactions. The flow is:

1. **Seed script** (runs once, then quarterly): Fetches USDA data via their API, transforms it, bulk-inserts into Postgres via Drizzle
2. **User queries** hit Postgres directly via Drizzle ORM queries in Next.js server actions
3. **Image URLs** are cached in Postgres after first Unsplash lookup
4. **Price estimates** are static imports, updated manually when USDA publishes new data

### 3.4 Oracle Cloud PostgreSQL Provisioning

**VM Setup (Always Free Tier):**
1. Create an Oracle Cloud account (Always Free tier — no credit card charge)
2. Launch a VM instance: `VM.Standard.A1.Flex` (ARM, 1 OCPU / 6 GB RAM is plenty for this workload)
3. Use Ubuntu 22.04 or 24.04 as the OS image
4. Generate and download the SSH key pair during creation

**PostgreSQL Installation:**
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y postgresql-16 postgresql-contrib-16
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

**Database & User Setup:**
```bash
sudo -u postgres psql
CREATE DATABASE munch_metrics;
CREATE USER munch_app WITH ENCRYPTED PASSWORD '<strong-password>';
GRANT ALL PRIVILEGES ON DATABASE munch_metrics TO munch_app;
\c munch_metrics
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- needed for fuzzy search
```

**Network / Firewall:**
1. In Oracle Cloud Console → Networking → Virtual Cloud Networks → Security Lists: add an Ingress Rule allowing TCP port `5432` from Vercel's IP ranges (or `0.0.0.0/0` if using SSL auth only)
2. On the VM itself:
```bash
sudo ufw allow 5432/tcp
```
3. Edit `postgresql.conf`:
```
listen_addresses = '*'
```
4. Edit `pg_hba.conf` — allow remote connections with password + SSL:
```
hostssl  munch_metrics  munch_app  0.0.0.0/0  scram-sha-256
```

**SSL Setup (required for remote connections from Vercel):**
- Use Let's Encrypt or a self-signed cert for Postgres SSL
- Point `ssl_cert_file` and `ssl_key_file` in `postgresql.conf`
- Connection string uses `?sslmode=require`

**Backups:**
```bash
# Cron job: daily pg_dump to a local file, rotate 7 days
0 3 * * * pg_dump -U munch_app munch_metrics | gzip > /backups/munch_$(date +\%A).sql.gz
```

**Connection Pooling:**
- The `pg` (node-postgres) pool in Drizzle handles connection pooling at the app level
- Default pool size of 10 is fine for this workload
- If connection count becomes an issue under load, install PgBouncer on the VM

---

## 4. Database Schema

### 4.1 Core Tables

```
foods
├── id (uuid, PK)
├── fdc_id (integer, unique) — USDA FoodData Central ID
├── name (text, indexed)
├── food_group (text, indexed) — e.g., "Poultry", "Vegetables", "Legumes"
├── food_subgroup (text, indexed)
├── data_source (enum: 'usda_foundation', 'usda_sr_legacy', 'open_food_facts')
├── serving_size_g (numeric)
├── serving_unit (text)
├── description (text) — full USDA description
├── created_at (timestamptz)
└── updated_at (timestamptz)

nutrients
├── id (uuid, PK)
├── food_id (uuid, FK → foods.id, indexed)
├── nutrient_name (text) — e.g., "Protein", "Vitamin C", "Iron"
├── nutrient_category (enum: 'macro', 'vitamin', 'mineral', 'amino_acid', 'fatty_acid', 'other')
├── amount (numeric)
├── unit (text) — e.g., "g", "mg", "µg", "kcal"
└── per_100g (numeric) — normalized value per 100g

price_data
├── id (uuid, PK)
├── food_id (uuid, FK → foods.id, nullable, indexed) — set for BLS item-level matches
├── food_group (text, indexed) — set for USDA category-level fallbacks
├── bls_series_id (text, nullable) — e.g., "APU0000FF1101" (eggs, grade A, per dozen)
├── price_per_unit (numeric) — in USD
├── unit (text) — e.g., "per lb", "per gallon", "per dozen", "per 100g"
├── price_per_100g (numeric) — normalized for computed metrics
├── source (enum: 'bls_average_price', 'usda_category_estimate')
├── period (text) — e.g., "2026-M02" (BLS monthly period)
├── region (text, default 'US city average')
└── updated_at (timestamptz)

bls_food_crosswalk
├── id (uuid, PK)
├── bls_series_id (text, unique) — BLS AP series ID
├── bls_item_name (text) — e.g., "Eggs, grade A, large, per doz."
├── food_id (uuid, FK → foods.id) — matched USDA food
├── unit_conversion_factor (numeric) — converts BLS unit to price_per_100g
└── notes (text, nullable) — mapping notes

food_images
├── id (uuid, PK)
├── food_id (uuid, FK → foods.id, unique)
├── image_url (text)
├── thumbnail_url (text)
├── source (enum: 'unsplash', 'open_food_facts', 'placeholder')
├── photographer_name (text, nullable) — Unsplash attribution
├── photographer_url (text, nullable)
└── fetched_at (timestamptz)

food_tags
├── id (uuid, PK)
├── food_id (uuid, FK → foods.id, indexed)
├── tag_type (enum: 'dietary', 'allergen', 'additive', 'processing')
└── tag_value (text, indexed) — e.g., "vegan", "gluten-free", "contains_soy", "BHA"
```

### 4.2 User Tables (for authenticated features)

```
user_preferences
├── id (uuid, PK)
├── user_id (text, unique) — Supabase Auth user ID (not a FK — lives in separate system)
├── dietary_profile (jsonb) — e.g., {"vegan": true, "gluten_free": true}
├── excluded_foods (uuid[]) — array of food IDs user doesn't like
├── default_columns (text[]) — saved column selection
├── accent_color (text, nullable) — hex color for custom theme
└── updated_at (timestamptz)

saved_views
├── id (uuid, PK)
├── user_id (text, nullable) — Supabase Auth user ID; null for shared-via-URL views
├── name (text)
├── config_json (jsonb) — full serialized table state (filters, sorts, groups, columns)
├── share_slug (text, unique, indexed) — short ID for URL sharing
└── created_at (timestamptz)
```

### 4.3 Computed Views / Query Functions

Create a PostgreSQL view or materialized view for the main query surface:

```sql
CREATE VIEW food_computed AS
SELECT
  f.id,
  f.name,
  f.food_group,
  f.food_subgroup,
  f.serving_size_g,
  f.description,
  fi.thumbnail_url,
  -- Macros (pulled from nutrients table)
  MAX(CASE WHEN n.nutrient_name = 'Energy' THEN n.per_100g END) AS calories_per_100g,
  MAX(CASE WHEN n.nutrient_name = 'Protein' THEN n.per_100g END) AS protein_per_100g,
  MAX(CASE WHEN n.nutrient_name = 'Total lipid (fat)' THEN n.per_100g END) AS fat_per_100g,
  MAX(CASE WHEN n.nutrient_name = 'Carbohydrate, by difference' THEN n.per_100g END) AS carbs_per_100g,
  MAX(CASE WHEN n.nutrient_name = 'Fiber, total dietary' THEN n.per_100g END) AS fiber_per_100g,
  -- Price-derived metrics (BLS item-level preferred, USDA category fallback)
  COALESCE(pd_item.price_per_100g, pd_group.price_per_100g) AS price_per_100g,
  COALESCE(pd_item.source, pd_group.source) AS price_source,
  CASE WHEN COALESCE(pd_item.price_per_100g, pd_group.price_per_100g) > 0
    THEN MAX(CASE WHEN n.nutrient_name = 'Energy' THEN n.per_100g END)
         / COALESCE(pd_item.price_per_100g, pd_group.price_per_100g)
    ELSE NULL
  END AS calories_per_dollar,
  CASE WHEN COALESCE(pd_item.price_per_100g, pd_group.price_per_100g) > 0
    THEN MAX(CASE WHEN n.nutrient_name = 'Protein' THEN n.per_100g END)
         / COALESCE(pd_item.price_per_100g, pd_group.price_per_100g)
    ELSE NULL
  END AS protein_per_dollar
FROM foods f
LEFT JOIN nutrients n ON n.food_id = f.id
LEFT JOIN food_images fi ON fi.food_id = f.id
LEFT JOIN price_data pd_item ON pd_item.food_id = f.id AND pd_item.source = 'bls_average_price'
LEFT JOIN price_data pd_group ON pd_group.food_group = f.food_group AND pd_group.source = 'usda_category_estimate' AND pd_group.food_id IS NULL
GROUP BY f.id, f.name, f.food_group, f.food_subgroup, f.serving_size_g,
         f.description, fi.thumbnail_url,
         pd_item.price_per_100g, pd_item.source,
         pd_group.price_per_100g, pd_group.source;
```

Create Drizzle query functions (in `src/lib/queries/`) for:
- `searchFoods(query, filters, sortBy, sortDir, groupBy, page, pageSize)` — main query endpoint using Drizzle's query builder against `food_computed` view
- `getFoodDetail(foodId)` — returns full nutrient profile for a single food
- `getFilterOptions()` — returns distinct values for food_group, dietary tags, etc. for populating filter UI

For complex queries that exceed Drizzle's query builder (e.g., dynamic GROUP BY with aggregation), use Drizzle's `sql` template tag for raw SQL with type safety.

### 4.4 Indexing Strategy

```sql
CREATE INDEX idx_foods_name_trgm ON foods USING gin (name gin_trgm_ops); -- fuzzy search
CREATE INDEX idx_foods_food_group ON foods (food_group);
CREATE INDEX idx_nutrients_food_id ON nutrients (food_id);
CREATE INDEX idx_nutrients_name ON nutrients (nutrient_name);
CREATE INDEX idx_food_tags_composite ON food_tags (tag_type, tag_value);
CREATE INDEX idx_food_tags_food_id ON food_tags (food_id);
```

Enable the `pg_trgm` extension in PostgreSQL for fuzzy text search:
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

---

## 5. Application Structure

```
munch-metrics/
├── public/
│   ├── icons/              # Food category placeholder icons
│   └── og-image.png        # Social share image
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Root layout — theme provider, fonts
│   │   ├── page.tsx        # Landing / main table view
│   │   ├── globals.css     # Tailwind base + CSS custom properties for accent colors
│   │   └── api/
│   │       └── images/
│   │           └── [foodId]/
│   │               └── route.ts  # Proxied Unsplash lookup + cache
│   ├── components/
│   │   ├── ui/             # shadcn/ui components (button, dialog, popover, etc.)
│   │   ├── table/
│   │   │   ├── data-table.tsx         # Main TanStack Table wrapper
│   │   │   ├── columns.tsx            # Column definitions
│   │   │   ├── column-picker.tsx      # Toggle which columns are visible
│   │   │   ├── filter-bar.tsx         # Search input + active filter chips
│   │   │   ├── filter-panel.tsx       # Sidebar/drawer with all filter controls
│   │   │   ├── group-selector.tsx     # Pick which property to group by
│   │   │   ├── sort-indicator.tsx     # Visual sort direction on column headers
│   │   │   ├── mobile-row.tsx         # Collapsible summary row for mobile
│   │   │   └── export-csv.tsx         # CSV export button + logic
│   │   ├── food/
│   │   │   ├── food-image.tsx         # Image with fallback + Unsplash attribution
│   │   │   └── food-detail-modal.tsx  # Full nutrient breakdown modal
│   │   ├── filters/
│   │   │   ├── dietary-filter.tsx     # Diet restriction checkboxes + profiles
│   │   │   ├── additive-filter.tsx    # Additive inclusion/exclusion
│   │   │   ├── nutrient-range.tsx     # Min/max sliders for nutrient values
│   │   │   └── tag-filter.tsx         # Free-form tag combination
│   │   ├── theme/
│   │   │   ├── theme-provider.tsx     # System/light/dark + accent color context
│   │   │   ├── theme-toggle.tsx       # Mode switcher
│   │   │   └── accent-picker.tsx      # Accent color selector
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   └── mobile-nav.tsx
│   │   ├── landing/
│   │   │   ├── hero.tsx              # Hero section with tagline + CTAs
│   │   │   ├── how-it-works.tsx      # 3-step feature explanation
│   │   │   ├── stats-bar.tsx         # Animated counter stats strip
│   │   │   └── scroll-transition.tsx # Visual transition into table section
│   │   └── tutorial/
│   │       ├── tutorial-modal.tsx     # Multi-step tutorial container
│   │       ├── tutorial-step.tsx      # Individual step with animation
│   │       ├── animations/
│   │       │   ├── search-anim.tsx    # Animated search bar typing demo
│   │       │   ├── filter-anim.tsx    # Filter panel toggle demo
│   │       │   ├── sort-anim.tsx      # Column sort demo
│   │       │   ├── group-anim.tsx     # Group-by demo
│   │       │   ├── columns-anim.tsx   # Column picker demo
│   │       │   └── export-anim.tsx    # Export/share demo
│   │       └── tutorial-trigger.tsx   # Floating help button + first-visit prompt
│   ├── hooks/
│   │   ├── use-food-query.ts          # Main data fetching hook (server actions)
│   │   ├── use-url-state.ts           # Sync table state ↔ URL params
│   │   ├── use-debounce.ts
│   │   └── use-media-query.ts
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts               # Drizzle client (node-postgres pool + drizzle wrapper)
│   │   │   ├── schema.ts              # Drizzle table definitions (foods, nutrients, price_data, etc.)
│   │   │   └── migrate.ts             # Migration runner
│   │   ├── auth/
│   │   │   ├── client.ts              # Browser Supabase Auth client (auth-only)
│   │   │   └── server.ts              # Server-side Supabase Auth client (session verification)
│   │   ├── queries/
│   │   │   ├── search-foods.ts        # Server action: Drizzle query against food_computed view
│   │   │   ├── get-food-detail.ts
│   │   │   └── get-filter-options.ts
│   │   ├── url-state.ts               # Serialize/deserialize table state to URL
│   │   ├── csv-export.ts              # Transform table data → CSV blob
│   │   ├── constants.ts               # Nutrient names, units, diet profiles
│   │   └── utils.ts
│   └── types/
│       ├── food.ts
│       ├── filters.ts
│       └── table.ts
├── scripts/
│   ├── seed-usda.ts                   # Fetch USDA data → insert into Postgres via Drizzle
│   ├── seed-prices.ts                 # Fetch BLS avg prices + USDA category fallbacks
│   ├── bls-crosswalk.ts               # BLS series ID → USDA food ID mapping table
│   └── seed-tags.ts                   # Derive dietary/allergen tags from nutrient data
├── tests/
│   └── integration/
│       ├── seed-usda.test.ts
│       ├── seed-prices.test.ts
│       ├── query-search.test.ts
│       └── image-proxy.test.ts
├── drizzle/
│   └── migrations/                    # Drizzle-generated SQL migrations
├── drizzle.config.ts                  # Drizzle Kit config
├── .env.local.example
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
├── package.json
└── plan.md
```

---

## 6. Feature Specifications

### 6.1 Landing Page (Above the Table)

The homepage is a single scrollable page: landing content on top, the full table tool below.

**Section 1: Hero**
- Bold headline/tagline (e.g., "Every nutrient. Every food. One table.")
- 1-2 sentence subheadline explaining the value proposition
- Primary CTA button: "Explore Foods" — smooth-scrolls to the table section
- Secondary CTA: "See How It Works" — opens the tutorial modal
- Visually striking: consider a subtle animated background or food-themed illustration

**Section 2: How It Works (3 steps)**
- Three columns/cards with icons + short descriptions:
  1. **Search** — "Find any food from 8,000+ whole foods and ingredients"
  2. **Filter** — "Apply dietary restrictions, nutrient ranges, and custom metrics"
  3. **Discover** — "Sort by protein-per-dollar, group by category, export your results"
- Each step has a subtle icon or micro-illustration (not stock photos)

**Section 3: Stats Bar**
- Horizontal strip with key numbers, styled as large bold counters:
  - "8,000+ Foods" | "40+ Nutrients" | "Monthly Price Data" | "100% Free"
- Optionally animate counters on scroll-into-view (count-up effect)

**Section 4: Interactive Tutorial Modal**
- Triggered by "See How It Works" CTA or a floating help button (persistent, bottom-right)
- Multi-step modal (5-6 steps) with Previous/Next navigation and step dots
- Each step:
  1. Brief instruction text (1-2 sentences)
  2. Dynamic animation showing the described action on a miniature UI mockup
  3. The animation is NOT a video or GIF — it's a live animated React component that simulates the interaction
- Steps:
  1. **Search** — animated search bar typing "chicken" with autocomplete dropdown appearing
  2. **Filter** — filter panel slides open, checkboxes animate toggling on, filter chips appear above table
  3. **Sort** — column header clicks, arrow indicator animates, rows visually reorder
  4. **Group** — group-by dropdown selects "Food Group", rows animate into collapsible groups
  5. **Customize Columns** — column picker opens, columns toggle on/off, table width adjusts
  6. **Export & Share** — CSV download button pulses, URL copies to clipboard with toast notification
- "Got it" / "Skip" button to dismiss at any time
- First-time visitors see a subtle prompt to open the tutorial (dismissable, stored in localStorage)
- Tutorial state (dismissed/not) stored in localStorage for anonymous users, `user_preferences` for authenticated

**Scroll Transition:** Smooth visual transition from landing content into the table section — consider a subtle gradient fade or a "dive in" scroll-triggered animation.

### 6.2 Main Table View (MVP Core)

The primary UI is a single-page application centered on a data table.

**Search Bar:**
- Positioned above the table, full-width
- Instant filter-as-you-type with debounce (300ms)
- Dropdown autocomplete suggestions from Postgres fuzzy search (`pg_trgm`)
- Selecting a suggestion applies it as a text filter; pressing Enter applies the typed text
- Clear button to reset search

**Table Columns:**
- Default visible columns: Image (thumbnail), Name, Calories, Protein, Fat, Carbs, Food Group
- All available columns: Image, Name, Food Group, Serving Size, Calories, Protein, Fat, Carbs, Fiber, all vitamins, all minerals, Avg Price/100g, Calories/Dollar, Protein/Dollar
- Column picker (button above table) opens a popover/dialog with checkboxes for each available column
- Columns are resizable by dragging column borders
- Column visibility persisted in URL state

**Sorting:**
- Click column header to sort ascending → descending → none
- Visual indicator (arrow) on sorted column
- Multi-sort NOT in MVP (single-column sort only)
- Sort state serialized to URL

**Grouping:**
- Dropdown selector above table: "Group by: [None | Food Group | any column]"
- When active, rows are visually grouped with a collapsible group header row
- Group headers show count and can be expanded/collapsed
- Grouping is done server-side via Drizzle queries (ORDER BY group column, then client renders group boundaries)
- Group state serialized to URL

**Filtering:**
- Filter bar below search shows active filters as removable chips/tags
- "Add Filter" button opens the filter panel (sidebar drawer on desktop, bottom sheet on mobile)
- Filter panel contains:
  - **Dietary Restrictions (Presets with Editable Thresholds):**
    - Dropdown of preset diet profiles: Vegan, Vegetarian, Pescatarian, Keto, Paleo, Gluten-Free, Dairy-Free, Nut-Free, Low-Sodium, High-Protein
    - Selecting a preset auto-populates a set of filter rules with default thresholds:
      - **Keto:** Carbs < 10g/100g, Fat > 15g/100g, excludes grains/legumes/sugar food groups
      - **Vegan:** Excludes all animal-derived food groups (meat, poultry, fish, dairy, eggs)
      - **High-Protein:** Protein > 20g/100g
      - **Low-Sodium:** Sodium < 140mg/100g
      - (Full preset definitions stored in `src/lib/constants.ts`)
    - After a preset loads, the user can **edit any threshold** (slider or number input) or **toggle individual rules** on/off
    - Users can also build filters from scratch without selecting a preset (free-form tag + range combination)
    - Active preset name shown as a chip (e.g., "Keto (modified)") if user has changed any thresholds
  - **Additive Filters:** Multi-select for common additives to exclude (BHA, BHT, MSG, artificial sweeteners, artificial colors, etc.)
  - **Nutrient Range Filters:** Min/max sliders or number inputs for any nutrient (e.g., "Protein > 20g per 100g", "Sodium < 500mg")
  - **Food Group Filter:** Multi-select checkboxes for USDA food groups
- All filters serialized to URL params

**Pagination:**
- Server-side pagination, 50 rows per page default
- Page size selector (25, 50, 100)
- "Showing X-Y of Z results" indicator
- Previous/Next buttons + page number display

**CSV Export:**
- Button in table toolbar
- Exports current filtered/sorted view (not all data)
- Respects visible columns only
- Downloads as `munch-metrics-export-YYYY-MM-DD.csv`

### 6.3 Mobile Layout

- Screen width < 768px: table switches to collapsible row mode
- Each food shows as a summary card: Image (small), Name, Food Group, Calories, Protein
- Tapping a row expands it to show all visible columns as a key-value list
- Filter panel opens as a bottom sheet
- Column picker remains accessible but suggests a mobile-friendly default set (fewer columns)

### 6.4 Food Detail Modal

- Clicking a food name opens a modal/dialog with full detail
- Shows: large image, full name, description, serving size, complete nutrient breakdown organized by category (Macros → Vitamins → Minerals → Amino Acids → Fatty Acids)
- Each nutrient shows amount, unit, and % Daily Value where applicable
- Price estimate displayed if available
- Computed metrics shown (cal/$, protein/$)
- Unsplash photo attribution link displayed below image

### 6.5 Theme System

- **Mode:** System default detection on first visit. Toggle between Light / Dark / System in header.
- **Accent Colors:** User can pick from a set of 8-10 predefined accent colors (e.g., blue, green, teal, orange, purple, rose). Selected accent applies to interactive elements (buttons, links, focus rings, active states).
- **Implementation:** CSS custom properties on `:root`. Accent color stored in localStorage for anonymous users, in `user_preferences` for authenticated users.
- **Decoupled pattern:** Color mode (light/dark) and accent color are independent. Any accent works with any mode.

### 6.6 URL State Sharing

The full table state is encoded in URL search params:

```
/? q=chicken
 & sort=protein_per_100g
 & dir=desc
 & group=food_group
 & cols=name,calories,protein,fat,protein_per_dollar
 & diet=vegan,gluten_free
 & pmin=20
 & page=1
```

- Copying the URL and sharing it reproduces the exact same view
- A "Copy Link" button in the toolbar copies the current URL to clipboard
- Param encoding uses short keys to keep URLs manageable

### 6.7 Authentication (Lightweight)

- All browsing, searching, filtering is anonymous — no login required
- "Sign in" button in header (Supabase Auth — auth-only client: email magic link + Google OAuth)
- Authenticated users get:
  - Saved column preferences that persist across sessions
  - Saved dietary profile (auto-applied filters)
  - Food exclusion list ("I don't like these")
  - Saved accent color preference
- Auth state managed via Supabase Auth client-side session (Supabase JS SDK, auth-only — no data queries through Supabase)
- User data stored in self-hosted Postgres: `user_preferences` and `saved_views` tables use Supabase Auth `user.id` as a text key (not a FK, since auth lives in a separate system)
- Access control enforced at the Next.js server action layer (verify Supabase session → scope Drizzle queries by user_id)

---

## 7. Seed Scripts

### 7.1 USDA Data Seed (`scripts/seed-usda.ts`)

1. Fetch the USDA FoodData Central "Foundation Foods" and "SR Legacy" datasets via the FDC API (`/v1/foods/list` endpoint, paginated, 200 items/page)
2. For each food:
   a. Insert into `foods` table via Drizzle (name, fdc_id, food_group, serving_size, description)
   b. For each nutrient in the food's nutrient array: insert into `nutrients` table via Drizzle (nutrient_name, amount, unit, per_100g, nutrient_category)
3. Derive dietary tags:
   - Parse nutrient data to infer tags (e.g., if a food has 0g of animal-derived nutrients and is in a plant food group → tag as "vegan candidate")
   - Note: USDA doesn't label foods as "vegan" or "gluten-free" — this requires a mapping/heuristic layer
4. Rate limiting: stay under 1,000 requests/hour. Use delays between pages.
5. Total: ~8,000 Foundation + SR Legacy foods. Branded Foods dataset is much larger (300K+) and deferred to Phase 2.

### 7.2 Price Data Seed (`scripts/seed-prices.ts`)

**Step 1: BLS Average Price data (item-level)**
1. Reference `scripts/bls-crosswalk.ts` — a manually curated mapping of ~60-80 BLS Average Price series IDs to USDA food IDs (e.g., `APU0000FF1101` "Eggs, grade A, large, per doz." → USDA FDC ID for "Egg, whole, raw")
2. Use BLS API v2 (`https://api.bls.gov/publicAPI/v2/timeseries/data/`) to fetch latest prices for all mapped series (batch up to 50 series per request)
3. Convert BLS unit prices to price_per_100g using the conversion factors in the crosswalk (e.g., eggs at $X/dozen → $Y per 100g using avg egg weight of 50g)
4. Insert into `price_data` table with `source = 'bls_average_price'`, linked to specific `food_id`
5. Store the BLS period (e.g., "2026-M02") for freshness tracking

**Step 2: USDA category fallback**
1. Download USDA "Purchase to Plate" crosswalk CSV
2. Parse and insert into `price_data` table with `source = 'usda_category_estimate'`, linked by `food_group` (no `food_id`)
3. These serve as fallback prices for the ~7,900 foods without a direct BLS match

**Refresh strategy:** Re-run BLS fetch monthly (data published monthly). USDA category data updated annually.

### 7.3 Tag Derivation (`scripts/seed-tags.ts`)

1. After foods and nutrients are seeded, run heuristics to generate `food_tags`:
   - **Dietary:** Map food groups and nutrient profiles to dietary categories (vegan, vegetarian, pescatarian, keto-friendly based on carb content, etc.)
   - **Allergen:** USDA data includes some allergen info — extract and normalize
   - **Processing:** Classify based on food group and description (whole food vs. processed)
2. This is best-effort for MVP. Phase 2 (Open Food Facts) will add verified allergen/additive data.

---

## 8. Phases & Milestones

### Phase 1: MVP (Current Scope)

**Milestone 1: Project Foundation**
- Next.js project scaffolding with TypeScript, pnpm, Tailwind, shadcn/ui
- Oracle Cloud VM provisioning (Always Free tier), PostgreSQL 16 install, firewall/SSL setup
- Drizzle ORM setup, schema definitions, initial migration
- Supabase project creation (auth-only — no database tables in Supabase)
- Theme system (light/dark/system + accent colors)
- Basic layout (header, footer, responsive shell)

**Milestone 2: Data Pipeline**
- USDA seed script (Foundation Foods + SR Legacy) via Drizzle bulk inserts
- BLS Average Price seed script with crosswalk mapping
- USDA category price fallback import
- Tag derivation script
- Drizzle query functions for search, filter, sort, group
- `food_computed` materialized view with indexes (raw SQL migration)
- Unsplash image proxy API route with caching

**Milestone 3: Core Table UI**
- TanStack Table integration with server-side data fetching
- Column definitions for all nutrient fields + computed metrics
- Column picker (visibility toggle)
- Column resizing
- Single-column sorting with visual indicators
- Server-side pagination
- Instant search with autocomplete dropdown
- Spinner overlay loading state

**Milestone 4: Filtering System**
- Filter bar with active filter chips
- Filter panel (drawer/sidebar)
- Dietary preset profiles with editable thresholds (keto, vegan, high-protein, etc.)
- Nutrient range filters (min/max sliders + number inputs)
- Food group multi-select
- Additive exclusion filters
- All filters encoded in URL state

**Milestone 5: Grouping, Export & Polish**
- Group-by selector for any column property
- Collapsible group headers with counts
- CSV export of current view
- URL state serialization (full round-trip)
- Copy link button
- Mobile collapsible row layout
- Food detail modal
- Unsplash image attribution

**Milestone 6: Landing Page & Tutorial**
- Hero section with tagline + CTAs
- "How it Works" 3-step section
- Animated stats bar with counters
- Scroll transition into table section
- Interactive tutorial modal (6 steps with animated React demos)
- Floating help button + first-visit prompt
- OG meta tags and social share image

**Milestone 7: Auth & Personalization**
- Supabase Auth (email magic link + Google OAuth) — auth-only integration
- Server action middleware to verify Supabase session and extract user_id
- User preferences stored in self-hosted Postgres (saved columns, dietary profile, accent color)
- Food exclusion list
- Preferences auto-apply on login

**Milestone 8: Testing & QA**
- Unit tests (url-state, csv-export, diet presets, price conversion)
- Integration tests (seed scripts, Drizzle query functions, image proxy)
- Vitest config + msw mocks for external APIs
- Responsive testing (mobile, tablet, desktop)
- Accessibility audit (keyboard nav, screen reader, ARIA on table)
- Performance optimization (< 500ms filter response, Lighthouse > 90)
- Error states and loading UX
- Vercel deployment with environment variables (DATABASE_URL pointing to Oracle Cloud Postgres)

### Phase 2: Post-MVP (Future)

- Open Food Facts integration (branded products, barcodes, product images, verified additives)
- Daily food logging (track what you eat, see micro coverage)
- Micronutrient gap analysis ("you're low on Vitamin D — here are foods that have it")
- Personalized recommendations (filtered by your dietary profile + exclusions, sorted by your priority metric)
- Comparison mode (select 2-3 foods side-by-side)
- Kroger API integration for real per-item pricing
- Android / iOS app (React Native or Expo — leverage existing RN experience)
- Multi-column sort
- Saved views (named filter configs stored server-side)

---

## 9. Testing Strategy

**Test Runner:** Vitest (fast, native ESM/TypeScript support, Jest-compatible API)

### Unit Tests (`__tests__/` co-located with source)
- `url-state.test.ts` — serialize/deserialize table state to URL params (round-trip)
- `csv-export.test.ts` — CSV generation from mock table data, column filtering, special characters
- `constants.test.ts` — dietary preset definitions produce valid filter configs
- `diet-presets.test.ts` — preset threshold logic (keto filters exclude correct food groups, etc.)
- `price-conversion.test.ts` — BLS unit price → price_per_100g conversion math

### Integration Tests (`tests/integration/`)
- `seed-usda.test.ts` — USDA seed script parses API response correctly, inserts valid rows
- `seed-prices.test.ts` — BLS API response parsing, crosswalk mapping, conversion factors
- `seed-tags.test.ts` — tag derivation heuristics produce expected tags for known foods
- `query-search.test.ts` — Drizzle `searchFoods` query returns correct results for filter/sort/group combos (run against a local Postgres via Docker)
- `query-detail.test.ts` — `getFoodDetail` returns full nutrient profile
- `image-proxy.test.ts` — Unsplash proxy route caches correctly, returns fallback on failure

### Test Infrastructure
- Use Vitest's `beforeAll` / `afterAll` for integration test setup/teardown
- Mock external APIs (USDA, BLS, Unsplash) in unit tests with `msw` (Mock Service Worker)
- Integration tests against a local PostgreSQL instance via Docker (`docker run -e POSTGRES_DB=munch_test postgres:16`)
- CI: run unit tests on every push, integration tests on PR to main

---

## 10. Performance Requirements

| Metric | Target | How to Achieve |
|---|---|---|
| Table filter/sort response | < 500ms | Proper Postgres indexes, materialized view, Drizzle prepared queries |
| Initial page load (LCP) | < 2.5s | Next.js SSR for landing, lazy-load table section |
| Search autocomplete | < 300ms | `pg_trgm` GIN index, debounced input (300ms) |
| Image load (cached) | < 200ms | Postgres-cached URLs, Next.js `<Image>` with blur placeholder |
| Image load (first fetch) | < 2s | Unsplash API call + cache write, spinner in placeholder |
| CSV export (500 rows) | < 1s | Client-side generation from already-fetched data |
| Lighthouse Performance | > 90 | Code splitting, font optimization, image lazy loading |

**Loading UX:**
- Spinner overlay on the table during re-fetch (semi-transparent overlay, keeps table layout stable)
- Skeleton shimmer on initial page load (before any data exists)
- Optimistic URL updates — URL params update immediately on filter change, data follows

**Bundle Optimization:**
- TanStack Table is tree-shakeable — only import used features
- shadcn/ui components are copy-pasted source, not a monolithic package — no unused component bloat
- Dynamic import for filter panel, column picker, food detail modal, tutorial modal (not needed on initial render)
- Next.js `next/font` for zero-layout-shift font loading

---

## 11. Design System Notes

### Typography
- Use a clean sans-serif font (Inter or Geist Sans — both available via `next/font`)
- Monospace for numeric nutrient values in table cells (tabular-nums)

### Color Palette
- Neutral base: Zinc scale (shadcn default)
- Accent: User-selectable from preset palette. Default: a fresh green/teal (food/health association)
- Semantic colors: Red for warnings, amber for caution, green for positive indicators

### Visual Identity
- Clean, data-forward aesthetic — think "Bloomberg Terminal meets modern health app"
- Dense but not cluttered — every pixel of whitespace is intentional
- Subtle depth via shadows and borders, no heavy gradients
- Micro-interactions: smooth column resize, filter chip animations, row expand/collapse transitions

### Accessibility Requirements
- WCAG 2.1 AA minimum
- All interactive elements keyboard-navigable
- Table cells have appropriate ARIA roles
- Color is never the only indicator (icons/text accompany color-coded info)
- Focus rings visible in all color modes
- Accent colors must pass contrast ratio against both light and dark backgrounds

---

## 12. Environment Variables

```env
# PostgreSQL (self-hosted on Oracle Cloud)
DATABASE_URL=postgresql://user:password@<oracle-vm-ip>:5432/munch_metrics?sslmode=require

# Supabase (Auth only — no database usage)
NEXT_PUBLIC_SUPABASE_URL=              # Supabase project URL (for auth client)
NEXT_PUBLIC_SUPABASE_ANON_KEY=         # Supabase anon key (for auth client)

# USDA FoodData Central
USDA_API_KEY=                       # Free, get from https://fdc.nal.usda.gov/api-key-signup

# BLS Average Price API
BLS_API_KEY=                        # Free registration at https://data.bls.gov/registrationEngine/

# Unsplash
UNSPLASH_ACCESS_KEY=                # Free tier, 50 req/hr

# App
NEXT_PUBLIC_APP_URL=https://munchmetrics.net  # Placeholder — update with final domain
```

---

## 13. Key Technical Decisions & Rationale

| Decision | Rationale |
|---|---|
| USDA data imported into self-hosted Postgres (not queried at runtime) | Enables server-side sort/filter/group with proper SQL indexes. USDA API can't do complex queries. |
| Self-hosted Postgres on Oracle Cloud (not Supabase DB) | Free Always Free tier VM with no bandwidth/storage caps on the DB layer. Full control over extensions, tuning, and backups. |
| Drizzle ORM for data access | Type-safe schema + queries, lightweight, excellent Postgres support, generates migrations. Replaces Supabase RPC functions. |
| Supabase retained for auth only | Proven auth solution (magic link + OAuth) without needing to self-host an auth server. Decoupled from the data layer. |
| Materialized view for `food_computed` | Pre-joins nutrients + prices for fast table queries. Refreshed on seed. |
| Server-side filtering via Drizzle queries in Next.js server actions | Keeps client lightweight. Supports complex WHERE clauses, GROUP BY, ORDER BY with pagination. |
| Unsplash images proxied through Next.js API route | Hides API key, enforces cache-first, handles attribution. |
| URL state for table config | Enables sharing and bookmarking. No account required to share a view. |
| CSS custom properties for accent colors | Decoupled from Tailwind classes. Can be changed at runtime without rebuild. Works with shadcn's theming approach. |
| TanStack Table in server-side mode | Table doesn't hold full dataset. Requests new data on sort/filter/page change. |
| BLS Average Price API for pricing | Real monthly dollar prices for common foods. COALESCE pattern gives item-level accuracy where available, category fallback otherwise. |
| pg_trgm for search | Supports fuzzy matching ("chiken" → "chicken") without external search engine. |

---

## 14. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Unsplash rate limit (50/hr free) | Images fail to load for new foods | Aggressive caching in DB. Pre-seed common food images. Consider upgrading to Unsplash paid ($10/mo) if needed. |
| USDA dietary tags are inferred, not verified | False positives (e.g., marking something "vegan" that isn't) | Add disclaimer: "Dietary tags are estimates. Verify with product labels." Phase 2 Open Food Facts adds verified data. |
| Price data is category-level for most foods | "Calories per dollar" is approximate for ~93% of foods | BLS provides real item-level prices for ~60-80 common foods. Clearly label source ("BLS actual" vs "category estimate") in UI. Phase 2 adds Kroger API. |
| Oracle Cloud VM availability/uptime | Self-hosted DB means you own uptime | Automated backups via `pg_dump` cron. Monitor with UptimeRobot or similar. Oracle Always Free VMs are stable but not SLA-backed — accept the tradeoff for $0 cost. |
| Latency between Vercel (edge) and Oracle Cloud VM | Slower queries if regions are far apart | Pick an Oracle Cloud region close to Vercel's default (US East). Connection pooling via `pg` pool. Consider PgBouncer if needed. |
| Self-managed Postgres maintenance | Security patches, disk space, upgrades are on you | Automate `apt` security updates. Set up disk usage alerts. ~8K foods is tiny — disk is not a real concern. |
| Complex GROUP BY on large datasets | Slow queries | Proper indexing. Materialized view pre-computes common columns. Add query timeout + loading states. |
| Mobile data table UX | Dense data is hard on small screens | Collapsible summary rows. Fewer default columns on mobile. Filter panel as bottom sheet. |
```