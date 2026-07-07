import Link from "next/link";
import { notFound } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SearchPage({ params, searchParams }: { params: Promise<{ workspaceId: string }>; searchParams: Promise<{ q?: string }> }) {
  const { workspaceId } = await params;
  const { q = "" } = await searchParams;
  const user = await requireUser();
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
    include: {
      workspace: {
        include: {
          pages: { where: { archivedAt: null, deletedAt: null }, include: { tags: { include: { tag: true } }, nodeType: true }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] },
          vaultFiles: { include: { tags: { include: { tag: true } }, nodeType: true, folder: true }, orderBy: { updatedAt: "desc" } },
        },
      },
    },
  });
  if (!membership) notFound();

  const query = q.trim();
  const pageResults = query
    ? membership.workspace.pages.filter((page) => `${page.title} ${page.plainText} ${page.nodeType?.name ?? ""} ${page.tags.map(({ tag }) => tag.name).join(" ")}`.toLowerCase().includes(query.toLowerCase()))
    : membership.workspace.pages;
  const vaultResults = query
    ? membership.workspace.vaultFiles.filter((file) => `${file.title} ${file.fileName} ${file.plainText} ${file.nodeType?.name ?? ""} ${file.folder?.name ?? ""} ${file.tags.map(({ tag }) => tag.name).join(" ")}`.toLowerCase().includes(query.toLowerCase()))
    : membership.workspace.vaultFiles;

  return (
    <main className="grid min-h-dvh grid-cols-1 md:grid-cols-[18rem_1fr]">
      <Sidebar user={user} workspace={membership.workspace} pages={membership.workspace.pages} />
      <section className="mx-auto w-full max-w-4xl px-5 py-10 md:px-10">
        <h1 className="text-4xl font-bold tracking-tight">Search</h1>
        <form className="mt-6">
          <input name="q" defaultValue={query} placeholder="Search notes, Vault files, tags, folders, and node types..." className="w-full rounded-xl border border-zinc-200 bg-transparent px-4 py-3 outline-none focus:border-zinc-950 dark:border-zinc-800 dark:focus:border-zinc-200" />
        </form>
        <div className="mt-6 space-y-2">
          {pageResults.map((page) => (
            <Link key={page.id} href={`/w/${workspaceId}/p/${page.id}`} className="block rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
              <p className="font-medium text-zinc-950 dark:text-zinc-50"><span className="mr-2 rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-700 dark:bg-violet-950 dark:text-violet-200">Note</span>{page.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{page.plainText || "No body text yet."}</p>
            </Link>
          ))}
          {vaultResults.map((file) => (
            <Link key={file.id} href={`/w/${workspaceId}/vault/${file.id}`} className="block rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
              <p className="font-medium text-zinc-950 dark:text-zinc-50"><span className="mr-2 rounded-full bg-cyan-100 px-2 py-0.5 text-xs text-cyan-700 dark:bg-cyan-950 dark:text-cyan-200">Vault</span>{file.title}</p>
              <p className="mt-1 text-xs text-cyan-600 dark:text-cyan-300">{file.folder?.name ?? "Root"} / {file.fileName}</p>
              <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{file.plainText || "Empty Markdown file."}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
