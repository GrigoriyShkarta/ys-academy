import { useDropzone } from 'react-dropzone';
import { Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  preview?: string | null;
  onSelect: (file: File, preview: string) => void;
}

export function AvatarDropzone({ preview, onSelect }: Props) {
  const onDrop = (files: File[]) => {
    const file = files[0];
    if (!file) return;
    onSelect(file, URL.createObjectURL(file));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    onDrop,
  });

  return (
    <div className="flex justify-center">
      <div
        {...getRootProps()}
        className={cn(
          'relative h-40 w-40 rounded-full overflow-hidden border cursor-pointer group',
          isDragActive && 'ring-2 ring-primary'
        )}
      >
        <input {...getInputProps()} />

        {preview ? (
          <>
            <img src={preview} className="h-full w-full object-cover" alt="Avatar" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
              <Camera className="text-white" />
            </div>
          </>
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
            <Camera />
          </div>
        )}
      </div>
    </div>
  );
}
