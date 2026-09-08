"use client";

import { buttonClass } from "./ui/primitives";

import Link from "next/link";
import { useActionState } from "react";
import { savePostAction, type AdminState } from "@/lib/admin/actions";
import type { JournalPost } from "@/lib/db/schema";

const initial: AdminState = {};

const field = "admin-field";
const labelText = "admin-label";

export default function PostForm({ post }: { post?: JournalPost }) {
  const [state, action, pending] = useActionState(savePostAction, initial);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="id" value={post?.id ?? ""} />

      <section className="rounded-lg border border-panel-border bg-panel-surface p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className={labelText}>Title</span>
            <input name="title" required defaultValue={post?.title} maxLength={160} className={field} />
          </label>
          <label className="block">
            <span className={labelText}>Slug</span>
            <input
              name="slug"
              defaultValue={post?.slug}
              maxLength={120}
              placeholder="left blank = generated from the title"
              className={field}
            />
          </label>
          <label className="block">
            <span className={labelText}>Category</span>
            <input
              name="category"
              required
              defaultValue={post?.category ?? "Mindset"}
              maxLength={40}
              list="post-categories"
              className={field}
            />
            <datalist id="post-categories">
              <option value="Training" />
              <option value="Nutrition" />
              <option value="Mindset" />
              <option value="Ramadan" />
            </datalist>
          </label>
          <label className="block">
            <span className={labelText}>Cover image (URL or path)</span>
            <input
              name="coverImage"
              defaultValue={post?.coverImage}
              maxLength={400}
              className={field}
            />
          </label>
          <label className="block">
            <span className={labelText}>Author</span>
            <input
              name="author"
              defaultValue={post?.author ?? "The Fit Muslim"}
              maxLength={80}
              className={field}
            />
          </label>
        </div>

        <label className="mt-4 block">
          <span className={labelText}>Excerpt</span>
          <textarea
            name="excerpt"
            rows={2}
            defaultValue={post?.excerpt}
            maxLength={400}
            className={`${field} resize-y`}
          />
        </label>

        <label className="mt-4 flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            name="published"
            defaultChecked={post?.published ?? false}
            className="h-4 w-4 accent-green-700"
          />
          <span className="text-[0.83rem] text-panel-soft">Published</span>
        </label>
      </section>

      <section className="rounded-lg border border-panel-border bg-panel-surface p-5">
        <h2 className="mb-1 text-[0.95rem] font-semibold text-panel-ink">Body</h2>
        <p className="mb-3 text-[0.75rem] text-panel-muted">
          Markdown subset: <code>## heading</code>, <code>**bold**</code>,{" "}
          <code>*italic*</code>, <code>- list</code>, <code>&gt; quote</code>,{" "}
          <code>[link](url)</code>. Reading time is calculated on save. HTML is escaped.
        </p>
        <textarea
          name="body"
          required
          rows={22}
          defaultValue={post?.body}
          maxLength={40_000}
          className={`${field} resize-y font-mono text-[0.82rem] leading-relaxed`}
        />
      </section>

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
          {pending ? "Saving…" : post ? "Save Post" : "Create Post"}
        </button>
        <Link
          href="/admin/journal"
          className={buttonClass("secondary")}
        >
          Cancel
        </Link>
        {post?.published && (
          <Link
            href={`/journal/${post.slug}`}
            className="ml-auto self-center text-[0.78rem] font-medium text-green-700 hover:text-green-900"
          >
            View on the storefront →
          </Link>
        )}
      </div>
    </form>
  );
}
