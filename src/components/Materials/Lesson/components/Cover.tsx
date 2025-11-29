import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import ChoosePhotoModal from '@/common/MaterialsCommon/ChoosePhotoModal';
import { useState } from 'react';

interface Props {
  cover?: string;
  updateCover?: (cover: string) => void;
  isEdit?: boolean;
}

export default function Cover({ cover, updateCover, isEdit }: Props) {
  const [open, setOpen] = useState(false);
  const t = useTranslations('Materials');

  return (
    <>
      <div className="w-[calc(100% + 64px)] h-[35vh] relative flex items-center justify-center bg-muted">
        {cover ? (
          <>
            <Image src={cover} alt="cover" fill className="object-cover" />

            {isEdit && (
              <Button onClick={() => setOpen(true)} className="absolute right-2 bottom-2 bg-accent">
                {t('change_cover')}
              </Button>
            )}
          </>
        ) : (
          isEdit && (
            <Button onClick={() => setOpen(true)} className="bg-accent">
              {t('add_cover')}
            </Button>
          )
        )}
      </div>

      {updateCover && (
        <ChoosePhotoModal
          open={open}
          closeModal={() => setOpen(false)}
          handleAdd={(type, url) => {
            updateCover(url as string);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}
