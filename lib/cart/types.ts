import type { ProductKind } from "@/lib/db/schema";
import { CURRENCY, type Totals } from "@/lib/money";

/* Shared by the server cart and the client drawer. Kept apart from
   cart/server.ts so client components can import the shapes without pulling
   `next/headers` and the database driver into the browser bundle. */

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  subtitle: string;
  image: string;
  kind: ProductKind;
  unitPriceCents: number;
  compareAtCents: number | null;
  qty: number;
  lineTotalCents: number;
  /** null = not stock-tracked */
  stock: number | null;
  /** where a digital item is fulfilled from — snapshotted onto the order */
  downloadPath: string | null;
};

export type CartView = {
  id: string | null;
  lines: CartLine[];
  count: number;
  currency: string;
  hasPhysical: boolean;
  totals: Totals;
};

export const EMPTY_CART: CartView = {
  id: null,
  lines: [],
  count: 0,
  currency: CURRENCY,
  hasPhysical: false,
  totals: { subtotalCents: 0, shippingCents: 0, taxCents: 0, totalCents: 0 },
};
