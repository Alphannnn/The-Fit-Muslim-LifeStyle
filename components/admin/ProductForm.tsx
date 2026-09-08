"use client";

import { buttonClass } from "./ui/primitives";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveProductAction, type AdminState } from "@/lib/admin/actions";
import type { Product } from "@/lib/db/schema";

const initial: AdminState = {};

const field = "admin-field";
const labelText = "admin-label";

const decimal = (cents: number | null | undefined) =>
  cents == null ? "" : (cents / 100).toFixed(2);

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-panel-border bg-panel-surface p-5">
      <h2 className="mb-4 text-[0.95rem] font-semibold text-panel-ink">{title}</h2>
      {children}
    </section>
  );
}

export default function ProductForm({ product }: { product?: Product }) {
  const [state, action, pending] = useActionState(saveProductAction, initial);
  const [kind, setKind] = useState(product?.kind ?? "physical");

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="id" value={product?.id ?? ""} />

      <Section title="Identity">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelText}>Name</span>
            <input name="name" required defaultValue={product?.name} maxLength={80} className={field} />
          </label>
          <label className="block">
            <span className={labelText}>Subtitle</span>
            <input name="subtitle" defaultValue={product?.subtitle} maxLength={80} className={field} />
          </label>
          <label className="block">
            <span className={labelText}>Slug</span>
            <input
              name="slug"
              defaultValue={product?.slug}
              maxLength={80}
              placeholder="left blank = generated from the name"
              className={field}
            />
          </label>
          <label className="block">
            <span className={labelText}>Kind</span>
            <select
              name="kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as Product["kind"])}
              className={`${field} cursor-pointer`}
            >
              <option value="physical">Physical</option>
              <option value="digital">Digital</option>
              <option value="subscription">Subscription</option>
            </select>
          </label>
        </div>

        <label className="mt-4 block">
          <span className={labelText}>Tagline</span>
          <input name="tagline" defaultValue={product?.tagline} maxLength={200} className={field} />
        </label>

        <label className="mt-4 block">
          <span className={labelText}>Description (markdown: ## headings, **bold**, - lists)</span>
          <textarea
            name="description"
            rows={8}
            defaultValue={product?.description}
            maxLength={8000}
            className={`${field} resize-y font-mono text-[0.8rem]`}
          />
        </label>
      </Section>

      <Section title="Pricing & stock">
        <div className="grid gap-4 sm:grid-cols-4">
          <label className="block">
            <span className={labelText}>Price</span>
            <input
              name="price"
              required
              inputMode="decimal"
              defaultValue={decimal(product?.priceCents)}
              placeholder="24.00"
              className={field}
            />
          </label>
          <label className="block">
            <span className={labelText}>Compare at</span>
            <input
              name="compareAt"
              inputMode="decimal"
              defaultValue={decimal(product?.compareAtCents)}
              placeholder="—"
              className={field}
            />
          </label>
          <label className="block">
            <span className={labelText}>Currency</span>
            <input
              name="currency"
              defaultValue={product?.currency ?? "USD"}
              maxLength={3}
              className={`${field} uppercase`}
            />
          </label>
          <label className="block">
            <span className={labelText}>Stock</span>
            <input
              name="stock"
              inputMode="numeric"
              defaultValue={product?.stock ?? ""}
              disabled={kind !== "physical"}
              placeholder={kind === "physical" ? "0" : "not tracked"}
              className={`${field} disabled:opacity-50`}
            />
          </label>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className={labelText}>Position (sort order)</span>
            <input
              type="number"
              name="position"
              min={0}
              max={999}
              defaultValue={product?.position ?? 0}
              className={field}
            />
          </label>
          <label className="mt-6 flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              name="active"
              defaultChecked={product?.active ?? true}
              className="h-4 w-4 accent-green-700"
            />
            <span className="text-[0.83rem] text-panel-soft">Active (visible in the shop)</span>
          </label>
          <label className="mt-6 flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={product?.featured ?? false}
              className="h-4 w-4 accent-green-700"
            />
            <span className="text-[0.83rem] text-panel-soft">Featured on the home page</span>
          </label>
        </div>
      </Section>

      <Section title="Media & delivery">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelText}>Image (path or URL)</span>
            <input name="image" required defaultValue={product?.image} maxLength={400} className={field} />
          </label>
          <label className="block">
            <span className={labelText}>Download path (digital only)</span>
            <input
              name="downloadPath"
              defaultValue={product?.downloadPath ?? ""}
              placeholder="/downloads/file.pdf"
              maxLength={400}
              className={field}
            />
          </label>
          <label className="block">
            <span className={labelText}>Video (optional)</span>
            <input name="video" defaultValue={product?.video ?? ""} maxLength={400} className={field} />
          </label>
          <label className="block">
            <span className={labelText}>Video poster</span>
            <input
              name="videoPoster"
              defaultValue={product?.videoPoster ?? ""}
              maxLength={400}
              className={field}
            />
          </label>
        </div>
      </Section>

      <Section title="Merchandising">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelText}>Collections (comma separated)</span>
            <input
              name="collections"
              defaultValue={product?.collections.join(", ")}
              placeholder="nutrition, ramadan"
              className={field}
            />
          </label>
          <label className="block">
            <span className={labelText}>Pillars (comma separated)</span>
            <input
              name="pillars"
              defaultValue={product?.pillars.join(", ")}
              placeholder="Salah, Healthy Body"
              className={field}
            />
          </label>
        </div>

        <label className="mt-4 block">
          <span className={labelText}>Specs — one per line, &ldquo;Label: value&rdquo;</span>
          <textarea
            name="specs"
            rows={4}
            defaultValue={product?.specs.map((s) => `${s.k}: ${s.v}`).join("\n")}
            placeholder={"Pages: 120, full colour\nFormat: A4 · wire-o spiral"}
            className={`${field} resize-y font-mono text-[0.8rem]`}
          />
        </label>
      </Section>

      <Section title="Halal transparency">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className={labelText}>Status</span>
            <select
              name="halalStatus"
              defaultValue={product?.halalStatus ?? "not-applicable"}
              className={`${field} cursor-pointer`}
            >
              <option value="not-applicable">Not applicable</option>
              <option value="verified-ingredients">Ingredients verified</option>
              <option value="certified">Certified</option>
            </select>
          </label>
          <label className="block">
            <span className={labelText}>Certifying authority</span>
            <input
              name="halalAuthority"
              defaultValue={product?.halalAuthority ?? ""}
              maxLength={120}
              className={field}
            />
          </label>
          <label className="block">
            <span className={labelText}>Certificate reference</span>
            <input
              name="halalCertRef"
              defaultValue={product?.halalCertRef ?? ""}
              maxLength={80}
              className={field}
            />
          </label>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelText}>Ingredients — one per line</span>
            <textarea
              name="ingredients"
              rows={5}
              defaultValue={product?.ingredients.join("\n")}
              className={`${field} resize-y font-mono text-[0.8rem]`}
            />
          </label>
          <label className="block">
            <span className={labelText}>Allergens (comma separated)</span>
            <input
              name="allergens"
              defaultValue={product?.allergens.join(", ")}
              placeholder="Milk, Tree nuts"
              className={field}
            />
          </label>
        </div>
      </Section>

      {state.error && (
        <p className="rounded-md border border-danger/25 bg-danger-soft px-3.5 py-2.5 text-[0.83rem] text-danger">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className={buttonClass("primary")}
        >
          {pending ? "Saving…" : product ? "Save Product" : "Create Product"}
        </button>
        <Link
          href="/admin/products"
          className={buttonClass("secondary")}
        >
          Cancel
        </Link>
        {product && (
          <Link
            href={`/product/${product.slug}`}
            className="ml-auto self-center text-[0.78rem] font-medium text-green-700 hover:text-green-900"
          >
            View on the storefront →
          </Link>
        )}
      </div>
    </form>
  );
}
