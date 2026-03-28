import * as React from "react";
import Link from "next/link";
import { SaladIcon } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { AccentPicker } from "@/components/theme/accent-picker";
import { Button } from "@/components/ui/button";
import { MobileNav } from "./mobile-nav";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-14 max-w-7xl items-center px-4">
        {/* Logo */}
        <Link
          href="/"
          className="mr-6 flex items-center gap-2 font-semibold hover:opacity-80 transition-opacity"
        >
          <SaladIcon className="size-5 text-brand" />
          <span className="hidden sm:inline">Munch Metrics</span>
        </Link>

        {/* Nav links (desktop) */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">Explore</Link>
          </Button>
        </nav>

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-1">
          <AccentPicker />
          <ThemeToggle />
          <div className="hidden sm:flex items-center gap-1 ml-2">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
            <Button variant="brand" size="sm">
              Get started
            </Button>
          </div>
          {/* Mobile nav trigger */}
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
