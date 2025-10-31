import { ChangeEvent, useCallback, useRef, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import ChooseTextModal from '@/common/MaterialsCommon/ChooseTextModal';
import { LessonItemType } from '@/components/Materials/utils/interfaces';
import RedactorModal from '@/common/RedactorModal';
import ChooseAudioModal from '@/common/MaterialsCommon/ChooseAudioModal';
import ChoosePhotoModal from '@/common/MaterialsCommon/ChoosePhotoModal';
import ChooseVideoModal from '@/common/MaterialsCommon/ChooseVideoModal';
import HiddenInputs from '@/components/Materials/Lesson/components/HiddenInputs';
import { BadgePlus } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Props {
  handleAdd: (type: LessonItemType, content: string | File, bankId?: number) => void;
}

type ModalKey = 'text' | 'text-bank' | 'audio-bank' | 'photo-bank' | 'video-bank' | '';

export default function PopupMenu({ handleAdd }: Props) {
  const [openModal, setOpenModal] = useState<ModalKey>('');
  const t = useTranslations('Materials');
  const audioInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (event: ChangeEvent<HTMLInputElement>, type: LessonItemType) => {
      const file = event.target.files?.[0];
      if (file) handleAdd(type, file);
      event.target.value = '';
      setOpenModal('');
    },
    [handleAdd]
  );

  const clickInput = useCallback((ref: React.RefObject<HTMLInputElement | null>) => {
    if (ref.current) ref.current.click();
  }, []);

  const menuItems: {
    key: ModalKey | 'device-audio' | 'device-photo' | 'device-video';
    label: string;
    onClick?: () => void;
  }[] = [
    {
      key: 'text-bank',
      label: t('take_from_text_bank'),
      onClick: () => setOpenModal('text-bank'),
    },
    { key: 'text', label: t('add_text'), onClick: () => setOpenModal('text') },
    {
      key: 'audio-bank',
      label: t('take_from_audio_bank'),
      onClick: () => setOpenModal('audio-bank'),
    },
    {
      key: 'device-audio',
      label: t('add_audio_from_device'),
      onClick: () => clickInput(audioInputRef),
    },
    {
      key: 'photo-bank',
      label: t('take_from_photo_bank'),
      onClick: () => setOpenModal('photo-bank'),
    },
    {
      key: 'device-photo',
      label: t('add_photo_from_device'),
      onClick: () => clickInput(photoInputRef),
    },
    {
      key: 'video-bank',
      label: t('take_from_video_bank'),
      onClick: () => setOpenModal('video-bank'),
    },
    {
      key: 'device-video',
      label: t('add_video_from_device'),
      onClick: () => clickInput(videoInputRef),
    },
  ];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-fit mx-auto">
            <BadgePlus size={18} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          {menuItems.map(item => (
            <DropdownMenuItem key={item.label} onClick={item.onClick}>
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <HiddenInputs
        audioInputRef={audioInputRef}
        photoInputRef={photoInputRef}
        videoInputRef={videoInputRef}
        handleFileSelect={handleFileSelect}
      />

      <ChooseTextModal
        open={openModal === 'text-bank'}
        closeModal={() => setOpenModal('')}
        handleAdd={handleAdd}
      />
      <ChooseAudioModal
        open={openModal === 'audio-bank'}
        closeModal={() => setOpenModal('')}
        handleAdd={handleAdd}
      />
      <ChoosePhotoModal
        open={openModal === 'photo-bank'}
        closeModal={() => setOpenModal('')}
        handleAdd={handleAdd}
      />
      <ChooseVideoModal
        open={openModal === 'video-bank'}
        closeModal={() => setOpenModal('')}
        handleAdd={handleAdd}
      />
      <RedactorModal
        open={openModal === 'text'}
        confirm={content => handleAdd('text', content)}
        close={() => setOpenModal('')}
      />
    </>
  );
}
