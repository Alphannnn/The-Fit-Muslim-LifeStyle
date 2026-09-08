import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import PostForm from "@/components/admin/PostForm";
import { PageHeading } from "@/components/admin/ui/primitives";
import { db } from "@/lib/db";
import { journalPosts } from "@/lib/db/schema";

export default async function AdminPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";

  const post = isNew
    ? undefined
    : ((await db.select().from(journalPosts).where(eq(journalPosts.id, id)).get()) ?? undefined);

  if (!isNew && !post) notFound();

  return (
    <>
      <PageHeading
        breadcrumb={[
          { label: "Journal", href: "/admin/journal" },
          { label: isNew ? "New" : post!.title },
        ]}
        title={isNew ? "New post" : post!.title}
        description={isNew ? "Drafts stay private until you tick Published." : `/${post!.slug}`}
      />
      <PostForm post={post} />
    </>
  );
}
