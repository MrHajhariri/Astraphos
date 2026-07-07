import { notFound } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { createPageAction, createTemplateAction, deleteTemplateAction, updateTemplateAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function TemplatesPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const user = await requireUser();
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
    include: {
      workspace: {
        include: {
          pages: { where: { archivedAt: null, deletedAt: null }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] },
          templates: { orderBy: { name: "asc" } },
        },
      },
    },
  });

  if (!membership) notFound();

  return (
    <main className="grid min-h-dvh grid-cols-1 md:grid-cols-[18rem_1fr]">
      <Sidebar user={user} workspace={membership.workspace} pages={membership.workspace.pages} />
      <section className="mx-auto w-full max-w-5xl px-5 py-10 md:px-10">
        <div>
          <p className="text-sm font-medium text-zinc-500">Workspace templates</p>
          <h1 className="mt-1 text-4xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Template management</h1>
          <p className="mt-3 max-w-2xl text-sm text-zinc-500">Create reusable page starters from a blank document or copy the content from an existing page.</p>
        </div>

        <form action={createTemplateAction} className="mt-8 grid gap-4 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800 md:grid-cols-[1fr_1fr_auto]">
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <label className="grid gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Name
            <input name="name" required placeholder="Research note" className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2 font-normal outline-none focus:border-zinc-950 dark:border-zinc-800 dark:focus:border-zinc-200" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Source page
            <select name="sourcePageId" className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2 font-normal outline-none focus:border-zinc-950 dark:border-zinc-800 dark:focus:border-zinc-200">
              <option value="">Blank template</option>
              {membership.workspace.pages.map((page) => (
                <option key={page.id} value={page.id}>{page.title || "Untitled"}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-200 md:col-span-2">
            Description
            <input name="description" placeholder="What this template is for" className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2 font-normal outline-none focus:border-zinc-950 dark:border-zinc-800 dark:focus:border-zinc-200" />
          </label>
          <button className="self-end rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-950">Create</button>
        </form>

        <div className="mt-8 grid gap-4">
          {membership.workspace.templates.map((template) => (
            <div key={template.id} className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
              <form action={updateTemplateAction} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <input type="hidden" name="workspaceId" value={workspaceId} />
                <input type="hidden" name="templateId" value={template.id} />
                <input name="name" defaultValue={template.name} className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-950 dark:border-zinc-800 dark:focus:border-zinc-200" />
                <input name="description" defaultValue={template.description ?? ""} placeholder="Description" className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-950 dark:border-zinc-800 dark:focus:border-zinc-200" />
                <button className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900">Save</button>
              </form>
              <div className="mt-3 flex flex-wrap gap-2">
                <form action={createPageAction}>
                  <input type="hidden" name="workspaceId" value={workspaceId} />
                  <input type="hidden" name="templateId" value={template.id} />
                  <button className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900">Create page</button>
                </form>
                <form action={deleteTemplateAction}>
                  <input type="hidden" name="workspaceId" value={workspaceId} />
                  <input type="hidden" name="templateId" value={template.id} />
                  <button className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-950 dark:text-red-300 dark:hover:bg-red-950/40">Delete</button>
                </form>
              </div>
            </div>
          ))}
          {membership.workspace.templates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center dark:border-zinc-800">
              <p className="font-medium text-zinc-950 dark:text-zinc-50">No templates yet</p>
              <p className="mt-1 text-sm text-zinc-500">Create one above to speed up future pages.</p>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
