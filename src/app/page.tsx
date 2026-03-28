import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            Food intelligence,{" "}
            <span className="text-brand">on your terms</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl">
            Search, filter, and sort a comprehensive nutritional database using
            custom metrics like protein-per-dollar.
          </p>
          <p className="text-sm text-muted-foreground">
            Coming soon — data table and search are being built.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
