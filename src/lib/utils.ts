import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { RefObject } from 'react';
import type AvatarEditor from 'react-avatar-editor';
import axios from 'axios';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDateTime = (value?: string | Date | null) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export const getYouTubeId = (url: string) => {
  // допускаем, что пользователь мог вставить просто id

  const idOnlyMatch = url.match(/^[A-Za-z0-9_-]{11}$/);
  if (idOnlyMatch) return url;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    // короткий формат youtu.be/ID
    if (host === 'youtu.be' || host.endsWith('.youtu.be')) {
      const id = parsed.pathname.replace(/^\//, '');
      return id.length === 11 ? id : null;
    }

    // обычный youtube.com
    if (host.includes('youtube.com') || host.endsWith('.youtube.com')) {
      // ?v=ID
      const v = parsed.searchParams.get('v');
      if (v && v.length === 11 && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;
      // /embed/ID
      const embedMatch = parsed.pathname.match(/\/embed\/([A-Za-z0-9_-]{11})/);
      if (embedMatch) return embedMatch[1];
      return null;
    }

    // fallback: попытка регулярки, но требуем строго 11 символов
    const regExp = /(?:v=|\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{11})/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  } catch (e) {
    // не URL — пробуем регексп на чистый id
    const match = url.match(/^[A-Za-z0-9_-]{11}$/);
    return match ? url : null;
  }
};

export const fetchYouTubeOembed = async (id: string) => {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(
      'https://www.youtube.com/watch?v=' + id
    )}&format=json`;
    const res = await fetch(oembedUrl);
    if (!res.ok) return { ok: false };
    const data = await res.json();
    return { ok: true, title: data?.title };
  } catch {
    return { ok: false };
  }
};

export const checkYouTubeVideoExists = async (videoUrl: string): Promise<boolean> => {
  try {
    const response = await axios.get('https://www.youtube.com/oembed', {
      params: { url: videoUrl, format: 'json' },
    });
    return response.status === 200;
  } catch {
    return false;
  }
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
  'indent',
  'link',
  'image',
  'video',
  'color',
  'background',
  'align',
];

export const isFile = (value: unknown): value is File => {
  return value instanceof File;
};
