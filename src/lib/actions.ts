"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { z } from "zod";
import { createSession, destroySession, hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { emptyDoc, extractPlainText, starterTemplate } from "@/lib/editor";
import { storeUpload, validateUpload } from "@/lib/storage";
import { slugify } from "@/lib/utils";
import { extractWikiLinks, markdownToPlainText, normalizeWikiTitle } from "@/lib/wiki-links";

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(80).optional(),
});

export async function signUpAction(_: unknown, formData: FormData) {
  const parsed = authSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name") || undefined,
  });

  if (!parsed.success) return { error: "Use a valid email and an 8+ character password." };

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return { error: "That email is already registered." };

  const baseSlug = slugify(`${parsed.data.name || parsed.data.email.split("@")[0]} workspace`);
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email.toLowerCase(),
      name: parsed.data.name,
      passwordHash: await hashPassword(parsed.data.password),
      memberships: {
        create: {
          role: "OWNER",
          workspace: {
            create: {
              name: `${parsed.data.name || "My"} Workspace`,
              slug: `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`,
              templates: {
                create: [
                  {
                    name: "Project Brief",
                    description: "Goals, scope, milestones, and references.",
                    content: starterTemplate,
                  },
                  {
                    name: "Meeting Notes",
                    description: "Agenda, decisions, and action items.",
                    content: {
                      type: "doc",
                      content: [
                        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Meeting Notes" }] },
                        { type: "paragraph", content: [{ type: "text", text: "Agenda" }] },
                        { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph" }] }] },
                      ],
                    },
                  },
                ],
              },
              pages: {
                create: {
                  title: "Welcome to Astraphos",
                  content: starterTemplate,
                  plainText: extractPlainText(starterTemplate),
                },
              },
            },
          },
        },
      },
    },
    include: { memberships: { include: { workspace: { include: { pages: true } } } } },
  });

  await createSession(user.id);
  const workspace = user.memberships[0].workspace;
  redirect(`/w/${workspace.id}/p/${workspace.pages[0].id}`);
}

export async function loginAction(_: unknown, formData: FormData) {
  const parsed = authSchema.omit({ name: true }).safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) return { error: "Use a valid email and password." };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "Invalid email or password." };
  }

  await createSession(user.id);
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    include: { workspace: { include: { pages: { orderBy: { createdAt: "asc" }, take: 1 } } } },
  });
  const firstPage = membership?.workspace.pages[0];
  redirect(firstPage ? `/w/${membership.workspace.id}/p/${firstPage.id}` : "/app");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function createPageAction(formData: FormData) {
  const user = await requireUser();
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const parentId = (formData.get("parentId") as string | null) || null;
  const templateId = (formData.get("templateId") as string | null) || null;
  const membership = await prisma.workspaceMember.findUnique({ where: { userId_workspaceId: { userId: user.id, workspaceId } } });
  if (!membership) throw new Error("Workspace not found");

  if (parentId) {
    const parent = await prisma.page.findFirst({ where: { id: parentId, workspaceId, archivedAt: null, deletedAt: null } });
    if (!parent) throw new Error("Parent page not found");
  }

  const template = templateId
    ? await prisma.template.findFirst({ where: { id: templateId, workspaceId } })
    : null;
  const content = (template?.content as JSONContent | null) ?? emptyDoc;
  const lastSibling = await prisma.page.findFirst({
    where: { workspaceId, parentId, archivedAt: null, deletedAt: null },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const page = await prisma.page.create({
    data: {
      title: template ? template.name : "Untitled",
      workspaceId,
      parentId,
      position: (lastSibling?.position ?? -1) + 1,
      content,
      plainText: extractPlainText(content),
    },
  });

  revalidatePath(`/w/${workspaceId}`);
  redirect(`/w/${workspaceId}/p/${page.id}`);
}

export async function updatePageAction(input: {
  workspaceId: string;
  pageId: string;
  title: string;
  content: JSONContent;
  relationIds: string[];
}) {
  const user = await requireUser();
  const membership = await prisma.workspaceMember.findUnique({ where: { userId_workspaceId: { userId: user.id, workspaceId: input.workspaceId } } });
  if (!membership) throw new Error("Workspace not found");

  const plainText = extractPlainText(input.content);
  await prisma.$transaction([
    prisma.page.update({
      where: { id: input.pageId, workspaceId: input.workspaceId },
      data: {
        title: input.title.trim() || "Untitled",
        content: input.content,
        plainText,
      },
    }),
    prisma.pageRelation.deleteMany({ where: { sourceId: input.pageId, type: "MENTION" } }),
    ...input.relationIds
      .filter((id, index, ids) => id !== input.pageId && ids.indexOf(id) === index)
      .map((targetId) =>
        prisma.pageRelation.create({
          data: { sourceId: input.pageId, targetId, type: "MENTION" },
        }),
      ),
  ]);

  await syncKnowledgeEdges({ workspaceId: input.workspaceId, sourceType: "PAGE", sourceId: input.pageId, text: plainText });

  revalidatePath(`/w/${input.workspaceId}/p/${input.pageId}`);
}

export async function toggleFavoriteAction(formData: FormData) {
  const user = await requireUser();
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const pageId = String(formData.get("pageId") ?? "");
  const page = await prisma.page.findFirst({ where: { id: pageId, workspace: { members: { some: { userId: user.id } } } } });
  if (!page) throw new Error("Page not found");

  await prisma.page.update({ where: { id: pageId }, data: { isFavorite: !page.isFavorite } });
  revalidatePath(`/w/${workspaceId}/p/${pageId}`);
}

export async function archivePageAction(formData: FormData) {
  const user = await requireUser();
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const pageId = String(formData.get("pageId") ?? "");
  const membership = await prisma.workspaceMember.findUnique({ where: { userId_workspaceId: { userId: user.id, workspaceId } } });
  if (!membership) throw new Error("Workspace not found");

  const page = await prisma.page.findFirst({ where: { id: pageId, workspaceId, archivedAt: null, deletedAt: null } });
  if (!page) throw new Error("Page not found");

  const pageIds = await getPageDescendantIds(workspaceId, pageId);
  await prisma.page.updateMany({
    where: { id: { in: pageIds }, workspaceId },
    data: { archivedAt: new Date(), isFavorite: false },
  });

  const nextPage = await prisma.page.findFirst({
    where: { workspaceId, archivedAt: null, deletedAt: null, id: { notIn: pageIds } },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });

  revalidatePath(`/w/${workspaceId}`);
  redirect(nextPage ? `/w/${workspaceId}/p/${nextPage.id}` : `/w/${workspaceId}/archive`);
}

export async function restorePageAction(formData: FormData) {
  const user = await requireUser();
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const pageId = String(formData.get("pageId") ?? "");
  const membership = await prisma.workspaceMember.findUnique({ where: { userId_workspaceId: { userId: user.id, workspaceId } } });
  if (!membership) throw new Error("Workspace not found");

  const page = await prisma.page.findFirst({ where: { id: pageId, workspaceId, archivedAt: { not: null }, deletedAt: null } });
  if (!page) throw new Error("Archived page not found");

  const pageIds = await getPageDescendantIds(workspaceId, pageId);
  await prisma.page.updateMany({
    where: { id: { in: pageIds }, workspaceId, deletedAt: null },
    data: { archivedAt: null },
  });

  revalidatePath(`/w/${workspaceId}`);
  redirect(`/w/${workspaceId}/p/${pageId}`);
}

export async function deletePageAction(formData: FormData) {
  const user = await requireUser();
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const pageId = String(formData.get("pageId") ?? "");
  const membership = await prisma.workspaceMember.findUnique({ where: { userId_workspaceId: { userId: user.id, workspaceId } } });
  if (!membership) throw new Error("Workspace not found");

  const page = await prisma.page.findFirst({ where: { id: pageId, workspaceId, archivedAt: { not: null } } });
  if (!page) throw new Error("Archived page not found");

  await prisma.page.delete({ where: { id: pageId } });
  revalidatePath(`/w/${workspaceId}`);
}

export async function reorderPagesAction(input: { workspaceId: string; parentId: string | null; orderedIds: string[] }) {
  const user = await requireUser();
  const membership = await prisma.workspaceMember.findUnique({ where: { userId_workspaceId: { userId: user.id, workspaceId: input.workspaceId } } });
  if (!membership) throw new Error("Workspace not found");

  const uniqueIds = Array.from(new Set(input.orderedIds));
  if (uniqueIds.length !== input.orderedIds.length) throw new Error("Page order contains duplicate pages");

  const pages = await prisma.page.findMany({
    where: {
      id: { in: uniqueIds },
      workspaceId: input.workspaceId,
      parentId: input.parentId,
      archivedAt: null,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (pages.length !== uniqueIds.length) throw new Error("Page order does not match the current parent");

  await prisma.$transaction(
    uniqueIds.map((id, position) =>
      prisma.page.update({
        where: { id },
        data: { position },
      }),
    ),
  );

  revalidatePath(`/w/${input.workspaceId}`);
}

export async function createTemplateAction(formData: FormData) {
  const user = await requireUser();
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const sourcePageId = String(formData.get("sourcePageId") ?? "");
  const membership = await prisma.workspaceMember.findUnique({ where: { userId_workspaceId: { userId: user.id, workspaceId } } });
  if (!membership) throw new Error("Workspace not found");
  if (!name) throw new Error("Template name is required");

  const sourcePage = sourcePageId
    ? await prisma.page.findFirst({ where: { id: sourcePageId, workspaceId, archivedAt: null, deletedAt: null } })
    : null;

  await prisma.template.create({
    data: {
      name,
      description: description || null,
      content: (sourcePage?.content as JSONContent | null) ?? emptyDoc,
      workspaceId,
    },
  });

  revalidatePath(`/w/${workspaceId}/templates`);
}

export async function updateTemplateAction(formData: FormData) {
  const user = await requireUser();
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const templateId = String(formData.get("templateId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const membership = await prisma.workspaceMember.findUnique({ where: { userId_workspaceId: { userId: user.id, workspaceId } } });
  if (!membership) throw new Error("Workspace not found");
  if (!name) throw new Error("Template name is required");

  await prisma.template.update({
    where: { id: templateId, workspaceId },
    data: { name, description: description || null },
  });

  revalidatePath(`/w/${workspaceId}/templates`);
}

export async function deleteTemplateAction(formData: FormData) {
  const user = await requireUser();
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const templateId = String(formData.get("templateId") ?? "");
  const membership = await prisma.workspaceMember.findUnique({ where: { userId_workspaceId: { userId: user.id, workspaceId } } });
  if (!membership) throw new Error("Workspace not found");

  await prisma.template.delete({ where: { id: templateId, workspaceId } });
  revalidatePath(`/w/${workspaceId}/templates`);
}

export async function updateWorkspaceAction(formData: FormData) {
  const user = await requireUser();
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const membership = await prisma.workspaceMember.findUnique({ where: { userId_workspaceId: { userId: user.id, workspaceId } } });
  if (!membership || membership.role !== "OWNER") throw new Error("Workspace not found");
  if (!name) throw new Error("Workspace name is required");

  const slug = slugify(slugInput || name);
  const existingSlug = await prisma.workspace.findFirst({ where: { slug, id: { not: workspaceId } }, select: { id: true } });
  if (existingSlug) throw new Error("Workspace slug is already in use");

  await prisma.workspace.update({ where: { id: workspaceId }, data: { name, slug } });
  revalidatePath(`/w/${workspaceId}`);
}

export async function createVaultFileAction(formData: FormData) {
  const user = await requireUser();
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const title = String(formData.get("title") ?? "").trim() || "Untitled";
  const membership = await prisma.workspaceMember.findUnique({ where: { userId_workspaceId: { userId: user.id, workspaceId } } });
  if (!membership) throw new Error("Workspace not found");

  const baseFileName = `${slugify(title)}.md`;
  let fileName = baseFileName;
  let suffix = 2;
  while (await prisma.vaultFile.findUnique({ where: { workspaceId_fileName: { workspaceId, fileName } }, select: { id: true } })) {
    fileName = `${slugify(title)}-${suffix}.md`;
    suffix += 1;
  }

  const file = await prisma.vaultFile.create({
    data: {
      title,
      fileName,
      content: `# ${title}\n`,
      plainText: title,
      workspaceId,
    },
  });

  revalidatePath(`/w/${workspaceId}/vault`);
  redirect(`/w/${workspaceId}/vault/${file.id}`);
}

export async function updateVaultFileAction(input: { workspaceId: string; fileId: string; title: string; content: string }) {
  const user = await requireUser();
  const membership = await prisma.workspaceMember.findUnique({ where: { userId_workspaceId: { userId: user.id, workspaceId: input.workspaceId } } });
  if (!membership) throw new Error("Workspace not found");

  await prisma.vaultFile.update({
    where: { id: input.fileId, workspaceId: input.workspaceId },
    data: {
      title: input.title.trim() || "Untitled",
      content: input.content,
      plainText: markdownToPlainText(input.content),
    },
  });

  await syncKnowledgeEdges({ workspaceId: input.workspaceId, sourceType: "VAULT_FILE", sourceId: input.fileId, text: input.content });

  revalidatePath(`/w/${input.workspaceId}/vault/${input.fileId}`);
}

export async function deleteVaultFileAction(formData: FormData) {
  const user = await requireUser();
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const fileId = String(formData.get("fileId") ?? "");
  const membership = await prisma.workspaceMember.findUnique({ where: { userId_workspaceId: { userId: user.id, workspaceId } } });
  if (!membership) throw new Error("Workspace not found");

  await prisma.$transaction([
    prisma.knowledgeEdge.deleteMany({ where: { workspaceId, OR: [{ sourceType: "VAULT_FILE", sourceId: fileId }, { targetType: "VAULT_FILE", targetId: fileId }] } }),
    prisma.vaultFile.delete({ where: { id: fileId, workspaceId } }),
  ]);

  revalidatePath(`/w/${workspaceId}/vault`);
  redirect(`/w/${workspaceId}/vault`);
}

export async function uploadAssetAction(formData: FormData) {
  const user = await requireUser();
  const file = formData.get("file");
  const pageId = String(formData.get("pageId") ?? "");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file to upload." };
  const validationError = validateUpload(file);
  if (validationError) return { error: validationError };

  if (pageId) {
    const page = await prisma.page.findFirst({ where: { id: pageId, archivedAt: null, deletedAt: null, workspace: { members: { some: { userId: user.id } } } } });
    if (!page) return { error: "Page not found." };
  }

  const stored = await storeUpload(file);

  const asset = await prisma.asset.create({
    data: {
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      url: stored.url,
      storageProvider: stored.storageProvider,
      storageKey: stored.storageKey,
      userId: user.id,
      pageId: pageId || null,
    },
  });

  return { url: asset.url, fileName: asset.fileName, mimeType: asset.mimeType };
}

async function getPageDescendantIds(workspaceId: string, pageId: string) {
  const ids = [pageId];
  const queue = [pageId];

  while (queue.length) {
    const parentId = queue.shift();
    const children = await prisma.page.findMany({
      where: { workspaceId, parentId },
      select: { id: true },
    });
    const childIds = children.map((child) => child.id);
    ids.push(...childIds);
    queue.push(...childIds);
  }

  return ids;
}

async function syncKnowledgeEdges({ workspaceId, sourceType, sourceId, text }: { workspaceId: string; sourceType: "PAGE" | "VAULT_FILE"; sourceId: string; text: string }) {
  const linkTitles = extractWikiLinks(text);
  const [pages, vaultFiles] = await Promise.all([
    prisma.page.findMany({ where: { workspaceId, archivedAt: null, deletedAt: null }, select: { id: true, title: true } }),
    prisma.vaultFile.findMany({ where: { workspaceId }, select: { id: true, title: true, fileName: true } }),
  ]);
  const pageTargets = new Map(pages.map((page) => [normalizeWikiTitle(page.title), page.id]));
  const vaultTargets = new Map(vaultFiles.flatMap((file) => [[normalizeWikiTitle(file.title), file.id], [normalizeWikiTitle(file.fileName), file.id]]));

  const edges = linkTitles.flatMap((title) => {
    const pageId = pageTargets.get(title);
    const vaultFileId = vaultTargets.get(title);
    const targets = [];
    if (pageId && !(sourceType === "PAGE" && sourceId === pageId)) targets.push({ targetType: "PAGE" as const, targetId: pageId });
    if (vaultFileId && !(sourceType === "VAULT_FILE" && sourceId === vaultFileId)) targets.push({ targetType: "VAULT_FILE" as const, targetId: vaultFileId });
    return targets;
  });

  await prisma.$transaction([
    prisma.knowledgeEdge.deleteMany({ where: { workspaceId, sourceType, sourceId, type: "WIKI_LINK" } }),
    ...edges.map((edge) =>
      prisma.knowledgeEdge.create({
        data: {
          workspaceId,
          sourceType,
          sourceId,
          targetType: edge.targetType,
          targetId: edge.targetId,
          type: "WIKI_LINK",
        },
      }),
    ),
  ]);
}
