import { Dispatch, SetStateAction } from 'react';
import { useTranslations } from 'next-intl';
import { Loader } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Props {
  fetchingIdx?: number | null;
  uploadedFiles: File[];
  setUploadedFiles: Dispatch<SetStateAction<File[]>>;
}

export default function PhotoPreviewList({ fetchingIdx, uploadedFiles, setUploadedFiles }: Props) {
  const t = useTranslations('Materials');

  const handleTitleChange = (index: number, value: string) => {
    setUploadedFiles(prev => {
      const copy = [...prev];
      const file = copy[index];
      copy[index] = new File([file], value + file.name.substring(file.name.lastIndexOf('.')), {
        type: file.type,
      });
      return copy;
    });
  };

  const handleDelete = (index: number) => {
    setUploadedFiles(prev => {
      const copy = [...prev];
      copy.splice(index, 1);
      return copy.length > 0 ? copy : [];
    });
  };

  if (!uploadedFiles || uploadedFiles.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">{`${uploadedFiles.length} / 9`}</p>

      <div
        className={`mt-3 grid ${uploadedFiles.length === 1 && 'grid-cols-1'} ${
          uploadedFiles.length === 2 && 'grid-cols-2'
        } ${uploadedFiles.length > 2 && 'grid-cols-3'} gap-3`}
      >
        {uploadedFiles.map((f, idx) => (
          <div
            key={idx}
            className={`relative flex flex-col overflow-hidden rounded-md border border-border p-2 ${
              fetchingIdx === idx ? 'bg-accent/10' : 'bg-background'
            }`}
          >
            {fetchingIdx === idx && (
              <Loader
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin`}
                color={'#65a1f5'}
                size={38}
              />
            )}

            <img
              src={URL.createObjectURL(f)}
              alt={f.name}
              className="w-full h-full object-contain"
            />

            <div className="mt-2">
              <Input
                placeholder={t('enterTitle')}
                value={f.name.replace(/\.[^/.]+$/, '') ?? ''}
                onChange={e => handleTitleChange(idx, e.target.value)}
              />
            </div>

            <button
              className="absolute top-1 right-1 rounded bg-white/80 p-1 text-xs"
              onClick={() => handleDelete(idx)}
              aria-label="remove-file"
              type="button"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
