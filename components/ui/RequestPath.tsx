"use client";

import { usePathname } from "next/navigation";

/** The path the visitor actually typed, for the 404 prompt line. */
export function RequestPath() {
  return <>{usePathname()}</>;
}
