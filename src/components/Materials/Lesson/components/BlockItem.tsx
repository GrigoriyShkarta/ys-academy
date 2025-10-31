import { useEffect, useState } from 'react';
import { LessonItem } from '@/components/Materials/utils/interfaces';

export function BlockItem({ item }: { item: LessonItem }) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(item.content instanceof File);
  const [mediaSrc, setMediaSrc] = useState<string>('');
  const [videoKey, setVideoKey] = useState<string>(Date.now().toString());

  // генерируем URL при изменении контента
  useEffect(() => {
    let objectUrl: string | null = null;

    if (typeof item.content === 'string') {
      setMediaSrc(item.content);
      setIsLoading(false);
    } else if (item.content instanceof File) {
      objectUrl = URL.createObjectURL(item.content);
      setMediaSrc(objectUrl);
      setIsLoading(false);
    } else {
      setMediaSrc('');
      setIsLoading(false);
    }

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [item.content]);

  // проверяем YouTube
  const isYouTubeUrl =
    typeof item.content === 'string' &&
    (item.content.includes('youtube.com/watch?v=') || item.content.includes('youtu.be/'));

  const getYouTubeVideoId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // проверка метаданных видео
  useEffect(() => {
    if (mediaSrc && item.type === 'video' && item.content instanceof File) {
      const video = document.createElement('video');
      video.src = mediaSrc;
      video.onloadedmetadata = () => {
        setVideoKey(Date.now().toString());
      };
      video.onerror = e => {
        console.error('Ошибка загрузки метаданных видео:', e);
        setError('Не удалось загрузить метаданные видео');
      };
    }
  }, [mediaSrc, item.type, item.content]);

  switch (item.type) {
    case 'text':
      return (
        <div
          className="ql-editor overflow-y-hidden!"
          dangerouslySetInnerHTML={{ __html: item.content }}
        />
      );

    case 'image':
      return (
        <div className="flex justify-center items-center w-full h-full overflow-hidden media-wrapper">
          {isLoading && <div>Загрузка изображения...</div>}
          {mediaSrc && !isLoading ? (
            <img
              src={mediaSrc}
              alt="Изображение"
              className="w-full h-full object-contain rounded-lg transition-all duration-200"
              onError={() => setError('Не удалось загрузить изображение')}
            />
          ) : !isLoading ? (
            <div>Некорректный источник изображения</div>
          ) : null}
          {error && <div className="text-red-500">{error}</div>}
        </div>
      );

    case 'video':
      if (isYouTubeUrl) {
        const videoId = getYouTubeVideoId(item.content as string);
        if (videoId) {
          return (
            <div className="w-full h-full relative media-wrapper">
              <iframe
                className="w-full h-full rounded-lg"
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          );
        }
        return <div>Некорректный YouTube URL</div>;
      }

      return (
        <div className="w-full h-full flex flex-col items-center justify-center media-wrapper">
          {isLoading && <div>Загрузка видео...</div>}
          {!isLoading && mediaSrc ? (
            <video
              key={videoKey}
              controls
              className="w-full rounded-lg max-h-[600px] object-contain"
              onLoadedData={() => {
                setError(null);
              }}
              onError={e => {
                console.error('Ошибка загрузки видео:', e);
                setError('Не удалось загрузить видео');
              }}
            >
              <source
                src={mediaSrc}
                type={typeof item.content === 'string' ? 'video/mp4' : item.content.type}
              />
              Ваш браузер не поддерживает воспроизведение видео.
            </video>
          ) : null}

          {error && <div className="text-red-500">{error}</div>}
        </div>
      );

    case 'audio':
      return (
        <div className="w-full h-full relative media-wrapper">
          <audio controls className="w-full">
            {mediaSrc ? (
              <source
                src={mediaSrc}
                type={typeof item.content === 'string' ? undefined : item.content.type}
              />
            ) : null}
            Ваш браузер не поддерживает воспроизведение аудио.
          </audio>
        </div>
      );

    default:
      return null;
  }
}
