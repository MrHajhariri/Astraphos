"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { z } from "zod";
import { createSession, destroySession, hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { emptyDoc, extractPlainText, starterTemplate } from "@/lib/editor";
import { slugify } from "@/lib/utils";

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

  const template = templateId
    ? await prisma.template.findFirst({ where: { id: templateId, workspaceId } })
    : null;
  const content = (template?.content as JSONContent | null) ?? emptyDoc;
  const page = await prisma.page.create({
    data: {
      title: template ? template.name : "Untitled",
      workspaceId,
      parentId,
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

  await prisma.$transaction([
    prisma.page.update({
      where: { id: input.pageId, workspaceId: input.workspaceId },
      data: {
        title: input.title.trim() || "Untitled",
        content: input.content,
        plainText: extractPlainText(input.content),
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

export async function uploadAssetAction(formData: FormData) {
  const user = await requireUser();
  const file = formData.get("file");
  const pageId = String(formData.get("pageId") ?? "");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file to upload." };
  if (file.size > 5 * 1024 * 1024) return { error: "Files must be 5 MB or smaller for the MVP." };

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const storedName = `${crypto.randomUUID()}-${safeName}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, storedName), Buffer.from(await file.arrayBuffer()));

  const asset = await prisma.asset.create({
    data: {
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      url: `/uploads/${storedName}`,
      userId: user.id,
      pageId: pageId || null,
    },
  });

  return { url: asset.url, fileName: asset.fileName, mimeType: asset.mimeType };
}
