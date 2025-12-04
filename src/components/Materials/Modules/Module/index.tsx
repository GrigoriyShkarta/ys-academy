'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteModule, getModule } from '@/components/Materials/Modules/action';
import { useTranslations } from 'next-intl';
import { ChevronLeft } from 'lucide-react';
import { useMemo, useState } from 'react';
import ModuleModal from '@/components/Materials/Modules/ModuleModal';
import ConfirmModal from '@/common/ConfirmModal';
import Loader from '@/common/Loader';
import { Button } from '@/components/ui/button';
import Chip from '@/common/Chip';

export default function ModuleLayout({ moduleId }: { moduleId?: number }) {
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [query, setQuery] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [expandedLesson, setExpandedLesson] = useState<number | null>(null);

  const t = useTranslations('Common');
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: module, isLoading } = useQuery({
    queryKey: ['module', moduleId],
    queryFn: () => getModule(moduleId),
    enabled: !!moduleId,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteModule(moduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      router.back();
    },
  });

  const lessons = useMemo(() => {
    const list = (module?.lessons ?? []) as any[];
    return list
      .filter(l => !onlyAvailable || l.access)
      .filter(l => l.title?.toLowerCase().includes(query.toLowerCase()));
  }, [module, query, onlyAvailable]);

  if (isLoading) return <Loader />;

  // данные и прогресс
  const totalLessons = module?.lessons?.length ?? 0;

  if (!module) return <div>Module not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground"
          aria-label="Назад"
        >
          <ChevronLeft />
          <span>{t('back')}</span>
        </button>

        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <Button className="bg-accent" onClick={() => setOpenEditModal(true)}>
              {t('edit')}
            </Button>
            <Button variant="destructive" onClick={() => setOpenDeleteModal(true)}>
              {t('delete')}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-col flex gap-2 mb-6">
        <h1 className="text-5xl">{module.title}</h1>
        <div className="flex gap-1 flex-wrap">
          {module?.categories?.map(c => (
            <Chip key={c.id} category={c} />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {lessons.map((lesson: any) => {
          const lp = lesson.progress ?? (lesson.access ? 100 : 0);
          return (
            <article
              key={lesson.id}
              className="border rounded-md p-3 hover:shadow hover:bg-accent/10 transition"
            >
              <Link
                href={`/main/materials/lessons/${lesson.id}`}
                className="text-sm font-medium hover:underline"
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="truncate">
                        {lesson.title}

                        <div className="text-xs text-muted-foreground mt-1">
                          {t(lesson.access ? 'let_access' : 'close')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </article>
          );
        })}

        {lessons.length === 0 && (
          <div className="text-sm text-muted-foreground p-4">{t('no_lessons_find')}</div>
        )}
      </div>

      <ModuleModal open={openEditModal} setOpen={setOpenEditModal} module={module} />
      <ConfirmModal
        open={openDeleteModal}
        setOnClose={() => setOpenDeleteModal(false)}
        confirmAction={deleteMutation.mutate}
      />
    </div>
  );
}
