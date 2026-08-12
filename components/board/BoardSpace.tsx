/* eslint-disable @next/next/no-img-element */
"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  memo,
} from "react";
import type { BoardElement, CreateElementInput } from "@/types/production-v2";
import type { BoardTool } from "@/components/board/BoardToolbar";
import ImageElement from "@/components/board/elements/ImageElement";
import FolderElement from "@/components/board/elements/FolderElement";
import CommentElement from "@/components/board/elements/CommentElement";
import ArrowElement from "@/components/board/elements/ArrowElement";

export type BoardSpaceProps = {
  boardId: string;
  elements: BoardElement[];
  activeTool: BoardTool;
  onElementsChange: (elements: BoardElement[]) => void;
  onElementCreate?: (input: CreateElementInput) => Promise<BoardElement>;
  onElementDelete?: (id: string) => Promise<void>;
  onElementMove?: (
    moves: Array<{ id: string; x: number; y: number; zIndex?: number }>
  ) => Promise<void>;
  preSelectedId?: string | null;
};

export const BoardSpaceComponent: React.FC<BoardSpaceProps> = ({
  boardId,
  elements,
  activeTool,
  onElementsChange,
  onElementCreate,
  onElementDelete,
  onElementMove,
  preSelectedId = null,
}) => {
  // Pan and Zoom viewport state
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);

  const [prevPreSelectedId, setPrevPreSelectedId] = useState<string | null>(preSelectedId);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(preSelectedId ? [preSelectedId] : [])
  );

  if (preSelectedId !== prevPreSelectedId) {
    setPrevPreSelectedId(preSelectedId);
    if (preSelectedId) {
      setSelectedIds(new Set([preSelectedId]));
    }
  }

  // Modal full-res preview state
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Marquee selection box state
  const [marquee, setMarquee] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Arrow connection in-progress state
  const [connectingFromId, setConnectingFromId] = useState<string | null>(null);

  // Refs for tracking in-flight drag without per-pointermove renders
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const draggingIdsRef = useRef<string[]>([]);
  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialElementPositionsRef = useRef<Record<string, { x: number; y: number }>>({});
  const moveDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Map elements for quick ID lookup
  const elementMap = useMemo(() => {
    const map = new Map<string, BoardElement>();
    elements.forEach((el) => map.set(el.id, el));
    return map;
  }, [elements]);

  // Compute folder item counts
  const folderChildCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    elements.forEach((el) => {
      if (el.parentFolderId) {
        counts[el.parentFolderId] = (counts[el.parentFolderId] || 0) + 1;
      }
    });
    return counts;
  }, [elements]);

  // Zoom & Wheel handler
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      setZoom((prev) => Math.min(3, Math.max(0.25, prev * zoomFactor)));
    } else {
      setPan((prev) => ({
        x: prev.x,
        y: prev.y - e.deltaY,
      }));
    }
  }, []);

  // Screen to Board coordinates conversion
  const screenToBoard = useCallback(
    (screenX: number, screenY: number) => {
      if (!containerRef.current) return { x: screenX, y: screenY };
      const rect = containerRef.current.getBoundingClientRect();
      const relX = screenX - rect.left - pan.x;
      const relY = screenY - rect.top - pan.y;
      return {
        x: relX / zoom,
        y: relY / zoom,
      };
    },
    [pan, zoom]
  );

  // Delete selection handler
  const handleDeleteSelection = useCallback(async () => {
    if (selectedIds.size === 0 || !onElementDelete) return;

    const toDelete = Array.from(selectedIds);
    const hasFolder = toDelete.some(
      (id) => elementMap.get(id)?.elementType === "folder"
    );

    if (hasFolder) {
      const confirmDelete = window.confirm(
        "Deleting a folder will return all inside items back to the board. Continue?"
      );
      if (!confirmDelete) return;
    }

    // Optimistically remove from state
    const nextElements = elements.filter((el) => !selectedIds.has(el.id));
    onElementsChange(nextElements);
    setSelectedIds(new Set());

    try {
      await Promise.all(toDelete.map((id) => onElementDelete(id)));
    } catch (err: unknown) {
      console.error("Failed to delete elements:", err);
    }
  }, [selectedIds, elements, elementMap, onElementDelete, onElementsChange]);

  // Keyboard shortcut listener (Delete / Backspace)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        handleDeleteSelection();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDeleteSelection]);

  const isSpacePressedRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") isSpacePressedRef.current = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") isSpacePressedRef.current = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Handle Pointer Down on Canvas
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || isSpacePressedRef.current || activeTool === "select") {
      if (e.button === 1 || isSpacePressedRef.current) {
        // Start Pan
        isPanningRef.current = true;
        panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
        e.currentTarget.setPointerCapture(e.pointerId);
        return;
      }

      // If clicking empty canvas with select tool, clear selection or start marquee
      if (e.target === e.currentTarget || (e.target as HTMLElement).id === "board-canvas-inner") {
        if (!e.shiftKey) {
          setSelectedIds(new Set());
        }

        const boardPos = screenToBoard(e.clientX, e.clientY);
        setMarquee({
          startX: boardPos.x,
          startY: boardPos.y,
          currentX: boardPos.x,
          currentY: boardPos.y,
        });

        e.currentTarget.setPointerCapture(e.pointerId);
      }
    } else if ((activeTool === "folder" || activeTool === "comment") && onElementCreate) {
      const boardPos = screenToBoard(e.clientX, e.clientY);
      onElementCreate({
        boardId,
        elementType: activeTool,
        x: boardPos.x,
        y: boardPos.y,
        title: activeTool === "folder" ? "New Folder" : undefined,
        body: activeTool === "comment" ? "New Comment" : undefined,
      });
    }
  };

  // Handle Pointer Move on Canvas
  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    if (isPanningRef.current) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
      return;
    }

    if (marquee) {
      const boardPos = screenToBoard(e.clientX, e.clientY);
      setMarquee((prev) =>
        prev ? { ...prev, currentX: boardPos.x, currentY: boardPos.y } : null
      );
    }
  };

  // Handle Pointer Up on Canvas
  const handleCanvasPointerUp = (e: React.PointerEvent) => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      return;
    }

    if (marquee) {
      // Calculate marquee box collision
      const minX = Math.min(marquee.startX, marquee.currentX);
      const maxX = Math.max(marquee.startX, marquee.currentX);
      const minY = Math.min(marquee.startY, marquee.currentY);
      const maxY = Math.max(marquee.startY, marquee.currentY);

      const newlySelected = new Set(selectedIds);
      elements.forEach((el) => {
        const elWidth = el.width || 100;
        const elHeight = el.height || 100;

        if (
          el.x + elWidth >= minX &&
          el.x <= maxX &&
          el.y + elHeight >= minY &&
          el.y <= maxY
        ) {
          newlySelected.add(el.id);
        }
      });

      setSelectedIds(newlySelected);
      setMarquee(null);

      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Element Pointer Down for dragging & selecting
  const handleElementPointerDown = (
    e: React.PointerEvent,
    element: BoardElement
  ) => {
    e.stopPropagation();

    // Arrow Tool Connection mode
    if (activeTool === "arrow") {
      if (!connectingFromId) {
        setConnectingFromId(element.id);
      } else if (connectingFromId !== element.id && onElementCreate) {
        onElementCreate({
          boardId,
          elementType: "arrow",
          x: 0,
          y: 0,
          fromElementId: connectingFromId,
          toElementId: element.id,
        });
        setConnectingFromId(null);
      }
      return;
    }

    // Toggle shift selection
    const nextSelected = new Set(selectedIds);
    if (e.shiftKey) {
      if (nextSelected.has(element.id)) {
        nextSelected.delete(element.id);
      } else {
        nextSelected.add(element.id);
      }
    } else if (!nextSelected.has(element.id)) {
      nextSelected.clear();
      nextSelected.add(element.id);
    }
    setSelectedIds(nextSelected);

    // Prepare in-flight drag
    const idsToDrag = Array.from(nextSelected);
    draggingIdsRef.current = idsToDrag;
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };

    const initialPositions: Record<string, { x: number; y: number }> = {};
    idsToDrag.forEach((id) => {
      const el = elementMap.get(id);
      if (el) initialPositions[id] = { x: el.x, y: el.y };
    });
    initialElementPositionsRef.current = initialPositions;

    // Capture pointer on window level for smooth dragging
    const handleWindowPointerMove = (moveEvt: PointerEvent) => {
      const dx = (moveEvt.clientX - dragStartPosRef.current.x) / zoom;
      const dy = (moveEvt.clientY - dragStartPosRef.current.y) / zoom;

      // Update positions in local elements state
      const updatedElements = elements.map((el) => {
        if (initialPositions[el.id]) {
          return {
            ...el,
            x: Math.round(initialPositions[el.id].x + dx),
            y: Math.round(initialPositions[el.id].y + dy),
          };
        }
        return el;
      });
      onElementsChange(updatedElements);
    };

    const handleWindowPointerUp = () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);

      // Persist moved positions debounced
      if (onElementMove) {
        const moves = draggingIdsRef.current.map((id) => {
          const el = elements.find((e) => e.id === id);
          return { id, x: el?.x || 0, y: el?.y || 0 };
        });

        if (moveDebounceTimerRef.current) {
          clearTimeout(moveDebounceTimerRef.current);
        }
        moveDebounceTimerRef.current = setTimeout(() => {
          onElementMove(moves);
        }, 400);
      }
    };

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);
  };

  // Clipboard Paste (Image data / URL)
  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      if (!onElementCreate) return;
      const items = e.clipboardData.items;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = async (event) => {
              const dataUrl = event.target?.result as string;
              if (dataUrl) {
                const centerPos = screenToBoard(
                  window.innerWidth / 2,
                  window.innerHeight / 2
                );
                await onElementCreate({
                  boardId,
                  elementType: "keyframe",
                  x: centerPos.x,
                  y: centerPos.y,
                  imageUrl: dataUrl,
                });
              }
            };
            reader.readAsDataURL(file);
          }
        }
      }
    },
    [boardId, onElementCreate, screenToBoard]
  );

  // File Drop from OS
  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      if (!onElementCreate) return;

      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/")
      );

      const dropPos = screenToBoard(e.clientX, e.clientY);

      for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const dataUrl = event.target?.result as string;
          if (dataUrl) {
            await onElementCreate({
              boardId,
              elementType: "keyframe",
              x: dropPos.x + i * 40,
              y: dropPos.y + i * 40,
              imageUrl: dataUrl,
            });
          }
        };
        reader.readAsDataURL(files[i]);
      }
    },
    [boardId, onElementCreate, screenToBoard]
  );

  // Render elements in zIndex order
  const nonArrowElements = useMemo(
    () => elements.filter((e) => e.elementType !== "arrow" && !e.parentFolderId),
    [elements]
  );

  const arrowElements = useMemo(
    () => elements.filter((e) => e.elementType === "arrow"),
    [elements]
  );

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onWheel={handleWheel}
      onPaste={handlePaste}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handleCanvasPointerMove}
      onPointerUp={handleCanvasPointerUp}
      className="relative w-full h-full overflow-hidden bg-[var(--color-canvas,#ffffff)] select-none focus:outline-none"
    >
      {/* Canvas Transform Container */}
      <div
        id="board-canvas-inner"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
        }}
        className="absolute inset-0 w-full h-full pointer-events-auto"
      >
        {/* SVG Overlay for Arrows */}
        <svg className="absolute inset-0 w-[5000px] h-[5000px] pointer-events-none overflow-visible z-10">
          {arrowElements.map((arrow) => (
            <ArrowElement
              key={arrow.id}
              element={arrow}
              fromElement={arrow.fromElementId ? elementMap.get(arrow.fromElementId) : undefined}
              toElement={arrow.toElementId ? elementMap.get(arrow.toElementId) : undefined}
              selected={selectedIds.has(arrow.id)}
              onSelect={(e) => {
                e.stopPropagation();
                setSelectedIds(new Set([arrow.id]));
              }}
            />
          ))}
        </svg>

        {/* Board Elements */}
        {nonArrowElements.map((el) => {
          const isSelected = selectedIds.has(el.id);

          return (
            <div
              key={el.id}
              style={{
                position: "absolute",
                left: `${el.x}px`,
                top: `${el.y}px`,
                zIndex: el.zIndex || 1,
              }}
            >
              {el.elementType === "keyframe" || el.elementType === "asset" ? (
                <ImageElement
                  element={el}
                  selected={isSelected}
                  onSelect={(e) => handleElementPointerDown(e, el)}
                  onDoubleClick={() => setPreviewImage(el.imageUrl || null)}
                />
              ) : el.elementType === "folder" ? (
                <FolderElement
                  element={el}
                  childCount={folderChildCounts[el.id] || 0}
                  selected={isSelected}
                  onSelect={(e) => handleElementPointerDown(e, el)}
                  onDoubleClick={() => {
                    alert(`Folder "${el.title || "Untitled"}" contains ${folderChildCounts[el.id] || 0} items.`);
                  }}
                />
              ) : el.elementType === "comment" ? (
                <CommentElement
                  element={el}
                  selected={isSelected}
                  onSelect={(e) => handleElementPointerDown(e, el)}
                  onTextChange={(id, newBody) => {
                    const next = elements.map((item) =>
                      item.id === id ? { ...item, body: newBody } : item
                    );
                    onElementsChange(next);
                  }}
                />
              ) : null}
            </div>
          );
        })}

        {/* Marquee Drag Box */}
        {marquee && (
          <div
            style={{
              left: `${Math.min(marquee.startX, marquee.currentX)}px`,
              top: `${Math.min(marquee.startY, marquee.currentY)}px`,
              width: `${Math.abs(marquee.currentX - marquee.startX)}px`,
              height: `${Math.abs(marquee.currentY - marquee.startY)}px`,
            }}
            className="absolute border border-black bg-black/10 pointer-events-none z-50"
          />
        )}
      </div>

      {/* Full-Res Image Preview Modal Overlay */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8 cursor-pointer"
        >
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-md shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};

export const BoardSpace = memo(BoardSpaceComponent);
export default BoardSpace;
