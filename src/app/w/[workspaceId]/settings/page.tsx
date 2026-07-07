import { notFound } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { createNodeTypeAction, updateWorkspaceAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const user = await requireUser();
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
    include: {
      workspace: {
        include: {
          pages: { where: { archivedAt: null, deletedAt: null }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] },
          nodeTypes: { orderBy: { name: "asc" } },
        },
      },
    },
  });

  if (!membership) notFound();
  const canEdit = membership.role === "OWNER";

  return (
    <main className="grid min-h-dvh grid-cols-1 md:grid-cols-[18rem_1fr]">
      <Sidebar user={user} workspace={membership.workspace} pages={membership.workspace.pages} />
      <section className="mx-auto w-full max-w-3xl px-5 py-10 md:px-10">
        <p className="text-sm font-medium text-zinc-500">Workspace administration</p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Settings</h1>

        <form action={updateWorkspaceAction} className="mt-8 grid gap-5 rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <label className="grid gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Workspace name
            <input name="name" defaultValue={membership.workspace.name} disabled={!canEdit} className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2 font-normal outline-none focus:border-zinc-950 disabled:opacity-60 dark:border-zinc-800 dark:focus:border-zinc-200" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Slug
            <input name="slug" defaultValue={membership.workspace.slug} disabled={!canEdit} className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2 font-normal outline-none focus:border-zinc-950 disabled:opacity-60 dark:border-zinc-800 dark:focus:border-zinc-200" />
          </label>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300">
            <p>Role: {membership.role}</p>
            <p className="mt-1">Storage provider: {process.env.STORAGE_PROVIDER || "local"}</p>
          </div>
          {canEdit ? (
            <button className="justify-self-start rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-950">Save settings</button>
          ) : (
            <p className="text-sm text-zinc-500">Only workspace owners can edit these settings.</p>
          )}
        </form>

        <div className="mt-8 rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
          <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">Node types</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {membership.workspace.nodeTypes.map((type) => (
              <span key={type.id} className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">{type.name} · {type.color}</span>
            ))}
          </div>
          {canEdit ? (
            <form action={createNodeTypeAction} className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
              <input type="hidden" name="workspaceId" value={workspaceId} />
              <input name="name" placeholder="Node type" className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-950 dark:border-zinc-800 dark:focus:border-zinc-200" />
              <input name="icon" placeholder="Icon name" className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-950 dark:border-zinc-800 dark:focus:border-zinc-200" />
              <input name="color" placeholder="Color" className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-950 dark:border-zinc-800 dark:focus:border-zinc-200" />
              <button className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900">Add</button>
            </form>
          ) : null}
        </div>
      </section>
    </main>
  );
}
