import JSZip from "jszip";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const user = await requireUser();
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
    include: { workspace: { include: { vaultFiles: { include: { folder: true } } } } },
  });
  if (!membership) return new Response("Not found", { status: 404 });

  const zip = new JSZip();
  for (const file of membership.workspace.vaultFiles) {
    const path = file.folder ? `${file.folder.slug}/${file.fileName}` : file.fileName;
    zip.file(path, file.content);
  }

  const body = await zip.generateAsync({ type: "arraybuffer" });
  return new Response(body, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${membership.workspace.slug}-vault.zip"`,
    },
  });
}
