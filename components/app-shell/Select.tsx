"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useId,
  useCallback,
  useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  colour?: string | null;
  disabled?: boolean;
  avatarInitials?: string | null;
}

export interface SelectProps {
  value: string | null;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel: string;
  size?: "sm" | "md";
}

export const Select: React.FC<SelectProps> = ({
  value,
  options,
  onChange,
  placeholder = "Select...",
  disabled = false,
  ariaLabel,
  size = "sm",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const listboxId = useId();

  const selectedIndex = options.findIndex((opt) => opt.value === value);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;

  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const [coords, setCoords] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    minWidth: number;
    maxHeight: number;
    flipped: boolean;
  } | null>(null);

  const openPopover = useCallback(
    (initialIdx?: number) => {
      const idx = initialIdx ?? (selectedIndex >= 0 ? selectedIndex : 0);
      setHighlightedIndex(idx);
      setIsOpen(true);
    },
    [selectedIndex]
  );

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const flipAbove = spaceBelow < 220 && spaceAbove > spaceBelow;

    const minWidth = Math.max(rect.width, 120);
    const maxViewportWidth = window.innerWidth;
    const left = Math.min(
      Math.max(8, rect.left),
      maxViewportWidth - minWidth - 8
    );

    if (flipAbove) {
      setCoords({
        bottom: window.innerHeight - rect.top + 4,
        left,
        minWidth,
        maxHeight: Math.min(220, Math.max(80, spaceAbove)),
        flipped: true,
      });
    } else {
      setCoords({
        top: rect.bottom + 4,
        left,
        minWidth,
        maxHeight: Math.min(220, Math.max(80, spaceBelow)),
        flipped: false,
      });
    }
  }, []);

  // Update position on open, scroll, or resize
  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  // Outside pointerdown handler
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (
        triggerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && optionRefs.current[highlightedIndex]) {
      optionRefs.current[highlightedIndex]?.scrollIntoView({
        block: "nearest",
      });
    }
  }, [isOpen, highlightedIndex]);

  const selectOptionAt = useCallback(
    (index: number) => {
      const opt = options[index];
      if (opt && !opt.disabled) {
        onChange(opt.value);
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    },
    [options, onChange]
  );

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        openPopover();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        openPopover(options.length - 1);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === "Tab") {
      setIsOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      e.stopPropagation();
      setHighlightedIndex((prev) => {
        let next = prev + 1;
        while (next < options.length && options[next].disabled) {
          next += 1;
        }
        return next < options.length ? next : prev;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      e.stopPropagation();
      setHighlightedIndex((prev) => {
        let next = prev - 1;
        while (next >= 0 && options[next].disabled) {
          next -= 1;
        }
        return next >= 0 ? next : prev;
      });
    } else if (e.key === "Home") {
      e.preventDefault();
      e.stopPropagation();
      const firstEnabled = options.findIndex((o) => !o.disabled);
      if (firstEnabled >= 0) setHighlightedIndex(firstEnabled);
    } else if (e.key === "End") {
      e.preventDefault();
      e.stopPropagation();
      for (let i = options.length - 1; i >= 0; i--) {
        if (!options[i].disabled) {
          setHighlightedIndex(i);
          break;
        }
      }
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      if (highlightedIndex >= 0) {
        selectOptionAt(highlightedIndex);
      }
    }
  };

  const isSmall = size === "sm";

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) {
            if (isOpen) {
              setIsOpen(false);
            } else {
              openPopover();
            }
          }
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        onKeyDown={handleTriggerKeyDown}
        className={`group inline-flex items-center gap-1.5 border border-[var(--po-line)] bg-[var(--po-card)] text-[var(--po-ink)] shadow-[var(--po-shadow-sm)] outline-none transition-all duration-150 hover:border-[var(--po-line-2)] hover:bg-[var(--po-panel)] focus-visible:ring-1 focus-visible:ring-[var(--po-accent)] ${
          isSmall
            ? "h-6 rounded-full px-2 text-[12px] font-medium"
            : "h-8 rounded-[10px] px-3 text-[13px] font-medium"
        } ${
          disabled
            ? "opacity-40 cursor-not-allowed pointer-events-none"
            : "cursor-pointer"
        }`}
      >
        {/* Colour dot if present on selected option */}
        {selectedOption?.colour && (
          <span
            className="h-1.5 w-1.5 flex-none rounded-full"
            style={{ backgroundColor: selectedOption.colour }}
          />
        )}

        {/* Avatar initials if present on selected option */}
        {selectedOption?.avatarInitials && (
          <span className="flex h-4 w-4 flex-none items-center justify-center rounded-full bg-[var(--po-chip)] text-[8.5px] font-bold text-[var(--po-ink-2)]">
            {selectedOption.avatarInitials}
          </span>
        )}

        {/* Selected label */}
        <span className="truncate max-w-[130px]">
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        {/* Chevron Icon */}
        <ChevronDown
          size={isSmall ? 11 : 12}
          className={`flex-none text-[var(--po-ink-3)] transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Popover Portal */}
      {mounted &&
        isOpen &&
        coords &&
        createPortal(
          <div
            ref={popoverRef}
            id={listboxId}
            role="listbox"
            aria-label={ariaLabel}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: coords.top !== undefined ? `${coords.top}px` : undefined,
              bottom:
                coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
              left: `${coords.left}px`,
              minWidth: `${coords.minWidth}px`,
              maxHeight: `${coords.maxHeight}px`,
            }}
            className="z-50 flex flex-col gap-0.5 overflow-y-auto rounded-[12px] border border-[var(--po-line-2)] bg-[var(--po-card)] p-1 text-[12px] text-[var(--po-ink)] shadow-[var(--po-shadow-lift)] outline-none animate-in fade-in-0 zoom-in-95 duration-100"
          >
            {options.map((opt, idx) => {
              const isSelected = opt.value === value;
              const isHighlighted = idx === highlightedIndex;

              return (
                <div
                  key={opt.value}
                  ref={(el) => {
                    optionRefs.current[idx] = el;
                  }}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={opt.disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!opt.disabled) {
                      selectOptionAt(idx);
                    }
                  }}
                  onMouseEnter={() => {
                    if (!opt.disabled) {
                      setHighlightedIndex(idx);
                    }
                  }}
                  className={`flex items-center gap-2 rounded-[8px] px-2.5 py-1.5 transition-colors select-none ${
                    opt.disabled
                      ? "opacity-40 cursor-not-allowed pointer-events-none"
                      : "cursor-pointer"
                  } ${
                    isHighlighted ? "bg-[var(--po-chip)]" : "bg-transparent"
                  } ${
                    isSelected
                      ? "font-semibold text-[var(--po-ink)]"
                      : "font-normal text-[var(--po-ink)]"
                  }`}
                >
                  {/* Option Colour Dot */}
                  {opt.colour && (
                    <span
                      className="h-1.5 w-1.5 flex-none rounded-full"
                      style={{ backgroundColor: opt.colour }}
                    />
                  )}

                  {/* Option Avatar Initials */}
                  {opt.avatarInitials && (
                    <span className="flex h-4 w-4 flex-none items-center justify-center rounded-full bg-[var(--po-chip)] text-[8.5px] font-bold text-[var(--po-ink-2)]">
                      {opt.avatarInitials}
                    </span>
                  )}

                  <span className="flex-1 truncate">{opt.label}</span>

                  {isSelected && (
                    <Check
                      size={12}
                      className="flex-none text-[var(--po-accent)]"
                    />
                  )}
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
};
