"use client";

import * as React from "react";
import { PaletteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const ACCENTS = [
  { name: "blue", label: "Blue", color: "oklch(0.546 0.245 262.881)" },
  { name: "green", label: "Green", color: "oklch(0.527 0.154 150.069)" },
  { name: "teal", label: "Teal", color: "oklch(0.541 0.176 194.769)" },
  { name: "orange", label: "Orange", color: "oklch(0.646 0.222 41.116)" },
  { name: "purple", label: "Purple", color: "oklch(0.558 0.288 302.321)" },
  { name: "rose", label: "Rose", color: "oklch(0.586 0.239 14.43)" },
  { name: "yellow", label: "Yellow", color: "oklch(0.728 0.165 80.714)" },
  { name: "indigo", label: "Indigo", color: "oklch(0.511 0.262 276.966)" },
  { name: "pink", label: "Pink", color: "oklch(0.601 0.209 332.36)" },
] as const;

type AccentName = (typeof ACCENTS)[number]["name"];

const STORAGE_KEY = "munch-metrics-accent";

export function AccentPicker() {
  const [accent, setAccentState] = React.useState<AccentName>("blue");

  React.useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as AccentName | null;
    if (stored && ACCENTS.some((a) => a.name === stored)) {
      applyAccent(stored);
      setAccentState(stored);
    }
  }, []);

  function applyAccent(name: AccentName) {
    document.documentElement.dataset.accent = name;
    localStorage.setItem(STORAGE_KEY, name);
    setAccentState(name);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Pick accent color">
          <PaletteIcon className="size-4" />
          <span className="sr-only">Pick accent color</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="end">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Accent color
        </p>
        <div className="grid grid-cols-5 gap-1.5">
          {ACCENTS.map((a) => (
            <button
              key={a.name}
              onClick={() => applyAccent(a.name)}
              title={a.label}
              className={cn(
                "size-6 rounded-full transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                accent === a.name && "ring-2 ring-ring ring-offset-1"
              )}
              style={{ backgroundColor: a.color }}
              aria-label={a.label}
              aria-pressed={accent === a.name}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
