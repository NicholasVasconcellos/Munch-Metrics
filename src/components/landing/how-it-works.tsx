import { cn } from '@/lib/utils'

interface Step {
  icon: React.ReactNode
  title: string
  description: string
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('size-8 text-brand', className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
      />
    </svg>
  )
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('size-8 text-brand', className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 4h18M7 8h10M11 12h2M13 16h-2"
      />
    </svg>
  )
}

function DiscoverIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('size-8 text-brand', className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h12M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-12m0 0v3.75m0-3.75h12m-12 3.75h12"
      />
    </svg>
  )
}

const STEPS: Step[] = [
  {
    icon: <SearchIcon />,
    title: 'Search',
    description:
      'Find any food from 8,000+ whole foods and ingredients instantly with fuzzy search across the full USDA FoodData Central database.',
  },
  {
    icon: <FilterIcon />,
    title: 'Filter',
    description:
      'Apply dietary restrictions, nutrient ranges, and custom metrics to narrow your results. Filter by keto, vegan, high-protein, and more.',
  },
  {
    icon: <DiscoverIcon />,
    title: 'Discover',
    description:
      'Sort by protein-per-dollar, group by category, and export your results to CSV. Share your exact search with a single link.',
  },
]

export function HowItWorks() {
  return (
    <section className="border-y border-border/50 bg-muted/20 py-16">
      <div className="container mx-auto max-w-5xl px-4">
        <h2 className="mb-2 text-center text-2xl font-bold tracking-tight md:text-3xl">
          How It Works
        </h2>
        <p className="mb-10 text-center text-muted-foreground">
          Three steps to finding exactly the food data you need.
        </p>

        <div
          className="how-it-works-cards grid gap-6 sm:grid-cols-3"
          data-testid="how-it-works-cards"
        >
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="relative flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-6 shadow-sm"
            >
              {/* Step number */}
              <div className="absolute right-4 top-4 flex size-6 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                {i + 1}
              </div>
              {/* Icon */}
              <div className="flex size-14 items-center justify-center rounded-xl bg-brand/10">
                {step.icon}
              </div>
              {/* Content */}
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
