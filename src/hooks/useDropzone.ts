import { DragEvent, useState } from 'react';
import { useTranslations } from 'next-intl';

interface UseDropzoneOptions {
  onFileSelect?: (file: File | null) => void;
  onFilesSelect?: (files: File[]) => void;
  accept?: string[];
  multiple?: boolean;
  maxFiles?: number;
}

export const useDropzone = ({
  onFileSelect,
  onFilesSelect,
  accept,
  multiple = false,
  maxFiles,
}: UseDropzoneOptions) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('Validation');

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const fileList = Array.from(e.dataTransfer.files || []);
    if (fileList.length === 0) return;

    const filtered = accept
      ? fileList.filter(f => accept.some(type => f.type.startsWith(type)))
      : fileList;

    if (filtered.length === 0) {
      setError(t('invalid_file_type'));
      onFileSelect?.(null);
      return;
    }

    const limited = typeof maxFiles === 'number' ? filtered.slice(0, maxFiles) : filtered;

    setError(null);
    if (multiple) {
      onFilesSelect?.(limited);
    } else {
      onFileSelect?.(limited[0] ?? null);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  return { isDragActive, handleDrop, handleDragOver, handleDragLeave, error };
};
