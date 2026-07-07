import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/confirm-button";
import { Sidebar } from "@/components/sidebar";
import { deletePageAction, restorePageAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ArchivePage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const user = await requireUser();
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
    include: {
      workspace: {
        include: {
          pages: { where: { deletedAt: null }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] },
        },
      },
    },
  });

  if (!membership) notFound();

  const visiblePages = membership.workspace.pages.filter((page) => !page.archivedAt);
  const archivedPages = membership.workspace.pages.filter((page) => page.archivedAt);

  return (
    <main className="grid min-h-dvh grid-cols-1 md:grid-cols-[18rem_1fr]">
      <Sidebar user={user} workspace={membership.workspace} pages={visiblePages} />
      <section className="mx-auto w-full max-w-4xl px-5 py-10 md:px-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-500">Workspace archive</p>
            <h1 className="mt-1 text-4xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Archived pages</h1>
          </div>
          <Link href={`/w/${workspaceId}/search`} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900">
            Back to search
          </Link>
        </div>

        <div className="mt-8 space-y-3">
          {archivedPages.length ? (
            archivedPages.map((page) => (
              <div key={page.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-950 dark:text-zinc-50">{page.title || "Untitled"}</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Archived {page.archivedAt?.toLocaleDateString() ?? "recently"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <form action={restorePageAction}>
                    <input type="hidden" name="workspaceId" value={workspaceId} />
                    <input type="hidden" name="pageId" value={page.id} />
                    <button className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900">Restore</button>
                  </form>
                  <form action={deletePageAction}>
                    <input type="hidden" name="workspaceId" value={workspaceId} />
                    <input type="hidden" name="pageId" value={page.id} />
                    <input type="hidden" name="returnTo" value={`/w/${workspaceId}/archive`} />
                    <ConfirmButton confirmLabel="Confirm forever" className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-950 dark:text-red-300 dark:hover:bg-red-950/40">Delete forever</ConfirmButton>
                  </form>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center dark:border-zinc-800">
              <p className="font-medium text-zinc-950 dark:text-zinc-50">No archived pages</p>
              <p className="mt-1 text-sm text-zinc-500">Pages you archive will appear here for restore or permanent deletion.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
