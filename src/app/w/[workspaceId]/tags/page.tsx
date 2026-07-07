import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/confirm-button";
import { Sidebar } from "@/components/sidebar";
import { deleteTagAction, updateTagAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function TagsPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const user = await requireUser();
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
    include: {
      workspace: {
        include: {
          pages: { where: { archivedAt: null, deletedAt: null }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] },
          tags: { include: { pages: true, vaultFiles: true }, orderBy: { name: "asc" } },
        },
      },
    },
  });
  if (!membership) notFound();

  return (
    <main className="grid min-h-dvh grid-cols-1 md:grid-cols-[18rem_1fr]">
      <Sidebar user={user} workspace={membership.workspace} pages={membership.workspace.pages} />
      <section className="mx-auto w-full max-w-4xl px-5 py-10 md:px-10">
        <p className="text-sm font-medium text-violet-600 dark:text-violet-300">Metadata management</p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Tags</h1>
        <div className="mt-8 grid gap-3">
          {membership.workspace.tags.map((tag) => (
            <div key={tag.id} className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
              <form action={updateTagAction} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <input type="hidden" name="workspaceId" value={workspaceId} />
                <input type="hidden" name="tagId" value={tag.id} />
                <input name="name" defaultValue={tag.name} className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-950 dark:border-zinc-800 dark:focus:border-zinc-200" />
                <input name="color" defaultValue={tag.color} className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-950 dark:border-zinc-800 dark:focus:border-zinc-200" />
                <button className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900">Save</button>
              </form>
              <div className="mt-3 flex items-center justify-between gap-3 text-sm text-zinc-500">
                <span>{tag.pages.length} notes · {tag.vaultFiles.length} Vault files</span>
                <form action={deleteTagAction}>
                  <input type="hidden" name="workspaceId" value={workspaceId} />
                  <input type="hidden" name="tagId" value={tag.id} />
                  <ConfirmButton confirmLabel="Confirm delete" className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-950 dark:text-red-300 dark:hover:bg-red-950/40">Delete</ConfirmButton>
                </form>
              </div>
            </div>
          ))}
          {membership.workspace.tags.length === 0 ? <p className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-500 dark:border-zinc-800">No tags yet. Add tags from note or Vault metadata panels.</p> : null}
        </div>
      </section>
    </main>
  );
}
