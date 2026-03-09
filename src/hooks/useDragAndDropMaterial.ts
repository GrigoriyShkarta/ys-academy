import { DragEventHandler, useCallback, useState } from 'react';

type Options = {
  onFile?: (file: File) => void; // for backward compatibility: single file
  onFiles?: (files: File[]) => void; // new: multiple files
  openModalSetter?: (open: boolean) => void;
  accept?: string | string[]; // например 'audio', 'image/*', 'image/jpeg' или ['image/*', 'audio/*']
};

function matchesAccept(file: File, acceptEntry: string): boolean {
  if (!acceptEntry) return true;
  const a = acceptEntry.trim().toLowerCase();
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  if (a.endsWith('/*')) {
    const prefix = a.replace('/*', '');
    return fileType.startsWith(prefix + '/');
  }
  if (a.startsWith('.')) {
    return fileName.endsWith(a);
  }
  if (a.includes('/')) {
    return fileType === a;
  }
  return fileType.startsWith(a + '/');
}

export default function useDragAndDropMaterial(options?: Options) {
  const { onFile, onFiles, openModalSetter, accept = 'audio' } = options || {};
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const onDragOver = useCallback<DragEventHandler<HTMLDivElement>>(e => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const onDragLeave = useCallback<DragEventHandler<HTMLDivElement>>(e => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const onDrop = useCallback<DragEventHandler<HTMLDivElement>>(
    e => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const filesList = e.dataTransfer?.files;
      if (!filesList || filesList.length === 0) return;

      const accepts = Array.isArray(accept) ? accept : [accept];
      const filesArray = Array.from(filesList).filter(f =>
        accepts.some(a => matchesAccept(f, a))
      );
      if (filesArray.length === 0) return;

      // keep last as single-file for backward compatibility
      setFile(filesArray[0]);
      if (onFile) onFile(filesArray[0]);
      if (onFiles) onFiles(filesArray);
      if (openModalSetter) openModalSetter(true);
    },
    [accept, onFile, onFiles, openModalSetter]
  );

  return {
    dragActive,
    file,
    setFile,
    onDragOver,
    onDragLeave,
    onDrop,
  } as const;
}
