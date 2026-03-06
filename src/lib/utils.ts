import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { RefObject } from 'react';
import type AvatarEditor from 'react-avatar-editor';
import axios from 'axios';
import { format } from 'date-fns';
import { StudentSubscription } from '@/components/Students/interface';
import { uk } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDateTime = (value?: string | Date | null, dateOnly?: boolean) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const pad = (n: number) => String(n).padStart(2, '0');

  const dateStr = `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;

  if (dateOnly) {
    return dateStr;
  }

  return `${dateStr} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export const getYouTubeId = (url: string): string | null => {
  // 1. Если просто ID (11 символов)
  if (/^[A-Za-z0-9_-]{11}$/.test(url.trim())) {
    return url.trim();
  }

  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.toLowerCase();

    // youtu.be
    if (host === 'youtu.be' || host.endsWith('.youtu.be')) {
      const id = parsed.pathname.slice(1);
      return id.length === 11 ? id : null;
    }

    // youtube.com или www.youtube.com
    if (host.includes('youtube.com') || host.endsWith('.youtube.com')) {
      // ?v=ID
      const v = parsed.searchParams.get('v');
      if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;

      // /embed/ID
      const embedMatch = parsed.pathname.match(/\/embed\/([A-Za-z0-9_-]{11})/);
      if (embedMatch) return embedMatch[1];

      // /shorts/ID ← ВОТ ЭТО ГЛАВНОЕ!
      const shortsMatch = parsed.pathname.match(/\/shorts\/([A-Za-z0-9_-]{11})/);
      if (shortsMatch) return shortsMatch[1];

      // /watch?v=ID (fallback)
      if (parsed.pathname === '/watch' && v) return v;

      return null;
    }

    return null;
  } catch {
    // Если не URL — пробуем как чистый ID
    const match = url.trim().match(/^[A-Za-z0-9_-]{11}$/);
    return match ? match[0] : null;
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
  if (file.type === 'image/gif') {
    return file;
  }
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

export const isFile = (value: unknown): value is File => {
  return value instanceof File;
};

const getLessonWord = (count: number): string => {
  if (count % 10 === 1 && count % 100 !== 11) {
    return 'урок';
  }
  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
    return 'уроки';
  }
  return 'уроків';
};

// Функція для генерації тексту повідомлення
export const generateRenewalMessage = (subscription: StudentSubscription): string => {
  const lessons = subscription.lessons.sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );

  const lessonCount = lessons.length;
  const title = subscription.subscription.title;
  const price = subscription.subscription.price;

  // Групуємо уроки за днем тижня + часом
  const slotsMap = new Map<string, { dayName: string; time: string }>();

  lessons.forEach(lesson => {
    const date = new Date(lesson.scheduledAt);
    const dayOfWeek = date.getUTCDay();
    const time = format(date, 'HH:mm');

    const dayNames = ['неділя', 'понеділок', 'вівторок', 'середа', 'четвер', "п'ятниця", 'субота'];
    const dayName = dayNames[dayOfWeek];

    const key = `${dayOfWeek}-${time}`;
    if (!slotsMap.has(key)) {
      slotsMap.set(key, { dayName, time });
    }
  });

  // Формуємо рядок з часом уроків
  const slotsArray = Array.from(slotsMap.values());
  let timeLine = 'Твій час для уроків: ';
  if (slotsArray.length === 1) {
    const { dayName, time } = slotsArray[0];
    timeLine += `${dayName} о ${time} за Києвом`;
  } else {
    timeLine +=
      slotsArray
        .slice(0, -1)
        .map(s => `${s.dayName} о ${s.time}`)
        .join(' за Києвом та ') +
      ` за Києвом та ${slotsArray[slotsArray.length - 1].dayName} о ${
        slotsArray[slotsArray.length - 1].time
      } за Києвом`;
  }

  // Список дат уроків
  const datesLine = lessons
    .map(lesson => {
      const date = new Date(lesson.scheduledAt);
      const day = format(date, 'dd', { locale: uk });
      const month = format(date, 'MMMM yyyy', { locale: uk });
      return `${day} ${month}`;
    })
    .join(', ');

  // Дата останнього урока
  const lastLesson = lessons[lessons.length - 1];
  const lastLessonDate = lastLesson
    ? format(new Date(lastLesson.scheduledAt), 'dd.MM.yyyy')
    : '';

  // Дата дійсності абонементу (останній урок + 2 дні)
  const expiryDate = lastLesson
    ? (() => {
        const date = new Date(lastLesson.scheduledAt);
        date.setDate(date.getDate() + 2);
        return format(date, 'dd.MM.yyyy');
      })()
    : '';

  // Текст повідомлення
  return `Вітаю, твій абонемент "${title}" на ${lessonCount} ${getLessonWord(
    lessonCount
  )} вокалу успішно поновлено! 🎉

Дійсний до: ${expiryDate} включно
${timeLine}

Уроки за розкладом:
${datesLine}

Дата поновлення абонементу: ${lastLessonDate}

Вартість абонементу: ${price.toLocaleString('uk-UA')} грн

Рахунок для оплати: UA423510050000026006879203138

Одержувач: Сабада Яна Олексіївна

ІПН/ЄДРПОУ: 3670300783

Призначення: сплата за уроки вокалу (ПІБ)

Бажаю успіхів у навчанні! 😊`;
};
