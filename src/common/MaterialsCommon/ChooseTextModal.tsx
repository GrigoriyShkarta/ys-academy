import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTexts } from '@/components/Materials/Text/action';
import { keepPreviousData } from '@tanstack/query-core';
import Loader from '@/common/Loader';
import { IText, LessonItemType } from '@/components/Materials/utils/interfaces';
import { FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';
import PreviewModal from '@/common/PreviewModal';
import DataTable from '@/common/Table';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface Props {
  open: boolean;
  closeModal: () => void;
  handleAdd: (type: LessonItemType, content: string | File, bankId?: number) => void;
}

export default function ChooseTextModal({ open, closeModal, handleAdd }: Props) {
  const [search, setSearch] = useState('');
  const [previewText, setPreviewText] = useState<string | null>(null);
  const t = useTranslations('Materials');

  const { data: texts, isLoading } = useQuery({
    queryKey: ['texts', search],
    queryFn: () => getTexts({ search, page: 'all' }),
    placeholderData: keepPreviousData,
  });

  const columns = [
    {
      key: 'title',
      label: t('title'),
      render: (student: IText) => <span>{student?.title}</span>,
    },
    {
      key: 'text',
      label: t('text'),
      render: (item: IText) => (
        <FileText
          className="w-6 h-6 cursor-pointer"
          onClick={e => {
            e.stopPropagation();
            setPreviewText(item?.content);
          }}
        />
      ),
    },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto overflow-visible [scrollbar-gutter:stable]">
          <DialogTitle>
            <VisuallyHidden>Preview Content</VisuallyHidden>
          </DialogTitle>
          {isLoading ? (
            <Loader />
          ) : (
            <DataTable
              data={texts.data}
              columns={columns}
              onSearchChange={newSearch => {
                setSearch(newSearch);
              }}
              handleClickRow={(item: IText) => {
                handleAdd('text', item.content, item.id);
                closeModal();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {previewText && (
        <PreviewModal
          open={!!previewText}
          setOpen={() => setPreviewText(null)}
          content={previewText}
        />
      )}
    </>
  );
}
