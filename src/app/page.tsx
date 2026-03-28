import { Suspense } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { DataTable } from '@/components/table/data-table'
import { Loader2 } from 'lucide-react'

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto max-w-7xl px-4 py-6">
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <DataTable />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
