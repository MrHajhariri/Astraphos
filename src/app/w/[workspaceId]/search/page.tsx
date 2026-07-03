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
    include: { workspace: { include: { pages: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] } } } },
  });
  if (!membership) notFound();

  const query = q.trim();
  const results = query
    ? membership.workspace.pages.filter((page) => `${page.title} ${page.plainText}`.toLowerCase().includes(query.toLowerCase()))
    : membership.workspace.pages;

  return (
    <main className="grid min-h-dvh grid-cols-1 md:grid-cols-[18rem_1fr]">
      <Sidebar user={user} workspace={membership.workspace} pages={membership.workspace.pages} />
      <section className="mx-auto w-full max-w-4xl px-5 py-10 md:px-10">
        <h1 className="text-4xl font-bold tracking-tight">Search</h1>
        <form className="mt-6">
          <input name="q" defaultValue={query} placeholder="Search pages..." className="w-full rounded-xl border border-zinc-200 bg-transparent px-4 py-3 outline-none focus:border-zinc-950 dark:border-zinc-800 dark:focus:border-zinc-200" />
        </form>
        <div className="mt-6 space-y-2">
          {results.map((page) => (
            <Link key={page.id} href={`/w/${workspaceId}/p/${page.id}`} className="block rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
              <p className="font-medium text-zinc-950 dark:text-zinc-50">{page.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{page.plainText || "No body text yet."}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
