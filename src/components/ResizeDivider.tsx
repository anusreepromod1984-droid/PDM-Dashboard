"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

interface ResizeDividerProps {
  side: "left" | "right";
  width: number;
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
  onResize: (newWidth: number) => void;
  onResizeEnd?: (finalWidth: number) => void;
  onReset?: () => void;
  className?: string;
  title?: string;
}

export function ResizeDivider({
  side,
  width,
  minWidth = 260,
  maxWidth = 720,
  defaultWidth = 380,
  onResize,
  onResizeEnd,
  onReset,
  className = "",
  title,
}: ResizeDividerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const currentWidthRef = useRef(width);
  currentWidthRef.current = width;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}

      setIsDragging(true);
      isDraggingRef.current = true;

      // Save initial styling
      const prevUserSelect = document.body.style.userSelect;
      const prevCursor = document.body.style.cursor;
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";

      const handlePointerMove = (moveEvent: PointerEvent) => {
        if (!isDraggingRef.current) return;
        const maxLimit = typeof window !== "undefined"
          ? Math.min(maxWidth, Math.floor(window.innerWidth * 0.75))
          : maxWidth;

        let newWidth: number;
        if (side === "left") {
          // AI Assistant on the right edge: dragging left increases width
          newWidth = window.innerWidth - moveEvent.clientX;
        } else {
          // Sidebar on the left edge: dragging right increases width
          newWidth = moveEvent.clientX;
        }

        const clamped = Math.max(minWidth, Math.min(maxLimit, Math.round(newWidth)));
        onResize(clamped);
      };

      const handlePointerUp = (upEvent: PointerEvent) => {
        isDraggingRef.current = false;
        setIsDragging(false);

        document.body.style.userSelect = prevUserSelect;
        document.body.style.cursor = prevCursor;

        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handlePointerUp);

        if (onResizeEnd) {
          const maxLimit = typeof window !== "undefined"
            ? Math.min(maxWidth, Math.floor(window.innerWidth * 0.75))
            : maxWidth;
          const finalRaw = side === "left"
            ? window.innerWidth - upEvent.clientX
            : upEvent.clientX;
          const finalClamped = Math.max(minWidth, Math.min(maxLimit, Math.round(finalRaw)));
          onResizeEnd(finalClamped);
        }
      };

      window.addEventListener("pointermove", handlePointerMove, { passive: true });
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);
    },
    [maxWidth, minWidth, onResize, onResizeEnd, side]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (onReset) {
        onReset();
      } else {
        onResize(defaultWidth);
        onResizeEnd?.(defaultWidth);
      }
    },
    [defaultWidth, onReset, onResize, onResizeEnd]
  );

  const defaultTitle =
    title ||
    (side === "left"
      ? "Drag to resize AI Assistant width (Double-click to reset)"
      : "Drag to resize Sidebar width (Double-click to reset)");

  return (
    <div
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
      title={defaultTitle}
      aria-label={defaultTitle}
      role="separator"
      aria-orientation="vertical"
      className={`absolute top-0 bottom-0 z-30 w-3.5 cursor-col-resize select-none touch-none group flex items-center justify-center transition-colors ${
        side === "left" ? "-left-[7px]" : "-right-[7px]"
      } ${isDragging ? "bg-accent/20" : "hover:bg-accent/15 active:bg-accent/25"} ${className}`}
    >
      {/* Central drag line and pill */}
      <div
        className={`relative flex items-center justify-center transition-all ${
          isDragging
            ? "h-14 w-1 bg-accent rounded-full shadow-sm"
            : "h-8 w-0.5 bg-border group-hover:h-12 group-hover:w-1 group-hover:bg-accent rounded-full"
        }`}
      >
        {/* Subtle dot grip indicator on hover */}
        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="h-0.5 w-0.5 rounded-full bg-surface-1" />
          <span className="h-0.5 w-0.5 rounded-full bg-surface-1" />
          <span className="h-0.5 w-0.5 rounded-full bg-surface-1" />
        </div>
      </div>

      {/* Floating width badge while dragging */}
      {isDragging && (
        <div
          className={`absolute top-4 pointer-events-none rounded-md bg-surface-3 border border-hairline px-2 py-0.5 text-[10px] font-mono font-semibold text-primary shadow-lg whitespace-nowrap ${
            side === "left" ? "right-6" : "left-6"
          }`}
        >
          {width}px
        </div>
      )}
    </div>
  );
}
