import { Dispatch, SetStateAction, useState } from 'react';
import { LessonDocItem } from '@/components/Materials/utils/interfaces';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createLesson } from '@/components/Materials/Lesson/action';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import LessonBlock from '@/components/Materials/Lesson/components/LessonBlock';
import { Block } from '@blocknote/core';
import Cover from '@/components/Materials/Lesson/components/Cover';
import ConfirmModal from '@/common/ConfirmModal';
import LessonSaveModal from '@/components/Materials/Lesson/components/LessonSaveModal';
import { uploadPhoto } from '@/components/Materials/Photo/action';

interface Props {
  setIsEditPlace: Dispatch<SetStateAction<boolean>>;
}

export default function EditPlace({ setIsEditPlace }: Props) {
  const [lessonTitle, setLessonTitle] = useState('');
  const [cover, setCover] = useState<string | File>('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [openSaveModal, setOpenSaveModal] = useState(false);
  const [lessonDoc, setLessonDoc] = useState<LessonDocItem[]>([]);
  const t = useTranslations('Materials');
  const queryClient = useQueryClient();

  const addBlock = () => {
    setLessonDoc(prev => {
      const newBlockId = prev.length > 0 ? prev[prev.length - 1].blockId + 1 : 1;

      return [
        ...prev,
        {
          blockId: newBlockId,
          content: [],
        },
      ];
    });
  };

  const handleDeleteBlock = (blockId: number) => {
    setLessonDoc(prev => prev.filter(item => item.blockId !== blockId));
  };

  const updateBlock = (blockId: number, content: Block[]) => {
    setLessonDoc(prev =>
      prev.map(item => (item.blockId === blockId ? { ...item, content } : item))
    );
  };

  const saveLesson = async () => {
    try {
      setLoading(true);
      let coverUrl = typeof cover === 'string' ? cover : undefined;
      let coverPublicId = '';

      if (cover instanceof File) {
        const res = await uploadPhoto({
          content: cover,
          title: 'Lesson Cover',
          categories: [],
          isOther: true,
        });
        coverUrl = res.url;
        coverPublicId = res.publicId;
      }

      await createLesson(lessonDoc, lessonTitle, coverUrl, coverPublicId, selectedCategories, selectedModules);
      await queryClient.invalidateQueries({ queryKey: ['lessons'] });
    } catch (error) {
      console.error('Error saving lesson:', error);
    } finally {
      setLoading(false);
      setIsEditPlace(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center"
          aria-label="Назад"
        >
          <ChevronLeft />
          <span>{t('back')}</span>
        </button>
        <h2 className="text-xl font-bold">{t('createLesson')}</h2>
        <div className="flex gap-2">
          <Button
            onClick={() => setOpenSaveModal(true)}
            className="bg-accent text-white px-4 py-2 rounded-lg"
          >
            {t('save')}
          </Button>
        </div>
      </div>

      <Cover updateCover={setCover} cover={cover} isEdit />

      <div className="max-w-7xl sm:w-[75%] mx-auto">
        <div className="w-full flex">
          <Input
            placeholder={t('lesson_title')}
            value={lessonTitle}
            onChange={e => setLessonTitle(e.target.value)}
            className="min-w-1/2! text-[50px]! h-[58px] mx-auto border-none text-center"
          />
        </div>

        {lessonDoc.map(block => (
          <LessonBlock
            key={block.blockId}
            blockId={block.blockId}
            onUpdate={updateBlock}
            deleteSection={handleDeleteBlock}
          />
        ))}

        <Button variant="outline" className="w-full h-[50px] mt-6" onClick={addBlock}>
          {t('add_section')}
        </Button>
      </div>

      <ConfirmModal
        open={open}
        setOnClose={() => setOpen(false)}
        confirmAction={() => setIsEditPlace(false)}
        textContent={t('confirm_lesson')}
      />

      <LessonSaveModal
        open={openSaveModal}
        onClose={() => setOpenSaveModal(false)}
        onSave={saveLesson}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        selectedModules={selectedModules}
        setSelectedModules={setSelectedModules}
        isLoading={loading}
      />
    </div>
  );
}
