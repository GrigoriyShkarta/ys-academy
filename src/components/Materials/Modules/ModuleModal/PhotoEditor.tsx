import { Dispatch, SetStateAction, useEffect, useRef, useState, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Cropper, { Area, Point } from 'react-easy-crop';

const cropSize = 300;

interface Props {
  externalImage?: string | null;
  setImage: Dispatch<SetStateAction<string>>;
}

export default function PhotoEditor({
  externalImage = null,
  setImage,
}: Props) {
  const t = useTranslations('Materials');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isCropping, setIsCropping] = useState(false);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (externalImage) {
      setImageSrc(externalImage);
    } else {
      setImageSrc(null);
    }
  }, [externalImage]);

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageDataUrl = await readFile(file);
      setImageSrc(imageDataUrl);
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

      const reader = new FileReader();
      reader.readAsDataURL(croppedBlob);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        setImage(base64data);
        setImageSrc(base64data);
        setIsCropping(false);
      };
    } catch (error) {
      console.error(error);
    }
  };

  const handleCancel = () => {
    setIsCropping(false);
    if (externalImage) {
      setImageSrc(externalImage);
    } else {
      setImageSrc(null);
    }
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  const clearSelection = () => {
    setImageSrc(null);
    setImage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div
      className="mx-auto relative border rounded overflow-hidden select-none bg-muted"
      style={{
        width: `${cropSize}px`,
        height: `${cropSize}px`,
      }}
    >
      {isCropping && imageSrc ? (
        <div className="absolute inset-0 z-10 bg-background w-full h-full">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
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
              type="button"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              onClick={saveCrop}
              size="icon"
              className="bg-green-500 hover:bg-green-600"
              type="button"
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="w-full h-full relative flex flex-col items-center justify-center">
          {imageSrc ? (
            <>
              <img src={imageSrc} alt="avatar" className="w-full h-full object-cover" />
              <Button
                variant="destructive"
                className="absolute top-2 right-2 z-10"
                onClick={clearSelection}
                type="button"
                size="icon"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          ) : null}

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={onFileChange}
          />

          {!imageSrc && (
            <Button
              className="bg-accent w-[200px]"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              {t('add_cover') || 'Select Photo'}
            </Button>
          )}
        </div>
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
