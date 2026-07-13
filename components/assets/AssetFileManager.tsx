"use client";

import { useState, useMemo } from "react";
import type { Asset, AssetFile } from "@/types/production";
import { X, Search, FileIcon, FolderOpen, RefreshCw, ChevronDown, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import AssetFileDetails from "./AssetFileDetails";
import VersionUploadDialog from "./VersionUploadDialog";
import { useRouter } from "next/navigation";

type AssetFileManagerProps = {
  asset: Asset;
  isOpen: boolean;
  onClose: () => void;
};

type SortOption = "Newest" | "Oldest" | "Name A-Z" | "Name Z-A" | "Largest" | "Smallest";
type TabOption = "All Files" | "Source" | "Preview" | "Versions";

export default function AssetFileManager({ asset, isOpen, onClose }: AssetFileManagerProps) {
  const [activeTab, setActiveTab] = useState<TabOption>("All Files");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("Newest");
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  
  const [selectedFile, setSelectedFile] = useState<AssetFile | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  const [uploadSource, setUploadSource] = useState<AssetFile | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const router = useRouter();

  const files = asset.files || [];

  // Grouping
  const sourceFiles = files.filter(f => f.fileRole === "Source");
  const previewFiles = files.filter(f => f.fileRole === "Preview");
  const versionFiles = files.filter(f => f.fileRole === "Version" || f.fileRole === "Versions");

  const toggleExpand = (id: string) => {
    setExpandedSources(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      await fetch(`/api/assets/${asset.id}/files/verify`, { method: "POST" });
      router.refresh();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOpenFolder = () => {
    window.open(`/api/assets/${asset.id}/drive-folder`, "_blank");
  };

  const handleSetPreview = async (file: AssetFile) => {
    if (!file.driveFileId) return;
    try {
      await fetch(`/api/assets/${asset.id}/set-preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driveFileId: file.driveFileId })
      });
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredAndSortedFiles = useMemo(() => {
    let toShow: AssetFile[] = [];
    
    if (activeTab === "All Files") {
      toShow = [...sourceFiles, ...previewFiles];
    } else if (activeTab === "Source") {
      toShow = [...sourceFiles];
    } else if (activeTab === "Preview") {
      toShow = [...previewFiles];
    } else if (activeTab === "Versions") {
      toShow = [...versionFiles];
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      toShow = toShow.filter(f => 
        (f.fileName?.toLowerCase().includes(q)) || 
        (f.originalFileName?.toLowerCase().includes(q)) ||
        (f.extension?.toLowerCase().includes(q))
      );
    }

    return toShow.sort((a, b) => {
      if (sortBy === "Newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "Oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "Largest") return b.sizeBytes - a.sizeBytes;
      if (sortBy === "Smallest") return a.sizeBytes - b.sizeBytes;
      if (sortBy === "Name A-Z") return (a.originalFileName || a.fileName).localeCompare(b.originalFileName || b.fileName);
      if (sortBy === "Name Z-A") return (b.originalFileName || b.fileName).localeCompare(a.originalFileName || a.fileName);
      return 0;
    });
  }, [files, activeTab, searchQuery, sortBy, previewFiles, sourceFiles, versionFiles]);

  const renderFileRow = (file: AssetFile, isNested = false) => {
    const versions = versionFiles.filter(v => v.sourceFileId === file.id);
    const hasVersions = versions.length > 0;
    const isExpanded = expandedSources.has(file.id);
    
    return (
      <div key={file.id} className="flex flex-col border border-zinc-800 rounded bg-zinc-900 overflow-hidden">
        <div className={`flex items-center justify-between p-3 ${isNested ? 'bg-zinc-900/50 pl-8' : 'bg-black'}`}>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <FileIcon className="h-5 w-5 text-zinc-500 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-zinc-200 truncate">{file.originalFileName || file.fileName}</span>
              <span className="text-xs text-zinc-500">
                {file.fileRole} {file.versionNumber ? `(v${file.versionNumber})` : ""} • 
                {(file.sizeBytes / 1024 / 1024).toFixed(2)} MB • 
                {file.uploadStatus} • 
                {new Date(file.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {file.uploadStatus === "Complete" && (
              <>
                <button 
                  onClick={() => window.open(`/api/assets/${asset.id}/files/${file.id}/open`, "_blank")}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Open
                </button>
                <button 
                  onClick={() => window.location.href = `/api/assets/${asset.id}/files/${file.id}/download`}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Download
                </button>
                {file.fileRole === "Source" && (
                  <button 
                    onClick={() => { setUploadSource(file); setIsUploadOpen(true); }}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Upload New Version
                  </button>
                )}
                {file.fileRole === "Preview" && (
                  <button 
                    onClick={() => handleSetPreview(file)}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Set as Asset Preview
                  </button>
                )}
              </>
            )}
            <button 
              onClick={() => { setSelectedFile(file); setIsDetailsOpen(true); }}
              className="text-xs text-zinc-400 hover:text-zinc-200"
            >
              Details
            </button>
          </div>
        </div>
        
        {hasVersions && !isNested && (activeTab === "All Files" || activeTab === "Source") && (
          <div className="border-t border-zinc-800 bg-zinc-950 p-2">
            <button 
              onClick={() => toggleExpand(file.id)}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 w-full"
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              {versions.length} {versions.length === 1 ? "Version" : "Versions"}
            </button>
            {isExpanded && (
              <div className="flex flex-col gap-2 mt-2">
                {versions.map(v => renderFileRow(v, true))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[50] flex items-center justify-end bg-black/50 backdrop-blur-sm p-4">
      <div className="flex h-full w-full max-w-3xl flex-col rounded-lg border border-zinc-800 bg-zinc-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 p-4 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Asset Files</h2>
            <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
              <span>{asset.assetName} ({asset.assetCode})</span>
              <span>•</span>
              <span>{files.length} total files</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleOpenFolder}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 border border-zinc-800 rounded px-2 py-1 bg-zinc-900"
            >
              <FolderOpen className="h-3 w-3" /> Open Asset Folder
            </button>
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} /> Refresh
            </button>
            <button 
              onClick={handleVerify}
              disabled={isVerifying}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 disabled:opacity-50"
            >
              <CheckCircle2 className="h-3 w-3" /> Verify Drive Files
            </button>
            <button onClick={onClose} className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex border-b border-zinc-800 shrink-0">
          {(["All Files", "Source", "Preview", "Versions"] as TabOption[]).map((tab) => {
            const count = tab === "All Files" ? files.length : tab === "Source" ? sourceFiles.length : tab === "Preview" ? previewFiles.length : versionFiles.length;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                }`}
              >
                {tab} <span className="ml-1 text-xs bg-zinc-800 px-1.5 py-0.5 rounded-full">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 p-4 shrink-0 bg-black/50 border-b border-zinc-800">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Quick Search..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-200 outline-none focus:border-zinc-600"
            />
          </div>
          <select 
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            className="bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 outline-none w-40"
          >
            <option>Newest</option>
            <option>Oldest</option>
            <option>Name A-Z</option>
            <option>Name Z-A</option>
            <option>Largest</option>
            <option>Smallest</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredAndSortedFiles.length > 0 ? (
            filteredAndSortedFiles.map(f => renderFileRow(f))
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-zinc-500">
              <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
              <p>
                {searchQuery ? "No files match your search." : 
                 activeTab === "Source" ? "No Source files are available." :
                 activeTab === "Preview" ? "No Preview image is available." :
                 activeTab === "Versions" ? "No file versions have been uploaded." :
                 "No files are attached to this Asset."}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {selectedFile && (
        <AssetFileDetails 
          asset={asset}
          file={selectedFile}
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
        />
      )}

      {uploadSource && (
        <VersionUploadDialog 
          asset={asset}
          sourceFile={uploadSource}
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
        />
      )}
    </div>
  );
}
