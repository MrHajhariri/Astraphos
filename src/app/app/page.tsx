import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AppRedirectPage() {
  const user = await requireUser();
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    include: { workspace: { include: { pages: { where: { archivedAt: null, deletedAt: null }, orderBy: [{ position: "asc" }, { createdAt: "asc" }], take: 1 } } } },
  });

  if (!membership) redirect("/signup");
  const firstPage = membership.workspace.pages[0];
  redirect(firstPage ? `/w/${membership.workspace.id}/p/${firstPage.id}` : `/w/${membership.workspace.id}/search`);
}
