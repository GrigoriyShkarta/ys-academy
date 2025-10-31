import { DragEvent, useState } from 'react';
import { useTranslations } from 'next-intl';

export const useDropzone = (onFileSelect: (file: File | null) => void, accept?: string[]) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('Validation');

  const handleDrop = (e: DragEvent<HTMLDivElement>, onChange: (file: File | null) => void) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const fileType = file.type;

    if (accept && !accept.some(type => fileType.startsWith(type))) {
      setError(t('invalid_file_type'));
      onFileSelect(null);
      return;
    }

    setError(null);
    onFileSelect(file);
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
