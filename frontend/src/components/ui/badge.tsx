"use client";

import * as React from "react";

import { cn } from "@/lib/cn";

type Variant = "default" | "success" | "warning" | "danger";

const variantClass: Record<Variant, string> = {
  default: "bg-zinc-100 text-zinc-900",
  success: "bg-emerald-100 text-emerald-900",
  warning: "bg-amber-100 text-amber-900",
  danger: "bg-red-100 text-red-900",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        variantClass[variant],
        className,
      )}
      {...props}
    />
  );
}

