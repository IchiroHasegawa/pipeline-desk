"use client";

import type { Asset, AssetFile } from "@/types/production";
import { X, ExternalLink, Download } from "lucide-react";

type AssetFileDetailsProps = {
  asset: Asset;
  file: AssetFile;
  isOpen: boolean;
  onClose: () => void;
};

export default function AssetFileDetails({ asset, file, isOpen, onClose }: AssetFileDetailsProps) {
  if (!isOpen) return null;

  const handleDownload = () => {
    window.location.href = `/api/assets/${asset.id}/files/${file.id}/download`;
  };

  const handleOpenDrive = () => {
    window.open(`/api/assets/${asset.id}/files/${file.id}/open`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="flex w-full max-w-md flex-col rounded-lg border border-zinc-800 bg-zinc-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 p-4">
          <h2 className="text-lg font-semibold text-zinc-100">File Details</h2>
          <button 
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col p-4 space-y-4 max-h-[80vh] overflow-y-auto">
          <DetailRow label="File Name" value={file.fileName} />
          <DetailRow label="Original File Name" value={file.originalFileName || "-"} />
          <DetailRow label="Asset" value={asset.assetName} />
          <DetailRow label="Asset Code" value={asset.assetCode} />
          <DetailRow label="Category" value={asset.category?.name || "Uncategorized"} />
          <DetailRow label="File Role" value={file.fileRole || "Unknown"} />
          <DetailRow label="Version" value={file.versionNumber ? String(file.versionNumber) : "-"} />
          <DetailRow label="Extension" value={file.extension || "-"} />
          <DetailRow label="MIME Type" value={file.mimeType || "-"} />
          <DetailRow label="File Size" value={`${(file.sizeBytes / 1024 / 1024).toFixed(2)} MB`} />
          <DetailRow label="Upload Status" value={file.uploadStatus || "Unknown"} />
          <DetailRow label="Uploaded At" value={new Date(file.createdAt).toLocaleString()} />
          
          <div className="pt-4 border-t border-zinc-800 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-300">Technical Details</h3>
            <DetailRow label="Google Drive Created Time" value={file.driveCreatedTime ? new Date(file.driveCreatedTime).toLocaleString() : "-"} />
            <DetailRow label="Google Drive File ID" value={file.driveFileId || "-"} />
            <DetailRow label="Google Drive Parent Folder" value={file.driveParentFolderId || "-"} />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-zinc-800 p-4 bg-zinc-900 rounded-b-lg">
          <button
            onClick={handleDownload}
            disabled={!file.driveFileId || file.uploadStatus !== "Complete"}
            className="flex items-center gap-2 rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-300 hover:bg-zinc-700 hover:text-white disabled:opacity-50"
          >
            <Download className="h-3 w-3" /> Download
          </button>
          <button
            onClick={handleOpenDrive}
            disabled={!file.driveFileId || file.uploadStatus !== "Complete"}
            className="flex items-center gap-2 rounded bg-white px-3 py-1.5 text-xs font-bold text-black hover:bg-zinc-200 disabled:opacity-50"
          >
            <ExternalLink className="h-3 w-3" /> Open in Google Drive
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <span className="text-[10px] font-bold uppercase text-zinc-500">{label}</span>
      <div className="text-xs text-zinc-300 break-all">{value}</div>
    </div>
  );
}
