"use client";

import * as React from "react";
import Link from "next/link";
import { MenuIcon, SaladIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

export function MobileNav() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="sm:hidden"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
      >
        <MenuIcon className="size-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:hidden max-w-full h-full rounded-none border-none p-0">
          <DialogHeader className="px-4 pt-4 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <SaladIcon className="size-5 text-brand" />
              Munch Metrics
            </DialogTitle>
          </DialogHeader>

          <Separator />

          <nav className="flex flex-col gap-1 p-4">
            <Button
              variant="ghost"
              className="justify-start"
              asChild
              onClick={() => setOpen(false)}
            >
              <Link href="/">Explore</Link>
            </Button>
          </nav>

          <Separator className="mt-auto" />

          <div className="flex flex-col gap-2 p-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Sign in
            </Button>
            <Button variant="brand" onClick={() => setOpen(false)}>
              Get started
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
