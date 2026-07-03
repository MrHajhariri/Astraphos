import { notFound } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { LoreEditor } from "@/components/editor";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toggleFavoriteAction, createPageAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function WorkspacePage({ params }: { params: Promise<{ workspaceId: string; pageId: string }> }) {
  const { workspaceId, pageId } = await params;
  const user = await requireUser();
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
    include: {
      workspace: {
        include: {
          pages: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] },
          templates: { orderBy: { name: "asc" } },
        },
      },
    },
  });

  if (!membership) notFound();
  const page = membership.workspace.pages.find((item) => item.id === pageId);
  if (!page) notFound();

  return (
    <main className="grid min-h-dvh grid-cols-1 md:grid-cols-[18rem_1fr]">
      <Sidebar user={user} workspace={membership.workspace} pages={membership.workspace.pages} activePageId={page.id} />
      <section className="min-w-0 bg-white dark:bg-zinc-950">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-2 dark:border-zinc-800">
          <div className="text-sm text-zinc-500">/{page.title}</div>
          <div className="flex gap-2">
            <form action={toggleFavoriteAction}>
              <input type="hidden" name="workspaceId" value={workspaceId} />
              <input type="hidden" name="pageId" value={page.id} />
              <button className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900">
                {page.isFavorite ? "Unfavorite" : "Favorite"}
              </button>
            </form>
            <form action={createPageAction}>
              <input type="hidden" name="workspaceId" value={workspaceId} />
              <input type="hidden" name="parentId" value={page.id} />
              <button className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900">New child</button>
            </form>
          </div>
        </div>
        <LoreEditor workspaceId={workspaceId} page={{ id: page.id, title: page.title, content: page.content as never }} pages={membership.workspace.pages.map(({ id, title }) => ({ id, title }))} />
        <div className="mx-auto max-w-4xl px-5 pb-10 md:px-10">
          <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="mb-3 text-sm font-medium text-zinc-950 dark:text-zinc-50">Templates</p>
            <div className="flex flex-wrap gap-2">
              {membership.workspace.templates.map((template) => (
                <form key={template.id} action={createPageAction}>
                  <input type="hidden" name="workspaceId" value={workspaceId} />
                  <input type="hidden" name="templateId" value={template.id} />
                  <button className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900">
                    {template.name}
                  </button>
                </form>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
