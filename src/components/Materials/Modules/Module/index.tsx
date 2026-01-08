'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteModule, getModule } from '@/components/Materials/Modules/action';
import { useTranslations } from 'next-intl';
import { ChevronLeft, Lock } from 'lucide-react';
import { useState } from 'react';
import ModuleModal from '@/components/Materials/Modules/ModuleModal';
import ConfirmModal from '@/common/ConfirmModal';
import Loader from '@/common/Loader';
import { Button } from '@/components/ui/button';
import Chip from '@/common/Chip';
import { useUser } from '@/providers/UserContext';

export default function ModuleLayout({ moduleId }: { moduleId?: number }) {
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const t = useTranslations('Common');
  const queryClient = useQueryClient();
  const router = useRouter();
  const { user } = useUser();

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

  if (isLoading) return <Loader />;
  if (!module) return <div>{t('module_not_found') || 'Модуль не найден'}</div>;

  const lessons = module?.lessons || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
          aria-label="Назад"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{t('back')}</span>
        </button>

        {user?.role === 'super_admin' && (
          <div className="flex gap-2">
            <Button className="bg-accent" onClick={() => setOpenEditModal(true)}>
              {t('edit')}
            </Button>
            <Button variant="destructive" onClick={() => setOpenDeleteModal(true)}>
              {t('delete')}
            </Button>
          </div>
        )}
      </div>

      {/* Title + Categories */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-3">{module.title}</h1>
        {user?.role === 'super_admin' && (
          <div className="flex gap-2 flex-wrap">
            {module?.categories?.map((c: any) => (
              <Chip key={c.id} category={c} />
            ))}
          </div>
        )}
      </div>

      {/* Unified Lessons List */}
      <div className="space-y-3">
        {lessons.length > 0 ? (
          lessons.map((lesson: any) => {
            const hasAccess = !!lesson.access;

            // Общий контейнер
            const containerClasses = `
              border rounded-lg p-4 transition-all
              ${
                hasAccess
                  ? 'hover:shadow-md hover:bg-accent/5 cursor-pointer group'
                  : 'bg-muted/30 border-muted opacity-75 cursor-not-allowed'
              }
            `;

            const titleClasses = hasAccess
              ? 'font-medium text-foreground group-hover:underline'
              : 'font-medium text-muted-foreground';

            const statusText = hasAccess ? t('let_access') : t('close');
            const statusClasses = hasAccess
              ? 'text-xs text-green-600 dark:text-green-400'
              : 'text-xs text-muted-foreground';

            return hasAccess ? (
              // Доступный урок — кликабельный
              <Link key={lesson.id} href={`/main/materials/lessons/${lesson.id}`} className="block">
                <article className={containerClasses}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className={titleClasses}>{lesson.title}</h3>
                      <p className={statusClasses}>{statusText}</p>
                    </div>
                    {/* Стрелка появляется при hover */}
                    <ChevronLeft className="w-5 h-5 text-muted-foreground rotate-180 opacity-0 group-hover:opacity-100 transition" />
                  </div>
                </article>
              </Link>
            ) : (
              // Закрытый урок
              <article key={lesson.id} className={containerClasses}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <h3 className={titleClasses}>{lesson.title}</h3>
                      <p className={statusClasses}>{statusText}</p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            {t('no_lessons_find') || 'В этом модуле пока нет уроков'}
          </div>
        )}
      </div>

      {/* Modals */}
      <ModuleModal open={openEditModal} setOpen={setOpenEditModal} module={module} />
      <ConfirmModal
        open={openDeleteModal}
        setOnClose={() => setOpenDeleteModal(false)}
        confirmAction={deleteMutation.mutate}
      />
    </div>
  );
}
