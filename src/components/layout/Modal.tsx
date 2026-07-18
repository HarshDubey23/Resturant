"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TModal {
  open: boolean;
  closeIcon?: boolean;
  setOpen: (open: boolean) => void;
  children: ReactNode;
}

export default function Modal({ children, open, setOpen, closeIcon = true }: TModal) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setOpen(false)} />
      )}
      <div
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-card p-6 shadow-xl transition-all",
          open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        )}
      >
        {children}
        {closeIcon && (
          <Button
            size="xs"
            variant="ghost"
            className="absolute right-3 top-3"
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </>
  );
}
