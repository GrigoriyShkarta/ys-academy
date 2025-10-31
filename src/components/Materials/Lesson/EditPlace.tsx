import { Dispatch, SetStateAction, useState } from 'react';
import { Layout } from 'react-grid-layout';
import { LessonBlock } from '@/components/Materials/Lesson/components/LessonBlock';
import LessonPreviewLayout from '@/common/LessonPreviewLayout';
import { LessonBlockType, LessonItem } from '@/components/Materials/utils/interfaces';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createLesson } from '@/components/Materials/Lesson/action';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';

interface Props {
  setIsEditPlace: Dispatch<SetStateAction<boolean>>;
}

export default function EditPlace({ setIsEditPlace }: Props) {
  const [blocks, setBlocks] = useState<LessonBlockType[]>([]);
  const [previewInline, setPreviewInline] = useState(false);
  const [lessonTitle, setLessonTitle] = useState('');
  const [layoutsByBlockId, setLayoutsByBlockId] = useState<Record<number, Layout[]>>({});
  const t = useTranslations('Materials');
  const queryClient = useQueryClient();

  const addBlock = () => {
    setBlocks(prev => [...prev, { id: blocks.length + 1, items: [], title: '' }]);
  };

  const updateBlock = (
    blockId: number,
    newItems: LessonItem[],
    layout?: Layout[],
    title?: string
  ) => {
    setBlocks(prev =>
      prev.map(b =>
        b.id === blockId
          ? {
              ...b,
              items: newItems,
              ...(title !== undefined ? { title } : {}),
            }
          : b
      )
    );

    if (layout) {
      setLayoutsByBlockId(prev => ({ ...prev, [blockId]: layout }));
    }
  };

  // Сохранение на бэк — отправляем порядок блоков и позиции элементов внутри блоков
  const saveLesson = async () => {
    try {
      const formData = new FormData();

      blocks.forEach((block, blockIndex) => {
        formData.append(`blocks[${blockIndex}][index]`, String(blockIndex));
        formData.append(`blocks[${blockIndex}][title]`, block.title ?? '');

        block.items.forEach((item, itemIndex) => {
          const layout = (layoutsByBlockId[block.id] || []).find(l => l.i === item.id) || null;

          formData.append(
            `blocks[${blockIndex}][items][${itemIndex}][orderIndex]`,
            String(itemIndex)
          );
          formData.append(`blocks[${blockIndex}][items][${itemIndex}][type]`, item.type);
          formData.append(`blocks[${blockIndex}][items][${itemIndex}][source]`, item.source);

          if (item.bankId) {
            formData.append(
              `blocks[${blockIndex}][items][${itemIndex}][bankItemId]`,
              String(item.bankId)
            );
          }

          // сохраняем только нужные поля layout
          if (layout) {
            const minimalLayout = {
              w: layout.w,
              h: layout.h,
              x: layout.x,
              y: layout.y,
              i: layout.i,
            };
            formData.append(
              `blocks[${blockIndex}][items][${itemIndex}][layout]`,
              JSON.stringify(minimalLayout)
            );
          }

          if (item.content instanceof File) {
            formData.append(
              `blocks[${blockIndex}][items][${itemIndex}][content]`,
              item.content,
              item.content.name
            );
          } else {
            formData.append(`blocks[${blockIndex}][items][${itemIndex}][content]`, item.content);
          }
        });
      });

      formData.append('title', lessonTitle);

      await createLesson(formData);
      await queryClient.invalidateQueries({ queryKey: ['lessons'] });
    } catch (err) {
      console.error(err);
      alert('Ошибка при сохранении урока');
    } finally {
      setIsEditPlace(false);
    }
  };

  const handleDeleteBlock = (blockId: number) => {
    const updatedBlocks = blocks.filter(block => block.id !== blockId);
    setBlocks(updatedBlocks);

    setLayoutsByBlockId(prev => {
      const newLayouts = { ...prev };
      delete newLayouts[blockId];
      return newLayouts;
    });
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
          <Button variant="outline" onClick={() => setPreviewInline(p => !p)}>
            {t(previewInline ? 'close_preview' : 'preview')}
          </Button>
          <Button onClick={saveLesson} className="bg-accent text-white px-4 py-2 rounded-lg">
            {t('save')}
          </Button>
        </div>
      </div>
      {!previewInline && (
        <div className="w-full flex">
          <Input
            placeholder={t('lesson_title')}
            value={lessonTitle}
            onChange={e => setLessonTitle(e.target.value)}
            className="min-w-1/2! text-3xl! h-[58px] mx-auto"
          />
        </div>
      )}

      {!previewInline &&
        blocks.map((block, index) => (
          <LessonBlock
            key={index}
            block={block}
            initialLayout={layoutsByBlockId[block.id]}
            onUpdate={updateBlock}
            onDeleteBlock={handleDeleteBlock}
          />
        ))}

      {!previewInline && (
        <Button variant="outline" className="w-full h-[50px]" onClick={addBlock}>
          {t('addBlock')}
        </Button>
      )}

      {previewInline && (
        <div className="mt-4">
          <LessonPreviewLayout
            name={lessonTitle}
            blocks={blocks}
            layoutsByBlockId={layoutsByBlockId}
          />
        </div>
      )}
    </div>
  );
}
