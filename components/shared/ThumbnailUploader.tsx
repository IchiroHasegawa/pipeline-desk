"use client";

import { UploadCloud } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

type ThumbnailUploaderProps = {
  value: string;
  onChange: (url: string) => void;
};

export default function ThumbnailUploader({ value, onChange }: ThumbnailUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const objectUrl = URL.createObjectURL(file);
      onChange(objectUrl);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const objectUrl = URL.createObjectURL(file);
      onChange(objectUrl);
    }
  };

  return (
    <div className="flex flex-col w-[180px] shrink-0">
      <div 
        className={`relative flex h-[180px] flex-col items-center justify-center rounded-t border-2 border-b-0 border-dashed transition-colors ${
          isDragging ? "border-blue-500 bg-blue-500/10" : "border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
        } ${value ? "p-1" : "p-4"}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          accept="image/*"
          onChange={handleFileChange}
          className="absolute inset-0 cursor-pointer opacity-0 z-10"
        />
        {value ? (
          <Image src={value} alt="Thumbnail preview" fill className="object-cover rounded-sm" unoptimized />
        ) : (
          <>
            <UploadCloud className="mb-2 h-10 w-10 text-zinc-500" />
            <span className="text-center text-sm font-semibold text-zinc-400">Drop Files Here</span>
          </>
        )}
      </div>
      <div className="rounded-b bg-zinc-800 px-3 py-3 border-x border-b border-zinc-700 flex items-center justify-center">
        <span className="text-[11px] font-bold text-zinc-300 text-center leading-tight">Add a default thumbnail</span>
      </div>
    </div>
  );
}
