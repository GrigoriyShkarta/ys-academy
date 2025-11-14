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

interface Props {
  setIsEditPlace: Dispatch<SetStateAction<boolean>>;
}

export default function EditPlace({ setIsEditPlace }: Props) {
  const [lessonTitle, setLessonTitle] = useState('');
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
      await createLesson(lessonDoc, lessonTitle);
      await queryClient.invalidateQueries({ queryKey: ['lessons'] });
      setIsEditPlace(false);
    } catch (error) {
      console.error('Error saving lesson:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={() => setIsEditPlace(false)}
          className="flex items-center"
          aria-label="Назад"
        >
          <ChevronLeft />
          <span>{t('back')}</span>
        </button>
        <h2 className="text-xl font-bold">{t('createLesson')}</h2>
        <div className="flex gap-2">
          <Button onClick={saveLesson} className="bg-accent text-white px-4 py-2 rounded-lg">
            {t('save')}
          </Button>
        </div>
      </div>

      <div className="w-full flex">
        <Input
          placeholder={t('lesson_title')}
          value={lessonTitle}
          onChange={e => setLessonTitle(e.target.value)}
          className="min-w-1/2! text-3xl! h-[58px] mx-auto border-none text-center"
        />
      </div>

      {lessonDoc.map(block => (
        <LessonBlock key={block.blockId} blockId={block.blockId} onUpdate={updateBlock} />
      ))}

      <Button variant="outline" className="w-full h-[50px]" onClick={addBlock}>
        {t('add_section')}
      </Button>
    </div>
  );
}
