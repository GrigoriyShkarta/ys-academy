'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteModule, getModule } from '@/components/Materials/Modules/action';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import Loader from '@/common/Loader';

export default function ModuleLayout({ moduleId }: { moduleId?: number }) {
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const queryClient = useQueryClient();
  const t = useTranslations('Materials');
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

  if (isLoading) return <Loader />;

  // вычислим общий прогресс (пример)
  const totalLessons = module?.lessons?.length ?? 0;
  const completedLessons = module?.lessons?.filter((l: any) => l.access === true).length ?? 0;
  const progress = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div></div>
    // <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
    //   <button
    //     type="button"
    //     onClick={() => router.back()}
    //     className="flex items-center gap-2 text-sm text-muted-foreground mb-4"
    //     aria-label="Назад"
    //   >
    //     <ChevronLeft />
    //     <span>{t('back')}</span>
    //   </button>
    //
    //   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    //     {/* Main content */}
    //     <div className="lg:col-span-2 space-y-4">
    //       <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{module?.title}</h1>
    //
    //       <div className="flex items-center gap-4 text-sm text-muted-foreground">
    //         <div className="flex items-center gap-1">
    //           <Star className="w-4 h-4 text-yellow-400" />
    //           <span className="font-medium">4.7</span>
    //           <span className="text-xs text-muted-foreground">· 12 345 студентов</span>
    //         </div>
    //
    //         <div className="h-4 w-px bg-border" />
    //
    //         <div className="text-xs text-muted-foreground">
    //           Категория: {module?.category ?? '—'}
    //         </div>
    //       </div>
    //
    //       <p className="text-base text-muted-foreground">
    //         {module?.description ?? 'Описание отсутствует'}
    //       </p>
    //
    //       <div className="mt-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
    //         <div className="flex items-center justify-between px-4 py-3 border-b">
    //           <div className="flex items-center gap-3">
    //             <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold">
    //               {progress}%
    //             </div>
    //             <div>
    //               <div className="text-sm font-medium">Прогресс курса</div>
    //               <div className="text-xs text-muted-foreground">
    //                 {completedLessons}/{totalLessons} уроков
    //               </div>
    //             </div>
    //           </div>
    //           <div className="w-40">
    //             <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
    //               <div
    //                 className="h-full bg-emerald-500"
    //                 style={{ width: `${progress}%` }}
    //                 role="progressbar"
    //                 aria-valuenow={progress}
    //               />
    //             </div>
    //           </div>
    //         </div>
    //
    //         <div className="px-4 py-3">
    //           <h3 className="text-lg font-medium mb-2">Содержание курса</h3>
    //           <ul className="space-y-2">
    //             {module?.lessons?.map((lesson: any) => (
    //               <li
    //                 key={lesson.id}
    //                 className="flex items-center gap-3 p-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition"
    //               >
    //                 <Link
    //                   href={`/main/materials/lessons/${lesson.id}`}
    //                   className="flex items-center gap-3 flex-1"
    //                 >
    //                   <div className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-md">
    //                     <Play className="w-4 h-4 text-muted-foreground" />
    //                   </div>
    //
    //                   <div className="min-w-0">
    //                     <div className="text-sm font-medium truncate">{lesson.title}</div>
    //                     <div className="text-xs text-muted-foreground">
    //                       {lesson.blocks ? `${lesson.blocks} блоков` : '—'} ·{' '}
    //                       {lesson.access ? 'Доступ' : 'Закрыт'}
    //                     </div>
    //                   </div>
    //                 </Link>
    //
    //                 <div className="flex items-center gap-2">
    //                   {lesson.access ? (
    //                     <span className="text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full text-xs flex items-center gap-1">
    //                       <Unlock className="w-3 h-3" /> Открыт
    //                     </span>
    //                   ) : (
    //                     <span className="text-rose-700 bg-rose-100 px-2 py-1 rounded-full text-xs flex items-center gap-1">
    //                       <Lock className="w-3 h-3" /> Закрыт
    //                     </span>
    //                   )}
    //                 </div>
    //               </li>
    //             ))}
    //           </ul>
    //         </div>
    //       </div>
    //     </div>
    //
    //     {/* Sidebar - Udemy style card */}
    //     <aside className="lg:col-span-1">
    //       <div className="sticky top-6 space-y-4">
    //         <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
    //           <img
    //             src={module?.url ?? logo.src}
    //             alt={module?.title ?? 'module'}
    //             className="w-full h-48 object-cover"
    //           />
    //
    //           <div className="p-4">
    //             <div className="flex items-baseline justify-between">
    //               <div className="text-2xl font-bold">₽990</div>
    //               <div className="text-xs line-through text-muted-foreground">₽4 990</div>
    //             </div>
    //
    //             <div className="mt-3 flex flex-col gap-2">
    //               <Button
    //                 className="w-full"
    //                 onClick={() => {
    //                   /* enroll action */
    //                 }}
    //               >
    //                 Записаться на курс
    //               </Button>
    //
    //               <Button
    //                 variant="outline"
    //                 className="w-full"
    //                 onClick={() => {
    //                   /* preview action */
    //                 }}
    //               >
    //                 Бесплатный просмотр
    //               </Button>
    //             </div>
    //
    //             <div className="mt-4 text-sm text-muted-foreground">
    //               <div>Длительность: {module?.duration ?? '—'}</div>
    //               <div>Уроков: {totalLessons}</div>
    //               <div>Язык: {module?.language ?? 'RU'}</div>
    //             </div>
    //           </div>
    //         </div>
    //
    //         <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4">
    //           <h4 className="text-sm font-medium mb-2">Что вы получите</h4>
    //           <ul className="text-sm text-muted-foreground space-y-1">
    //             <li>• Практические задания</li>
    //             <li>• Доступ к материалам</li>
    //             <li>• Сертификат по окончании</li>
    //           </ul>
    //         </div>
    //
    //         <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4">
    //           <div className="flex items-center gap-3">
    //             <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
    //               <span className="font-semibold">IN</span>
    //             </div>
    //             <div>
    //               <div className="text-sm font-medium">Инструктор</div>
    //               <div className="text-xs text-muted-foreground">Имя Фамилия</div>
    //             </div>
    //           </div>
    //         </div>
    //       </div>
    //     </aside>
    //   </div>
    //
    //   <ModuleModal open={openEditModal} setOpen={setOpenEditModal} module={module} />
    //   <ConfirmModal
    //     open={openDeleteModal}
    //     setOnClose={() => setOpenDeleteModal(false)}
    //     confirmAction={deleteMutation.mutate}
    //   />
    // </div>
  );
}
