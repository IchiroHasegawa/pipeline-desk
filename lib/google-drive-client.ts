export type UploadState = "Queued" | "Preparing" | "Uploading" | "Finalizing" | "Complete" | "Failed" | "Cancelled";

export interface UploadProgress {
  bytesUploaded: number;
  totalBytes: number;
  percentage: number;
  status: UploadState;
  error?: string;
}

export interface UploadOptions {
  assetId: string;
  file: File;
  destination: "Source" | "Preview" | "Versions";
  sourceFileId?: string;
  onProgress: (progress: UploadProgress) => void;
  signal?: AbortSignal;
}

// 8 MiB chunks, multiple of 256 KB
const CHUNK_SIZE = 8 * 1024 * 1024;
const MAX_RETRIES = 5;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function getUploadSession(assetId: string, file: File, destination: string, sourceFileId?: string, signal?: AbortSignal) {
  const response = await fetch("/api/google-drive/uploads/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      assetId,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      destination,
      sourceFileId,
    }),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || "Failed to initiate upload session");
  }

  const { sessionUri } = await response.json();
  if (!sessionUri) throw new Error("Upload session URI is missing");

  return sessionUri;
}

async function finalizeUpload(assetId: string, driveFileId: string, expectedDestination: string, sourceFileId?: string, signal?: AbortSignal) {
  const response = await fetch("/api/google-drive/uploads/finalize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      assetId,
      driveFileId,
      expectedDestination,
      sourceFileId,
    }),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || "Failed to finalize upload");
  }

  return response.json();
}

async function queryUploadStatus(sessionUri: string, totalSize: number, signal?: AbortSignal): Promise<number> {
  const response = await fetch(sessionUri, {
    method: "PUT",
    headers: {
      "Content-Range": `bytes */${totalSize}`,
    },
    signal,
  });

  if (response.status === 308) {
    const range = response.headers.get("Range");
    if (range) {
      const parts = range.split("-");
      return parseInt(parts[1], 10) + 1;
    }
  }
  
  if (response.status === 200 || response.status === 201) {
    return totalSize;
  }

  return 0; // Start from beginning if can't determine
}

export async function uploadAssetFile(options: UploadOptions): Promise<void> {
  const { assetId, file, destination, sourceFileId, onProgress, signal } = options;
  let sessionUri = "";
  
  const updateProgress = (state: Partial<UploadProgress>) => {
    if (signal?.aborted) return;
    onProgress({
      bytesUploaded: state.bytesUploaded ?? 0,
      totalBytes: file.size,
      percentage: state.percentage ?? 0,
      status: state.status ?? "Queued",
      error: state.error,
    });
  };

  try {
    updateProgress({ status: "Preparing" });
    sessionUri = await getUploadSession(assetId, file, destination, sourceFileId, signal);
    
    let uploadedBytes = 0;
    let driveFileId = "";
    
    updateProgress({ status: "Uploading", bytesUploaded: 0, percentage: 0 });

    while (uploadedBytes < file.size) {
      if (signal?.aborted) {
        throw new Error("Upload cancelled");
      }

      const chunkEnd = Math.min(uploadedBytes + CHUNK_SIZE, file.size);
      const chunk = file.slice(uploadedBytes, chunkEnd);
      let chunkRetryCount = 0;
      let chunkSuccess = false;

      while (!chunkSuccess && chunkRetryCount < MAX_RETRIES) {
        if (signal?.aborted) {
          throw new Error("Upload cancelled");
        }
        
        try {
          const headers: Record<string, string> = {
            "Content-Range": `bytes ${uploadedBytes}-${chunkEnd - 1}/${file.size}`,
          };
          
          const response = await fetch(sessionUri, {
            method: "PUT",
            headers,
            body: chunk,
            signal,
          });

          if (response.status === 308) { // Resume Incomplete
            const range = response.headers.get("Range");
            if (range) {
              const parts = range.split("-");
              uploadedBytes = parseInt(parts[1], 10) + 1;
            } else {
              // If no range returned but 308, we should query status
              uploadedBytes = await queryUploadStatus(sessionUri, file.size, signal);
            }
            chunkSuccess = true;
          } else if (response.status === 200 || response.status === 201) {
            uploadedBytes = file.size;
            chunkSuccess = true;
            
            // Get drive file id from response
            const responseData = await response.json().catch(() => null);
            if (responseData && responseData.id) {
              driveFileId = responseData.id;
            }
          } else if (response.status >= 500 || response.status === 429) {
            throw new Error(`Server error ${response.status}`);
          } else {
            // Other 4xx error (e.g. 404 session expired)
            throw new Error(`Upload failed with status ${response.status}`);
          }
        } catch (err: unknown) {
          if (err instanceof Error && err.name === "AbortError") throw err;
          
          chunkRetryCount++;
          if (chunkRetryCount >= MAX_RETRIES) {
            throw new Error("Upload interrupted. Max retries exceeded.");
          }
          
          // Exponential backoff
          await sleep(Math.pow(2, chunkRetryCount) * 1000);
          
          // Query the actual progress before retrying the chunk to avoid duplicate byte ranges
          try {
             uploadedBytes = await queryUploadStatus(sessionUri, file.size, signal);
             break; // successful query, retry the outer loop with new uploadedBytes
          } catch {
             // Continue retrying
          }
        }
      }

      updateProgress({
        status: "Uploading",
        bytesUploaded: uploadedBytes,
        percentage: Math.round((uploadedBytes / file.size) * 100),
      });
    }
    
    if (signal?.aborted) throw new Error("Upload cancelled");
    
    if (!driveFileId) {
       throw new Error("Upload completed but Drive File ID was not returned.");
    }
    
    updateProgress({ status: "Finalizing", bytesUploaded: file.size, percentage: 100 });
    const finalResult = await finalizeUpload(assetId, driveFileId, destination, sourceFileId, signal);
    
    updateProgress({ status: "Complete", bytesUploaded: file.size, percentage: 100 });
    return finalResult;
    
  } catch (error: unknown) {
    if (error instanceof Error && (error.name === "AbortError" || error.message === "Upload cancelled")) {
      updateProgress({ status: "Cancelled", error: "Cancelled by user" });
      throw error;
    }
    updateProgress({ status: "Failed", error: error instanceof Error ? error.message : "Upload failed" });
    throw error;
  }
}
