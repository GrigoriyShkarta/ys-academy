import { ChangeEvent, RefObject } from 'react';
import { LessonItemType } from '@/components/Materials/utils/interfaces';

interface Props {
  audioInputRef: RefObject<HTMLInputElement | null>;
  photoInputRef: RefObject<HTMLInputElement | null>;
  videoInputRef: RefObject<HTMLInputElement | null>;
  handleFileSelect: (event: ChangeEvent<HTMLInputElement>, type: LessonItemType) => void;
}

export default function HiddenInputs({
  audioInputRef,
  photoInputRef,
  videoInputRef,
  handleFileSelect,
}: Props) {
  return (
    <>
      <input
        type="file"
        accept="audio/*"
        ref={audioInputRef}
        style={{ display: 'none' }}
        onChange={e => handleFileSelect(e, 'audio')}
      />

      {/* Скрытый input для выбора фото */}
      <input
        type="file"
        accept="image/*"
        ref={photoInputRef}
        style={{ display: 'none' }}
        onChange={e => handleFileSelect(e, 'image')}
      />

      {/* Скрытый input для выбора видео */}
      <input
        type="file"
        accept="video/*"
        ref={videoInputRef}
        style={{ display: 'none' }}
        onChange={e => handleFileSelect(e, 'video')}
      />
    </>
  );
}
