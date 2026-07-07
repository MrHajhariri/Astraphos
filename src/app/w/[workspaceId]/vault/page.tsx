import Link from "next/link";
import { notFound } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { createVaultFileAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function VaultPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const user = await requireUser();
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
    include: {
      workspace: {
        include: {
          pages: { where: { archivedAt: null, deletedAt: null }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] },
          vaultFiles: { orderBy: { updatedAt: "desc" } },
        },
      },
    },
  });

  if (!membership) notFound();

  return (
    <main className="grid min-h-dvh grid-cols-1 md:grid-cols-[18rem_1fr]">
      <Sidebar user={user} workspace={membership.workspace} pages={membership.workspace.pages} />
      <section className="mx-auto w-full max-w-5xl px-5 py-10 md:px-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-cyan-600 dark:text-cyan-300">Markdown vault</p>
            <h1 className="mt-1 text-4xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Vault</h1>
            <p className="mt-3 max-w-2xl text-sm text-zinc-500">Create database-backed Markdown files that can link into the knowledge graph with [[Wiki Links]].</p>
          </div>
          <form action={createVaultFileAction} className="flex gap-2">
            <input type="hidden" name="workspaceId" value={workspaceId} />
            <input name="title" placeholder="New file title" className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-950 dark:border-zinc-800 dark:focus:border-zinc-200" />
            <button className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-950">Create .md</button>
          </form>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {membership.workspace.vaultFiles.map((file) => (
            <Link key={file.id} href={`/w/${workspaceId}/vault/${file.id}`} className="group rounded-2xl border border-zinc-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-cyan-700">
              <p className="font-medium text-zinc-950 dark:text-zinc-50">{file.title}</p>
              <p className="mt-1 text-xs text-cyan-600 dark:text-cyan-300">{file.fileName}</p>
              <p className="mt-3 line-clamp-3 text-sm text-zinc-500">{file.plainText || "Empty Markdown file."}</p>
            </Link>
          ))}
        </div>

        {membership.workspace.vaultFiles.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-zinc-200 p-10 text-center dark:border-zinc-800">
            <p className="font-medium text-zinc-950 dark:text-zinc-50">No Vault files yet</p>
            <p className="mt-1 text-sm text-zinc-500">Create your first `.md` file and link it to notes with [[Page Name]].</p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
