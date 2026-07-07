"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FileText, GripVertical, Star } from "lucide-react";
import { reorderPagesAction } from "@/lib/actions";

export type SortablePageNode = {
  id: string;
  title: string;
  parentId: string | null;
  isFavorite: boolean;
};

export function SortablePageTree({ pages, workspaceId, activePageId }: { pages: SortablePageNode[]; workspaceId: string; activePageId?: string }) {
  const [orderedPages, setOrderedPages] = useState(pages);
  const [, startTransition] = useTransition();
  const roots = orderedPages.filter((page) => !page.parentId);

  function reorderSiblings(parentId: string | null, activeId: string, overId: string) {
    const siblings = orderedPages.filter((page) => page.parentId === parentId);
    const oldIndex = siblings.findIndex((page) => page.id === activeId);
    const newIndex = siblings.findIndex((page) => page.id === overId);
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;

    const sortedSiblings = arrayMove(siblings, oldIndex, newIndex);
    const sortedIds = sortedSiblings.map((page) => page.id);
    setOrderedPages((currentPages) => {
      let siblingIndex = 0;
      return currentPages.map((page) => (page.parentId === parentId ? sortedSiblings[siblingIndex++] : page));
    });

    startTransition(async () => {
      await reorderPagesAction({ workspaceId, parentId, orderedIds: sortedIds });
    });
  }

  return <PageTree pages={orderedPages} nodes={roots} workspaceId={workspaceId} activePageId={activePageId} onReorder={reorderSiblings} />;
}

function PageTree({
  pages,
  nodes,
  workspaceId,
  activePageId,
  onReorder,
}: {
  pages: SortablePageNode[];
  nodes: SortablePageNode[];
  workspaceId: string;
  activePageId?: string;
  onReorder: (parentId: string | null, activeId: string, overId: string) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = useMemo(() => nodes.map((page) => page.id), [nodes]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activePage = nodes.find((page) => page.id === active.id);
    const overPage = nodes.find((page) => page.id === over.id);
    if (!activePage || !overPage) return;
    onReorder(activePage.parentId, activePage.id, overPage.id);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {nodes.map((page) => {
          const children = pages.filter((child) => child.parentId === page.id);
          return (
            <div key={page.id}>
              <SortablePageLink page={page} workspaceId={workspaceId} active={page.id === activePageId} />
              {children.length ? (
                <div className="ml-4 border-l border-zinc-200 pl-1 dark:border-zinc-800">
                  <PageTree pages={pages} nodes={children} workspaceId={workspaceId} activePageId={activePageId} onReorder={onReorder} />
                </div>
              ) : null}
            </div>
          );
        })}
      </SortableContext>
    </DndContext>
  );
}

export function PageLink({ page, workspaceId, active, favorite }: { page: SortablePageNode; workspaceId: string; active?: boolean; favorite?: boolean }) {
  return (
    <Link href={`/w/${workspaceId}/p/${page.id}`} className={`group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${active ? "bg-zinc-200 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50" : "text-zinc-600 hover:bg-zinc-200/70 dark:text-zinc-300 dark:hover:bg-zinc-900"}`}>
      {favorite ? <Star size={15} className="fill-current" /> : <FileText size={15} />}
      <span className="truncate">{page.title || "Untitled"}</span>
    </Link>
  );
}

function SortablePageLink({ page, workspaceId, active }: { page: SortablePageNode; workspaceId: string; active?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "relative z-10 opacity-70" : undefined}>
      <div className={`group flex items-center gap-1 rounded-lg pr-1 ${active ? "bg-zinc-200 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50" : "text-zinc-600 hover:bg-zinc-200/70 dark:text-zinc-300 dark:hover:bg-zinc-900"}`}>
        <button type="button" aria-label={`Reorder ${page.title || "Untitled"}`} className="cursor-grab rounded-md p-1 text-zinc-400 opacity-0 outline-none hover:text-zinc-700 group-hover:opacity-100 focus:opacity-100 active:cursor-grabbing dark:hover:text-zinc-200" {...attributes} {...listeners}>
          <GripVertical size={14} />
        </button>
        <Link href={`/w/${workspaceId}/p/${page.id}`} className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-sm">
          <FileText size={15} />
          <span className="truncate">{page.title || "Untitled"}</span>
        </Link>
      </div>
    </div>
  );
}
