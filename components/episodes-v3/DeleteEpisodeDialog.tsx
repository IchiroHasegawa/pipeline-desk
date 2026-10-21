"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import type { EpisodeV2 } from "@/types/production-v2";
import { deleteEpisodeV2 } from "@/app/actions/production";

export interface DeleteEpisodeDialogProps {
  isOpen: boolean;
  episode: EpisodeV2 | null;
  onClose: () => void;
  onDeleted: (deletedEpisodeId: string) => void;
}

interface DeleteEpisodeModalProps {
  episode: EpisodeV2;
  onClose: () => void;
  onDeleted: (deletedEpisodeId: string) => void;
}

const DeleteEpisodeModal: React.FC<DeleteEpisodeModalProps> = ({
  episode,
  onClose,
  onDeleted,
}) => {
  const [typedName, setTypedName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDeleting, onClose]);

  const isNameMatch = typedName.trim() === episode.episodeName.trim();

  const handleDelete = async () => {
    if (!isNameMatch || isDeleting) return;

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await deleteEpisodeV2(episode.id);
      onDeleted(episode.id);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-episode-title"
        className="relative flex w-full max-w-[440px] flex-col gap-5 rounded-[22px] border border-[var(--po-line)] bg-[var(--po-card)] p-6 shadow-[var(--po-shadow-lg)]"
        style={{
          fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
        }}
      >
        {/* Close icon */}
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          aria-label="Close dialog"
          className="absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-none bg-[var(--po-chip)] text-[var(--po-ink-2)] transition-opacity hover:opacity-80 disabled:opacity-40"
        >
          <X size={15} />
        </button>

        {/* Title and Icon */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#E5534B]/15 text-[#E5534B]">
            <AlertTriangle size={20} />
          </div>
          <div className="flex flex-col gap-1 pr-6">
            <h2
              id="delete-episode-title"
              className="m-0 text-[18px] font-semibold tracking-[-0.01em] text-[var(--po-ink)]"
            >
              Delete {episode.episodeName}?
            </h2>
            <p className="m-0 text-[13px] leading-[1.5] text-[var(--po-ink-2)]">
              This permanently deletes its scenes, tasks, days, To Dos, commits
              and boards.
            </p>
          </div>
        </div>

        {/* Error message banner */}
        {errorMessage && (
          <div className="rounded-[10px] border border-[#E5534B]/30 bg-[#E5534B]/10 p-3 text-[13px] text-[#E5534B]">
            {errorMessage}
          </div>
        )}

        {/* Confirmation Input */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="confirm-name-input"
            className="text-[12px] font-medium text-[var(--po-ink-2)]"
          >
            To confirm, type the episode name{" "}
            <span className="font-semibold text-[var(--po-ink)]">
              {episode.episodeName}
            </span>{" "}
            below:
          </label>
          <input
            id="confirm-name-input"
            autoFocus
            type="text"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            disabled={isDeleting}
            placeholder={episode.episodeName}
            className="h-[38px] w-full rounded-[10px] border border-[var(--po-line-2)] bg-[var(--po-sunken)] px-3 text-[14px] font-medium text-[var(--po-ink)] outline-none transition-colors focus:border-[var(--po-accent)] focus:ring-1 focus:ring-[var(--po-accent)]"
          />
        </div>

        {/* Action Buttons */}
        <div className="mt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="inline-flex h-[36px] cursor-pointer items-center justify-center rounded-full border border-[var(--po-line-2)] bg-transparent px-4 text-[13px] font-medium text-[var(--po-ink)] transition-colors hover:bg-[var(--po-chip)] disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!isNameMatch || isDeleting}
            className="inline-flex h-[36px] cursor-pointer items-center justify-center gap-2 rounded-full border-none bg-[#E5534B] px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 size={14} />
            <span>{isDeleting ? "Deleting..." : "Delete episode"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const DeleteEpisodeDialog: React.FC<DeleteEpisodeDialogProps> = ({
  isOpen,
  episode,
  onClose,
  onDeleted,
}) => {
  if (!isOpen || !episode) return null;

  return (
    <DeleteEpisodeModal
      key={episode.id}
      episode={episode}
      onClose={onClose}
      onDeleted={onDeleted}
    />
  );
};
