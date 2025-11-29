'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteModule, getModule } from '@/components/Materials/Modules/action';
import { useTranslations } from 'next-intl';
import { ChevronLeft, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import ModuleModal from '@/components/Materials/Modules/ModuleModal';
import ConfirmModal from '@/common/ConfirmModal';
import Loader from '@/common/Loader';
import logo from '../../../../../public/assets/logo.png';
import { Button } from '@/components/ui/button';

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

  // приведение чтобы не ругался TypeScript на отсутствующие поля
  const mod = module as any;

  const lessons = useMemo(() => {
    const list = (mod?.lessons ?? []) as any[];
    return list
      .filter(l => !onlyAvailable || l.access)
      .filter(l => l.title?.toLowerCase().includes(query.toLowerCase()));
  }, [mod, query, onlyAvailable]);

  if (isLoading) return <Loader />;

  // данные и прогресс
  const totalLessons = mod?.lessons?.length ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground"
          aria-label="Назад"
        >
          <ChevronLeft />
          <span>{t('back')}</span>
        </button>

        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-semibold truncate text-center">{mod?.title}</h1>
          {/*<div className="text-xs text-muted-foreground mt-1">*/}
          {/*  {mod?.short ??*/}
          {/*    (mod?.description*/}
          {/*      ? `${String(mod.description).slice(0, 120)}…`*/}
          {/*      : 'Описание отсутствует')}*/}
          {/*</div>*/}
        </div>

        <div className="flex flex-col items-end gap-2">
          {/*<div className="text-sm font-medium">{courseProgress}%</div>*/}
          {/*<div className="text-xs text-muted-foreground">*/}
          {/*  {completedLessons}/{totalLessons} уроков*/}
          {/*</div>*/}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cover + meta */}
        <aside className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
            <img
              src={mod?.url ? mod.url : logo.src}
              alt={mod?.title ?? 'module'}
              className="w-full h-56 object-cover"
            />
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Категория</div>
                <div className="text-sm font-medium">{mod?.category ?? '—'}</div>
              </div>

              <div className="flex gap-2 mt-2">
                <Button className="flex-1 bg-accent" onClick={() => setOpenEditModal(true)}>
                  {t('edit')}
                </Button>
                <Button variant="destructive" onClick={() => setOpenDeleteModal(true)}>
                  {t('delete')}
                </Button>
              </div>
            </div>
          </div>
        </aside>

        {/* Lesson feed */}
        <main className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={t('search')}
                  className="w-full pl-10 pr-3 py-2 rounded-md bg-slate-50 dark:bg-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
                />
                <div className="absolute left-3 top-2.5 text-muted-foreground">
                  <Search className="w-4 h-4" />
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                {t('shown')} {lessons.length}/{totalLessons}
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

                          {expandedLesson === lesson.id && (
                            <div className="mt-3 text-sm text-muted-foreground bg-slate-50 dark:bg-slate-900 p-3 rounded">
                              <div className="mb-2">
                                {lesson.description ?? 'Нет подробного описания.'}
                              </div>
                              <div className="text-xs">
                                Блоки:{' '}
                                {lesson.access_blocks?.length
                                  ? lesson.access_blocks.join(', ')
                                  : '—'}
                              </div>
                            </div>
                          )}
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
          </div>
        </main>
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
