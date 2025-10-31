'use client';

import { MouseEvent, useRef } from 'react';
import { useDropzone } from '@/hooks/useDropzone';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { File as FileIcon, Trash2, UploadCloud } from 'lucide-react';
import Image from 'next/image';

interface DropzoneProps {
  value?: File | string | null;
  onChange: (file: File | null) => void;
  label: string;
  dragLabel: string;
  accept: string[];
}

export const Dropzone = ({
  value,
  onChange,
  label,
  dragLabel,
  accept = ['image/', 'audio/'],
}: DropzoneProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { isDragActive, handleDrop, handleDragOver, handleDragLeave, error } = useDropzone(
    onChange,
    accept
  );

  const handleRemove = (e: MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const renderPreview = () => {
    if (!value) return null;

    // Новый файл
    if (value instanceof File) {
      if (value.type.startsWith('image/')) {
        return (
          <Image
            src={URL.createObjectURL(value)}
            fill
            alt="preview"
            className="w-full h-48 object-cover rounded-md"
          />
        );
      }
      if (value.type.startsWith('audio/')) {
        return <audio src={URL.createObjectURL(value)} controls className="w-full mt-2" />;
      }
      return (
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mt-2">
          <FileIcon className="w-5 h-5" /> {value.name}
        </div>
      );
    }

    // Старый файл по url
    const extension = value.split('.').pop()?.toLowerCase();
    if (extension?.match(/(png|jpg|jpeg|gif|webp)$/)) {
      return <img src={value} alt="preview" className="w-full h-48 object-cover rounded-md" />;
    }
    if (extension?.match(/(mp3|wav|ogg)$/)) {
      return <audio src={value} controls className="w-full mt-2" />;
    }
    return (
      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mt-2">
        <FileIcon className="w-5 h-5" /> {value.split('/').pop()}
      </div>
    );
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={e => handleDrop(e, onChange)}
      className={cn(
        'flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors relative',
        isDragActive
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
          : 'border-gray-300 hover:border-blue-400',
        value && 'border-green-500 bg-green-50 dark:bg-green-950'
      )}
    >
      {value && (
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6"
          onClick={handleRemove}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}

      <UploadCloud className="h-8 w-8 text-gray-500 mb-2" />
      <p className="text-sm text-gray-500 mb-1">{dragLabel}</p>
      <p className="text-xs text-gray-400">{label}</p>

      <input
        ref={inputRef}
        type="file"
        accept={accept.map(a => `${a}*`).join(',')}
        className="hidden"
        onClick={e => e.stopPropagation()}
        onChange={e => {
          const file = e.target.files?.[0] ?? null;
          if (file) onChange(file);
        }}
      />

      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

      {value && <div className="mt-3 w-full">{renderPreview()}</div>}
    </div>
  );
};
