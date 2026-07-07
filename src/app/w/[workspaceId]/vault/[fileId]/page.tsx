import { notFound } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { VaultEditor } from "@/components/vault-editor";
import { Backlinks, type Backlink } from "@/components/backlinks";
import { deleteVaultFileAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function VaultFilePage({ params }: { params: Promise<{ workspaceId: string; fileId: string }> }) {
  const { workspaceId, fileId } = await params;
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
  const file = membership.workspace.vaultFiles.find((item) => item.id === fileId);
  if (!file) notFound();
  const incomingEdges = await prisma.knowledgeEdge.findMany({ where: { workspaceId, targetType: "VAULT_FILE", targetId: file.id } });
  const sourcePageIds = incomingEdges.filter((edge) => edge.sourceType === "PAGE").map((edge) => edge.sourceId);
  const sourceVaultIds = incomingEdges.filter((edge) => edge.sourceType === "VAULT_FILE").map((edge) => edge.sourceId);
  const [sourcePages, sourceVaultFiles] = await Promise.all([
    prisma.page.findMany({ where: { id: { in: sourcePageIds }, workspaceId, archivedAt: null, deletedAt: null }, select: { id: true, title: true } }),
    prisma.vaultFile.findMany({ where: { id: { in: sourceVaultIds }, workspaceId }, select: { id: true, title: true } }),
  ]);
  const backlinks = incomingEdges.reduce<Backlink[]>((items, edge) => {
    if (edge.sourceType === "PAGE") {
      const source = sourcePages.find((item) => item.id === edge.sourceId);
      if (source) items.push({ id: edge.id, sourceType: "PAGE", title: source.title, href: `/w/${workspaceId}/p/${source.id}` });
      return items;
    }
    const source = sourceVaultFiles.find((item) => item.id === edge.sourceId);
    if (source) items.push({ id: edge.id, sourceType: "VAULT_FILE", title: source.title, href: `/w/${workspaceId}/vault/${source.id}` });
    return items;
  }, []);

  return (
    <main className="grid min-h-dvh grid-cols-1 md:grid-cols-[18rem_1fr]">
      <Sidebar user={user} workspace={membership.workspace} pages={membership.workspace.pages} />
      <section className="min-w-0 bg-white dark:bg-zinc-950">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-2 dark:border-zinc-800">
          <div className="text-sm text-zinc-500">/vault/{file.fileName}</div>
          <form action={deleteVaultFileAction}>
            <input type="hidden" name="workspaceId" value={workspaceId} />
            <input type="hidden" name="fileId" value={file.id} />
            <button className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-950 dark:text-red-300 dark:hover:bg-red-950/40">Delete</button>
          </form>
        </div>
        <VaultEditor workspaceId={workspaceId} file={{ id: file.id, title: file.title, fileName: file.fileName, content: file.content }} />
        <Backlinks backlinks={backlinks} />
      </section>
    </main>
  );
}
