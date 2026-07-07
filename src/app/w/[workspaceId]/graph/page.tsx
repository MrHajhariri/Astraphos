import { notFound } from "next/navigation";
import { KnowledgeGraph } from "@/components/knowledge-graph";
import { Sidebar } from "@/components/sidebar";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function GraphPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const user = await requireUser();
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
    include: {
      workspace: {
        include: {
          pages: { where: { archivedAt: null, deletedAt: null }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] },
          vaultFiles: { orderBy: { updatedAt: "desc" } },
          knowledgeEdges: true,
        },
      },
    },
  });

  if (!membership) notFound();

  const pageIds = new Set(membership.workspace.pages.map((page) => page.id));
  const vaultFileIds = new Set(membership.workspace.vaultFiles.map((file) => file.id));
  const nodeKey = (type: "PAGE" | "VAULT_FILE", id: string) => `${type}:${id}`;
  const degree = new Map<string, number>();
  const links = membership.workspace.knowledgeEdges
    .filter((edge) => {
      const sourceExists = edge.sourceType === "PAGE" ? pageIds.has(edge.sourceId) : vaultFileIds.has(edge.sourceId);
      const targetExists = edge.targetType === "PAGE" ? pageIds.has(edge.targetId) : vaultFileIds.has(edge.targetId);
      return sourceExists && targetExists;
    })
    .map((edge) => {
      const source = nodeKey(edge.sourceType, edge.sourceId);
      const target = nodeKey(edge.targetType, edge.targetId);
      degree.set(source, (degree.get(source) ?? 0) + 1);
      degree.set(target, (degree.get(target) ?? 0) + 1);
      return { source, target, type: edge.type };
    });
  const nodes = [
    ...membership.workspace.pages.map((page) => ({ id: nodeKey("PAGE", page.id), type: "PAGE" as const, title: page.title || "Untitled", href: `/w/${workspaceId}/p/${page.id}`, degree: degree.get(nodeKey("PAGE", page.id)) ?? 0 })),
    ...membership.workspace.vaultFiles.map((file) => ({ id: nodeKey("VAULT_FILE", file.id), type: "VAULT_FILE" as const, title: file.title || file.fileName, href: `/w/${workspaceId}/vault/${file.id}`, degree: degree.get(nodeKey("VAULT_FILE", file.id)) ?? 0 })),
  ];

  return (
    <main className="grid min-h-dvh grid-cols-1 md:grid-cols-[18rem_1fr]">
      <Sidebar user={user} workspace={membership.workspace} pages={membership.workspace.pages} />
      <section className="min-w-0 bg-zinc-50 px-5 py-8 dark:bg-zinc-950 md:px-8">
        <div className="mb-6">
          <p className="text-sm font-medium text-cyan-600 dark:text-cyan-300">Interactive knowledge graph</p>
          <h1 className="mt-1 text-4xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Graph</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-500">Explore wiki links between notes and Vault Markdown files. Click any node to jump directly to it.</p>
        </div>
        <KnowledgeGraph nodes={nodes} links={links} />
      </section>
    </main>
  );
}
