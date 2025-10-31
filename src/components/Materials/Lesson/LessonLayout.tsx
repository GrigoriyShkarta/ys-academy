'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteLesson, getLesson, updateLesson } from '@/components/Materials/Lesson/action';
import Loader from '@/common/Loader';
import { Layout, Responsive, WidthProvider } from 'react-grid-layout';
import { BlockItem } from '@/components/Materials/Lesson/components/BlockItem';
import { LessonBlockType, LessonItem } from '@/components/Materials/utils/interfaces';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LessonBlock } from '@/components/Materials/Lesson/components/LessonBlock';
import { Input } from '@/components/ui/input';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface LayoutsByBlockId {
  [key: number]: Layout[];
}

export default function LessonLayout({ id }: { id: number }) {
  const [isEditPlace, setIsEditPlace] = useState(false);
  const [blocks, setBlocks] = useState<LessonBlockType[]>([]);
  const [lessonTitle, setLessonTitle] = useState('');
  const [layoutsByBlockId, setLayoutsByBlockId] = useState<Record<number, Layout[]>>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations('Materials');

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', id],
    queryFn: () => getLesson(id),
    enabled: !!id,
  });

  const handleUpdateLesson = async () => {
    try {
      const formData = new FormData();

      blocks.forEach((block, blockIndex) => {
        formData.append(`blocks[${blockIndex}][index]`, String(blockIndex));
        formData.append(`blocks[${blockIndex}][title]`, block.title ?? '');

        block.items.forEach((item, itemIndex) => {
          const layout = layoutsByBlockId[block.id][itemIndex];

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

      await updateLesson(id, formData);
    } catch (err) {
      console.error(err);
      alert('Ошибка при сохранении урока');
    } finally {
      setIsEditPlace(false);
    }
  };

  useEffect(() => {
    if (lesson) {
      setBlocks(lesson.blocks);
      const parsedLayouts: LayoutsByBlockId = {};

      lesson.blocks.forEach((block: LessonBlockType) => {
        parsedLayouts[block.id] = block.items
          .filter(item => item.id != null) // Фильтруем элементы с валидным id
          .map((item, index): Layout => {
            try {
              // Пробуем разобрать layout, если он строка
              const parsedLayout = item?.layout
                ? typeof item.layout === 'string'
                  ? JSON.parse(item.layout)
                  : item.layout
                : null;

              // Возвращаем объект Layout с значениями по умолчанию
              return {
                i: String(item.id),
                x: Number(parsedLayout?.x ?? 0),
                y: Number(parsedLayout?.y ?? index * 8),
                w: Number(parsedLayout?.w ?? 4),
                h: Number(parsedLayout?.h ?? (item.type === 'text' ? 10 : 4)),
                minH: item.type === 'text' ? 10 : 2,
              };
            } catch (error) {
              // В случае ошибки возвращаем Layout с значениями по умолчанию
              return {
                i: String(item.id),
                x: 0,
                y: index * 8,
                w: 4,
                h: item.type === 'text' ? 10 : 4,
                minH: item.type === 'text' ? 10 : 2,
              };
            }
          });
      });

      setLayoutsByBlockId(parsedLayouts);
      setLessonTitle(lesson.title);
    }
  }, [lesson]);

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

  const handleDeleteLesson = async () => {
    try {
      setLoading(true);
      await deleteLesson(id);
      await queryClient.invalidateQueries({ queryKey: ['lessons'] });
      router.push('/main/materials/lessons');
    } catch (e) {
      console.log('Error deleting lesson:', e);
    } finally {
      setLoading(false);
    }
  };

  const addBlock = () => {
    setBlocks(prev => [...prev, { id: blocks.length + 1, items: [], title: '' }]);
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

  if (isLoading || loading) return <Loader />;
  if (!lesson) return <div>Lesson not found</div>;

  return (
    <div className="space-y-6 p-4 relative">
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center"
          aria-label="Назад"
        >
          <ChevronLeft />
          <span>{t('back')}</span>
        </button>

        <div className="flex gap-2">
          <Button className="bg-accent" onClick={() => setIsEditPlace(prev => !prev)}>
            {t(isEditPlace ? 'view' : 'edit')}
          </Button>
          {isEditPlace ? (
            <Button className="bg-accent" onClick={handleUpdateLesson}>
              {t('save')}
            </Button>
          ) : (
            <Button className="bg-destructive" onClick={handleDeleteLesson}>
              {t('delete')}
            </Button>
          )}
        </div>
      </div>
      {isEditPlace ? (
        <Input
          placeholder={t('lesson_title')}
          value={lessonTitle}
          onChange={e => setLessonTitle(e.target.value)}
          className="min-w-1/2! text-3xl! h-[58px] mx-auto"
        />
      ) : (
        <h1 className="text-center text-4xl font-bold mb-6">{lesson.title}</h1>
      )}

      <div className="relative">
        {/*{!isEditPlace && <LessonNavigation blocks={blocks} />}*/}

        {blocks.map((block: LessonBlockType) => {
          const layouts = { lg: layoutsByBlockId[block.id] || [] };

          if (isEditPlace) {
            return (
              <div key={block.id} className="relative mb-10">
                <LessonBlock
                  block={block}
                  onUpdate={updateBlock}
                  initialLayout={layouts.lg}
                  onDeleteBlock={handleDeleteBlock}
                />
              </div>
            );
          }

          return (
            <div key={block.id} className="view-mode relative mb-10">
              <h2 className="font-semibold text-xl">{block.title}</h2>
              <ResponsiveGridLayout
                className="layout"
                layouts={layouts}
                breakpoints={{ lg: 1200, sm: 768 }}
                cols={{ lg: 12, sm: 2 }}
                rowHeight={1}
                isDraggable={false}
                isResizable={false}
              >
                {block.items.map(item => (
                  <div key={String(item.id)} className="p-2 bg-transparent relative">
                    <BlockItem item={item} />
                  </div>
                ))}
              </ResponsiveGridLayout>
            </div>
          );
        })}
      </div>

      {isEditPlace && (
        <Button variant="outline" className="w-full h-[50px]" onClick={addBlock}>
          {t('addBlock')}
        </Button>
      )}
    </div>
  );
}
