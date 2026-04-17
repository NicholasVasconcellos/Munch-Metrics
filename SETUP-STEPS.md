# Munch Metrics — Setup Steps

Everything you need to do outside the repo to get the project running.

---

## 1. Prerequisites

- Node.js 18+ and pnpm
- [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started) installed (`brew install supabase/tap/supabase`)
- A Supabase project (create one at https://supabase.com/dashboard)

## 2. Register for API Keys

| Service | Registration URL | Env Variable(s) |
|---|---|---|
| Supabase | https://supabase.com/dashboard | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` |
| Unsplash | https://unsplash.com/developers | `UNSPLASH_ACCESS_KEY`, `UNSPLASH_SECRET_KEY` |
| USDA FoodData Central | https://fdc.nal.usda.gov/api-key-signup | `USDA_API_KEY` |
| BLS | https://data.bls.gov/registrationEngine/ | `BLS_API_KEY` |

## 3. Create `.env.local`

```bash
cp .env.local.example .env.local
```

Fill in your values. The `DATABASE_URL` is found in your Supabase dashboard under **Project Settings > Database > Connection string > URI** (use the connection pooler / Transaction mode URL on port 6543).

## 4. Link Supabase Project

```bash
supabase link --project-ref <your-project-ref>
```

You'll be prompted for the database password you set when creating the project.

## 5. Push Database Schema

```bash
supabase db push
```

This applies the migration in `supabase/migrations/` which creates all tables, enums, the `food_computed` materialized view, and required indexes/extensions.

## 6. Configure Auth Providers

In the Supabase dashboard under **Authentication > Providers**:

- Enable **Email** (OTP / Magic Link)
- Enable **Google** OAuth (requires Google Cloud OAuth client ID/secret)
- Set **Site URL** and **Redirect URLs** to match your app's domain

## 7. Seed the Database

Run the seed scripts in order:

```bash
# 1. USDA foods + nutrients (~10-20 min, API rate limited)
pnpm tsx scripts/seed-usda.ts

# 2. BLS prices + crosswalk + materialized view refresh
pnpm tsx scripts/seed-prices.ts

# 3. Dietary/allergen/processing tags
pnpm tsx scripts/seed-tags.ts
```

## 8. Start Dev Server

```bash
pnpm dev
```

Open http://localhost:3000 and verify:
- Food search works (fuzzy search via pg_trgm)
- Filters load (food groups, dietary tags, allergens)
- Auth sign-in works (email OTP or Google)
- User preferences save correctly
