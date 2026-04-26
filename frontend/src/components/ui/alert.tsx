"use client";

import * as React from "react";

import { cn } from "@/lib/cn";

type Variant = "info" | "danger";

const variantClass: Record<Variant, string> = {
  info: "border-zinc-200 bg-zinc-50 text-zinc-900",
  danger: "border-red-200 bg-red-50 text-red-900",
};

export function Alert({
  className,
  variant = "info",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: Variant }) {
  return (
    <div
      className={cn("rounded-md border px-3 py-2 text-sm", variantClass[variant], className)}
      {...props}
    />
  );
}

