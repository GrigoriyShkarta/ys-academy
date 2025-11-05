import { useState } from 'react';
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
import { BadgePlus } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Props {
  handleAdd: (type: LessonItemType, content: string | File, bankId?: number) => void;
}

type ModalKey = 'text' | 'text-bank' | 'audio-bank' | 'photo-bank' | 'video-bank' | '';

export default function PopupMenu({ handleAdd }: Props) {
  const [openModal, setOpenModal] = useState<ModalKey>('');
  const t = useTranslations('Materials');

  const menuItems: {
    key: ModalKey | 'device-audio' | 'device-photo' | 'device-video';
    label: string;
    onClick?: () => void;
  }[] = [
    { key: 'text', label: t('add_text'), onClick: () => setOpenModal('text') },
    {
      key: 'text-bank',
      label: t('take_from_text_bank'),
      onClick: () => setOpenModal('text-bank'),
    },
    {
      key: 'audio-bank',
      label: t('add_audio'),
      onClick: () => setOpenModal('audio-bank'),
    },
    {
      key: 'photo-bank',
      label: t('add_photo'),
      onClick: () => setOpenModal('photo-bank'),
    },
    {
      key: 'video-bank',
      label: t('add_video'),
      onClick: () => setOpenModal('video-bank'),
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
