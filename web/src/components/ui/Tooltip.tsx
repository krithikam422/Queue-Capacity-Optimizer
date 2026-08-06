'use client';

import { useId, useState } from 'react';

/**
 * Small, accessible hover/focus tooltip. Deliberately minimal — no external
 * dependency, no animation — so it stays consistent with the restrained
 * visual style of the rest of the product.
 */
export function Tooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-describedby={id}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="flex h-4 w-4 items-center justify-center rounded-full border border-border text-[10px] leading-none text-muted hover:border-accent hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
      >
        ?
      </button>
      {open && (
        <span
          role="tooltip"
          id={id}
          className="absolute bottom-full left-1/2 z-10 mb-2 w-56 -translate-x-1/2 rounded-lg border border-border bg-card p-2.5 text-xs leading-snug text-foreground shadow-md"
        >
          {text}
        </span>
      )}
    </span>
  );
}
