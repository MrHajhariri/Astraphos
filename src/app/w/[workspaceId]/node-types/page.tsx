import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/confirm-button";
import { Sidebar } from "@/components/sidebar";
import { createNodeTypeAction, deleteNodeTypeAction, updateNodeTypeAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NodeTypesPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const user = await requireUser();
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
    include: {
      workspace: {
        include: {
          pages: { where: { archivedAt: null, deletedAt: null }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] },
          nodeTypes: { include: { pages: true, vaultFiles: true }, orderBy: { name: "asc" } },
        },
      },
    },
  });
  if (!membership) notFound();
  const canEdit = membership.role === "OWNER";

  return (
    <main className="grid min-h-dvh grid-cols-1 md:grid-cols-[18rem_1fr]">
      <Sidebar user={user} workspace={membership.workspace} pages={membership.workspace.pages} />
      <section className="mx-auto w-full max-w-4xl px-5 py-10 md:px-10">
        <p className="text-sm font-medium text-fuchsia-600 dark:text-fuchsia-300">Graph semantics</p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Node types</h1>
        {canEdit ? (
          <form action={createNodeTypeAction} className="mt-8 grid gap-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800 md:grid-cols-[1fr_1fr_1fr_auto]">
            <input type="hidden" name="workspaceId" value={workspaceId} />
            <input name="name" placeholder="Node type" className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-950 dark:border-zinc-800 dark:focus:border-zinc-200" />
            <input name="icon" placeholder="Icon" className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-950 dark:border-zinc-800 dark:focus:border-zinc-200" />
            <input name="color" placeholder="Color" className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-950 dark:border-zinc-800 dark:focus:border-zinc-200" />
            <button className="rounded-lg bg-zinc-950 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-950">Create</button>
          </form>
        ) : null}
        <div className="mt-8 grid gap-3">
          {membership.workspace.nodeTypes.map((type) => (
            <div key={type.id} className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
              <form action={updateNodeTypeAction} className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
                <input type="hidden" name="workspaceId" value={workspaceId} />
                <input type="hidden" name="nodeTypeId" value={type.id} />
                <input name="name" defaultValue={type.name} disabled={!canEdit} className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-950 disabled:opacity-60 dark:border-zinc-800 dark:focus:border-zinc-200" />
                <input name="icon" defaultValue={type.icon} disabled={!canEdit} className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-950 disabled:opacity-60 dark:border-zinc-800 dark:focus:border-zinc-200" />
                <input name="color" defaultValue={type.color} disabled={!canEdit} className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-950 disabled:opacity-60 dark:border-zinc-800 dark:focus:border-zinc-200" />
                {canEdit ? <button className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900">Save</button> : null}
              </form>
              <div className="mt-3 flex items-center justify-between gap-3 text-sm text-zinc-500">
                <span>{type.pages.length} notes · {type.vaultFiles.length} Vault files</span>
                {canEdit ? (
                  <form action={deleteNodeTypeAction}>
                    <input type="hidden" name="workspaceId" value={workspaceId} />
                    <input type="hidden" name="nodeTypeId" value={type.id} />
                    <ConfirmButton confirmLabel="Confirm delete" className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-950 dark:text-red-300 dark:hover:bg-red-950/40">Delete</ConfirmButton>
                  </form>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
