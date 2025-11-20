import { Dispatch, RefObject, SetStateAction, useEffect, useRef, useState } from 'react';
import AvatarEditor from 'react-avatar-editor';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

const cropSize = 300;

interface Props {
  externalImage?: string | null; // изображение, переданное извне (фотобанк)
  onOpenPhotoBank?: () => void;
  setImage: Dispatch<SetStateAction<string>>;
  editorRef?: RefObject<AvatarEditor | null>;
}

export default function PhotoEditor({
  externalImage = null,
  onOpenPhotoBank,
  setImage,
  editorRef,
}: Props) {
  const t = useTranslations('Materials');
  const [isDragging, setIsDragging] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // avatar editor state
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });

  // accept external image (например из фотобанка)
  useEffect(() => {
    if (!externalImage) return;
    setImageSrc(externalImage);
    setImage(externalImage);
    setScale(1);
    setPosition({ x: 0.5, y: 0.5 });
  }, [externalImage]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0] ?? null;
  };

  const clearSelection = () => {
    setImageSrc('');
    setScale(1);
    setPosition({ x: 0.5, y: 0.5 });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onPositionChange = (pos: { x: number; y: number }) => {
    setPosition(pos);
  };

  return (
    <>
      <div
        className={`mx-auto relative border rounded overflow-hidden touch-none select-none`}
        style={{
          width: `${cropSize}px`,
          height: `${cropSize}px`,
        }}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {!imageSrc ? (
          <div
            className={`w-full h-full flex flex-col gap-2 items-center justify-center ${
              isDragging ? 'bg-accent/20 border-dashed' : ''
            }`}
          >
            <Button
              className="bg-accent w-[200px]"
              onClick={() => onOpenPhotoBank && onOpenPhotoBank()}
              type="button"
            >
              {t('take_from_photo_bank')}
            </Button>
          </div>
        ) : (
          <>
            <img src={imageSrc} alt="avatar" className="w-full h-full object-cover" />
            {/*<AvatarEditor*/}
            {/*  ref={editorRef}*/}
            {/*  image={imageSrc}*/}
            {/*  width={cropSize}*/}
            {/*  height={cropSize}*/}
            {/*  border={0}*/}
            {/*  color={[0, 0, 0, 0]}*/}
            {/*  scale={scale}*/}
            {/*  position={position}*/}
            {/*  onPositionChange={onPositionChange}*/}
            {/*  crossOrigin="anonymous"*/}
            {/*/>*/}
            <Button
              variant="destructive"
              className="absolute top-2 right-2"
              onClick={() => {
                clearSelection();
              }}
              type="button"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>

      {/*{imageSrc && (*/}
      {/*  <input*/}
      {/*    type="range"*/}
      {/*    min={0.2}*/}
      {/*    max={3}*/}
      {/*    step={0.01}*/}
      {/*    value={scale}*/}
      {/*    onChange={e => setScale(Number(e.target.value))}*/}
      {/*    className="w-48 mx-auto cursor-pointer"*/}
      {/*  />*/}
      {/*)}*/}
    </>
  );
}
