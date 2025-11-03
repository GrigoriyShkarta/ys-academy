import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { RefObject } from 'react';
import type AvatarEditor from 'react-avatar-editor';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getYouTubeId = (url: string) => {
  const regExp =
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

export const cropImage = async (
  editorRef: RefObject<AvatarEditor | null>
): Promise<File | null> => {
  if (!editorRef.current) return null;

  return new Promise(resolve => {
    try {
      const canvas = editorRef.current!.getImageScaledToCanvas();

      canvas.toBlob(
        async blob => {
          if (!blob) {
            resolve(null);
            return;
          }

          const tempFile = new File([blob], 'cropped.png', { type: 'image/png' });

          try {
            const compressedFile = await compressImage(tempFile, {
              maxSizeKB: 500,
              maxWidth: 800,
            });
            resolve(compressedFile);
          } catch (err) {
            console.warn('Compression failed, using original cropped', err);
            resolve(tempFile);
          }
        },
        'image/png',
        0.95
      );
    } catch (err) {
      console.error('Crop error:', err);
      resolve(null);
    }
  });
};

export const compressImage = async (
  file: File,
  options: { maxSizeKB?: number; maxWidth?: number } = {}
): Promise<File> => {
  const { maxSizeKB = 500, maxWidth = 800 } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = e => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      let { width, height } = img;

      // Уменьшаем по ширине
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);

      let quality = 0.92;
      let outputFile: File;

      const tryCompress = () => {
        canvas.toBlob(
          blob => {
            if (!blob) {
              reject(new Error('Compression failed'));
              return;
            }

            outputFile = new File([blob], file.name, { type: 'image/webp' });

            if (outputFile.size <= maxSizeKB * 1024 || quality <= 0.5) {
              resolve(outputFile);
            } else {
              quality -= 0.1;
              tryCompress();
            }
          },
          'image/webp',
          quality
        );
      };

      tryCompress();
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const quillModules = {
  toolbar: {
    container: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['blockquote', 'code-block'],
      ['link'],
      ['clean'],
    ],
  },
};

export const quillFormats = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'blockquote',
  'code-block',
  'list',
  'bullet',
  'indent',
  'link',
  'image',
  'video',
  'color',
  'background',
  'align',
];
