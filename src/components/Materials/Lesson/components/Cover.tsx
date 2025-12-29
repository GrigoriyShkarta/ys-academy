import NextImage from 'next/image';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import { Check, X } from 'lucide-react';

interface Props {
  cover?: string | File | null;
  updateCover?: (cover: string | File) => void;
  isEdit?: boolean;
}

export default function Cover({ cover, updateCover, isEdit }: Props) {
  const t = useTranslations('Materials');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isCropping, setIsCropping] = useState(false);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [aspect, setAspect] = useState(16 / 9);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cover instanceof File) {
      const url = URL.createObjectURL(cover);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(cover ?? null);
    }
  }, [cover]);

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageDataUrl = await readFile(file);
      setImageSrc(imageDataUrl);

      if (containerRef.current) {
        setAspect(
          containerRef.current.offsetWidth / containerRef.current.offsetHeight
        );
      }
      setIsCropping(true);
      e.target.value = '';
    }
  };

  const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const saveCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

      if (!croppedBlob) throw new Error('Failed to crop image');

      const file = new File([croppedBlob], 'cover.jpg', { type: 'image/jpeg' });

      if (updateCover) {
        updateCover(file);
      }

      handleCancel();
    } catch (error) {
      console.error(error);
    }
  };

  const handleCancel = () => {
    setIsCropping(false);
    setImageSrc(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      className="w-[calc(100% + 64px)] h-[35vh] relative flex items-center justify-center bg-muted overflow-hidden"
    >
      {isCropping && imageSrc ? (
        <div className="absolute inset-0 z-10 bg-background w-full h-full">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{ containerStyle: { width: '100%', height: '100%' } }}
            objectFit="cover"
          />
          <div className="absolute bottom-4 right-4 flex gap-2 z-20">
            <Button
              onClick={handleCancel}
              size="icon"
              variant="destructive"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              onClick={saveCrop}
              size="icon"
              className="bg-green-500 hover:bg-green-600"
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <>
          {previewUrl ? (
            <NextImage src={previewUrl} alt="cover" fill className="object-cover" />
          ) : null}

          {isEdit && (
            <>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={onFileChange}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className={
                  previewUrl ? 'absolute right-2 bottom-2 bg-accent' : 'bg-accent'
                }
              >
                {t(previewUrl ? 'change_cover' : 'add_cover')}
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );
}

// Utils
function readFile(file: File): Promise<string> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.addEventListener(
      'load',
      () => resolve(reader.result as string),
      false
    );
    reader.readAsDataURL(file);
  });
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', error => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      resolve(blob);
    }, 'image/jpeg');
  });
}
