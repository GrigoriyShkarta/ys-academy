// typescript
import { DragEventHandler, useCallback, useState } from 'react';

type Options = {
  onFile?: (file: File) => void;
  openModalSetter?: (open: boolean) => void;
  accept?: string | string[]; // например 'audio', 'image/*', 'image/jpeg' или ['image/*', 'audio/*']
};

function matchesAccept(fileType: string, acceptEntry: string): boolean {
  if (!acceptEntry) return true;
  // normalize
  const a = acceptEntry.trim();
  // wildcard like image/*
  if (a.endsWith('/*')) {
    const prefix = a.split('/')[0];
    return fileType.startsWith(prefix + '/');
  }
  // exact mime like image/jpeg
  if (a.includes('/')) {
    return fileType === a;
  }
  // prefix like 'image' or 'audio'
  return fileType.startsWith(a + '/');
}

export default function useDragAndDropMaterial(options?: Options) {
  const { onFile, openModalSetter, accept = 'audio' } = options || {};
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

      const dropped = e.dataTransfer?.files?.[0];
      if (!dropped) return;

      const accepts = Array.isArray(accept) ? accept : [accept];
      const ok = accepts.some(a => matchesAccept(dropped.type, a));
      if (!ok) return;

      setFile(dropped);
      if (onFile) onFile(dropped);
      if (openModalSetter) openModalSetter(true);
    },
    [accept, onFile, openModalSetter]
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
