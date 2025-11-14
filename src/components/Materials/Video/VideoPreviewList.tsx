import { Input } from '@/components/ui/input';
import { useTranslations } from 'next-intl';
import { Loader } from 'lucide-react';
import { FC } from 'react';

type YouTubePreview = { id: string; url: string; title?: string };
type FilePreview = { uid?: string; preview: string; title?: string; fileName?: string };

interface Props {
  fetchingFileIdx?: number | null;
  fetchingYoutubeIdx?: number | null;
  youtube?: YouTubePreview[];
  files?: FilePreview[];
  onRemoveFile: (uid: string) => void;
  onRemoveYoutube?: (index: number) => void;
  onYoutubeTitleChange?: (index: number, title: string) => void;
  onFileTitleChange?: (uid: string, title: string) => void;
}

export const VideoPreviewList: FC<Props> = ({
  fetchingFileIdx,
  youtube = [],
  files = [],
  onRemoveFile,
  onRemoveYoutube,
  onYoutubeTitleChange,
  onFileTitleChange,
}) => {
  const t = useTranslations('Materials');
  const videoList = [...youtube, ...files];

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">{`${videoList.length} / 9`}</p>

      <div
        className={`mt-3 grid ${videoList.length === 1 && 'grid-cols-1'} ${
          videoList.length === 2 && 'grid-cols-2'
        } ${videoList.length > 2 && 'grid-cols-3'} gap-3`}
      >
        {youtube.map((p, idx) => (
          <div
            key={`yt-${p.id}-${idx}`}
            className="relative flex flex-col overflow-hidden rounded-md border border-border p-2"
          >
            <div
              className={`w-full h-full max-h-[250px] ${
                fetchingFileIdx === idx ? 'bg-accent/10' : ''
              }`}
            >
              {fetchingFileIdx === idx && (
                <Loader
                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin`}
                  color={'#65a1f5'}
                  size={38}
                />
              )}
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${p.id}`}
                title={p.title || `YouTube ${p.id}`}
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="mt-2">
              <Input
                placeholder={t('enterTitle')}
                value={p.title || ''}
                onChange={e => onYoutubeTitleChange && onYoutubeTitleChange(idx, e.target.value)}
              />
            </div>

            {typeof onRemoveYoutube === 'function' && (
              <button
                className="absolute top-1 right-1 rounded bg-white/80 p-1 text-xs"
                onClick={() => onRemoveYoutube(idx)}
                aria-label="remove-youtube"
                type="button"
              >
                ×
              </button>
            )}
          </div>
        ))}

        {files.map((f, idx) => {
          const uid = f.uid ?? String(idx);
          const combinedIdx = youtube.length + idx;
          const isFetching = combinedIdx === fetchingFileIdx;

          return (
            <div
              key={`file-${uid}-${idx}`}
              className={`relative flex flex-col overflow-hidden rounded-md border border-border p-2 ${
                isFetching ? 'bg-accent/10' : ''
              }`}
            >
              {isFetching && (
                <Loader
                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin`}
                  color={'#65a1f5'}
                  size={38}
                />
              )}
              <video
                src={f.preview}
                className="w-full h-full max-h-[250px] object-contain rounded"
                controls
              />

              <div className="mt-2">
                <Input
                  placeholder={t('enterTitle')}
                  value={f.title || ''}
                  onChange={e => onFileTitleChange && onFileTitleChange(uid, e.target.value)}
                />
              </div>

              <button
                className="absolute top-1 right-1 rounded bg-white/80 p-1 text-xs"
                onClick={() => onRemoveFile(uid)}
                aria-label="remove-file"
                type="button"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VideoPreviewList;
