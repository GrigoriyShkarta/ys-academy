import { Dispatch, SetStateAction } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader, Trash2 } from 'lucide-react';

interface Props {
  fetchingIdx?: number | null;
  uploadedFiles: File[];
  setUploadedFiles: Dispatch<SetStateAction<File[]>>;
}

export default function AudioPreviewList({ fetchingIdx, uploadedFiles, setUploadedFiles }: Props) {
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
    <div className="flex flex-col gap-3 mt-3 relative">
      <p className="text-xs text-muted-foreground">{`${uploadedFiles.length} / 9`}</p>
      {uploadedFiles.map((f, idx) => (
        <div
          key={idx}
          className={`relative flex items-center gap-3 p-2 border rounded-md ${
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
          <audio src={URL.createObjectURL(f)} controls className="w-68" />
          <div className="flex-1">
            <Input
              value={f.name.replace(/\.[^/.]+$/, '') ?? ''}
              maxLength={50}
              onChange={e => handleTitleChange(idx, e.target.value)}
              placeholder={t('enterTitle')}
            />
          </div>

          <Button type="button" variant="destructive" size="icon" onClick={() => handleDelete(idx)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
