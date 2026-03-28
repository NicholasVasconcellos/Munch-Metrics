import * as React from "react";
import Link from "next/link";
import { SaladIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <SaladIcon className="size-4 text-brand" />
            <span className="text-sm font-medium">Munch Metrics</span>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Explore
            </Link>
            <Link
              href="https://fdc.nal.usda.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              USDA Data
            </Link>
          </nav>
        </div>

        <Separator className="my-6" />

        <p className="text-xs text-muted-foreground text-center sm:text-left">
          Nutritional data sourced from the{" "}
          <a
            href="https://fdc.nal.usda.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            USDA FoodData Central
          </a>{" "}
          (CC0). Price data from{" "}
          <a
            href="https://www.bls.gov/data/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            BLS Average Prices
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
