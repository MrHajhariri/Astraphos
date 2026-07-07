import { notFound } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { TemplateEditor } from "@/components/template-editor";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function TemplatePage({ params }: { params: Promise<{ workspaceId: string; templateId: string }> }) {
  const { workspaceId, templateId } = await params;
  const user = await requireUser();
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
    include: {
      workspace: {
        include: {
          pages: { where: { archivedAt: null, deletedAt: null }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] },
          templates: { where: { id: templateId } },
        },
      },
    },
  });
  if (!membership) notFound();
  const template = membership.workspace.templates[0];
  if (!template) notFound();

  return (
    <main className="grid min-h-dvh grid-cols-1 md:grid-cols-[18rem_1fr]">
      <Sidebar user={user} workspace={membership.workspace} pages={membership.workspace.pages} />
      <section className="min-w-0 bg-white dark:bg-zinc-950">
        <TemplateEditor workspaceId={workspaceId} template={{ id: template.id, name: template.name, description: template.description, content: template.content as never }} />
      </section>
    </main>
  );
}
