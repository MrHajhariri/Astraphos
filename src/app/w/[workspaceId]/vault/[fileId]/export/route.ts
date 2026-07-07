import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ workspaceId: string; fileId: string }> }) {
  const { workspaceId, fileId } = await params;
  const user = await requireUser();
  const file = await prisma.vaultFile.findFirst({
    where: { id: fileId, workspace: { members: { some: { userId: user.id } } }, workspaceId },
  });
  if (!file) notFound();

  return new Response(file.content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${file.fileName.replace(/"/g, "")}"`,
    },
  });
}
