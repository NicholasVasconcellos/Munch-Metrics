# Munch Metrics

## Goal

A free, web-based food intelligence tool that lets users search, filter, sort, and group a comprehensive nutritional database using custom metrics like protein-per-dollar. The query engine itself is the product.

## Tech Stack

| Layer           | Technology                         | Version / Notes                      |
| --------------- | ---------------------------------- | ------------------------------------ |
| Framework       | Next.js (App Router)               | 15.x+ (latest stable)               |
| Language        | TypeScript                         | Strict mode                          |
| UI Library      | shadcn/ui                          | Latest, with Tailwind CSS v4         |
| Data Table      | TanStack Table v8                  | Headless, server-side mode           |
| Database        | PostgreSQL 16                      | Self-hosted on Oracle Cloud Free VM  |
| ORM             | Drizzle ORM                        | Type-safe queries, migrations        |
| Auth            | Supabase Auth                      | Email + Google OAuth (auth-only)     |
| Image Source    | Unsplash API                       | Free tier (50 req/hr), cached in DB  |
| Food Data API   | USDA FoodData Central              | CC0 license, bulk imported           |
| Price Data API  | BLS Average Price (v2)             | Free, monthly updates                |
| Deployment      | Vercel                             | Free tier                            |
| Testing         | Vitest + msw                       | Unit + integration                   |
| Package Manager | pnpm                               | Latest                               |

## Project Structure

```
munch-metrics/
├── public/icons/              # Food category placeholder icons
├── src/
│   ├── app/                   # Next.js App Router pages + API routes
│   │   ├── layout.tsx         # Root layout (theme provider, fonts)
│   │   ├── page.tsx           # Landing + main table view (single page)
│   │   ├── globals.css        # Tailwind base + CSS custom properties
│   │   └── api/images/[foodId]/route.ts  # Unsplash proxy + cache
│   ├── components/
│   │   ├── ui/                # shadcn/ui primitives
│   │   ├── table/             # TanStack Table wrapper, columns, filters, grouping
│   │   ├── food/              # Food image, detail modal
│   │   ├── filters/           # Dietary, nutrient range, additive, tag filters
│   │   ├── theme/             # Theme provider, toggle, accent picker
│   │   ├── layout/            # Header, footer, mobile nav
│   │   ├── landing/           # Hero, how-it-works, stats bar, scroll transition
│   │   └── tutorial/          # Tutorial modal, step animations
│   ├── hooks/                 # use-food-query, use-url-state, use-debounce, use-media-query
│   ├── lib/
│   │   ├── db/                # Drizzle client, schema, migrations
│   │   ├── auth/              # Supabase Auth client + server helpers
│   │   ├── queries/           # Server action query functions
│   │   ├── url-state.ts       # URL param serialization
│   │   ├── csv-export.ts      # CSV generation
│   │   ├── constants.ts       # Nutrient names, diet presets, units
│   │   └── utils.ts
│   └── types/                 # food.ts, filters.ts, table.ts
├── scripts/                   # seed-usda.ts, seed-prices.ts, bls-crosswalk.ts, seed-tags.ts
├── tests/integration/         # Integration tests against local Postgres
├── drizzle/migrations/        # Drizzle-generated SQL migrations
├── drizzle.config.ts
└── package.json
```

## Conventions

- TypeScript strict mode throughout
- Drizzle ORM for all DB access (no raw pg queries except in Drizzle `sql` template tag)
- Server actions for data fetching (not client-side API calls)
- URL state is the source of truth for table config (sort, filter, group, columns, page)
- CSS custom properties for accent colors (runtime-swappable, independent of light/dark mode)
- shadcn/ui for all UI primitives (copy-pasted source, not npm package)
- TanStack Table in server-side mode (no client-side data holding)
- Supabase is auth-only — all data lives in self-hosted Postgres
- User IDs from Supabase stored as text keys (not FKs) in self-hosted DB

## Architecture Notes

**Data flow:** All USDA/BLS data is bulk-imported into Postgres via seed scripts. No runtime calls to external data APIs during user interactions. Only Unsplash is called at runtime (proxied, cache-first).

**Computed view:** `food_computed` is a materialized view pre-joining foods + nutrients + prices. Main table queries hit this view. Refresh on seed.

**Price strategy:** BLS provides real item-level prices for ~60-80 common foods. USDA category estimates are fallback for the rest. COALESCE pattern in the computed view handles priority.

**Auth model:** Anonymous users get full table functionality. Authenticated users additionally get: saved preferences, dietary profiles, food exclusions, accent color persistence. Auth state verified in server actions via Supabase session → scoped Drizzle queries by user_id.

**Search:** `pg_trgm` GIN index on food names enables fuzzy matching. Debounced 300ms on client.

**Image caching:** First Unsplash lookup cached in `food_images` table. Subsequent requests serve cached URL. 50 req/hr limit makes aggressive caching mandatory.
