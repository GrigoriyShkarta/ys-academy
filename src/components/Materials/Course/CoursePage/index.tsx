'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { deleteCourse, getCourse } from '@/components/Materials/Course/action';
import Loader from '@/common/Loader';
import { ChevronLeft, GraduationCap, LockKeyhole, Lock, ChevronDown, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Chip from '@/common/Chip';
import CourseModal from '@/components/Materials/Course/CourseModal';
import StudentModules from '@/components/Students/Student/components/StudentModules';
import ConfirmModal from '@/common/ConfirmModal';
import { useUser } from '@/providers/UserContext';
import Link from 'next/link';
import { Category } from '@/components/Materials/utils/interfaces';
import CategoryListModal from '@/common/CategoryListModal';
import { motion, AnimatePresence } from 'framer-motion';

export default function CoursePageLayout({
  courseId,
  isStudentPage,
}: {
  courseId: number;
  isStudentPage?: boolean;
}) {
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [categoryList, seCategoryList] = useState<Category[] | undefined>([]);
  const [expandedModules, setExpandedModules] = useState<number[]>([]);
  const { user } = useUser();

  const t = useTranslations('Common');
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('id');

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => getCourse(courseId, userId ? +userId : undefined),
    enabled: !!user && (user?.role === 'student' ? !!userId : !!courseId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCourse(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      router.back();
    },
  });

  if (isLoading) return <Loader />;

  if (!course) return <div>Course not found</div>;

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-6">
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

        {user?.role === 'super_admin' && (
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
        )}
      </div>

      <div className="flex-col flex gap-4 mb-6">
        <h1 className="text-5xl">{course.title}</h1>
        {user?.role === 'super_admin' && (
          <div className="flex gap-1 flex-wrap">
            {course?.categories?.map(c => (
              <Chip key={c.id} category={c} />
            ))}
          </div>
        )}
      </div>

      {isStudentPage && userId && course.modules.length > 0 && user?.role !== 'student' ? (
        <StudentModules studentId={+userId} modules={course.modules} courseId={courseId} />
      ) : (
        <div className="flex flex-col gap-4 w-full">
          {course?.modules &&
            course.modules.map((module, index) => {
              const isExpanded = expandedModules.includes(module.id);
              const toggleModule = () => {
                setExpandedModules(prev =>
                  prev.includes(module.id) ? prev.filter(id => id !== module.id) : [...prev, module.id]
                );
              };

              const hasAccess = module.access || user?.role === 'super_admin';

              return (
                <div
                  key={module.id}
                  className={`border rounded-xl bg-card overflow-hidden transition-all ${
                    hasAccess ? 'hover:shadow-md' : 'opacity-80'
                  }`}
                >
                  <div
                    onClick={hasAccess ? toggleModule : undefined}
                    className={`p-5 flex items-center justify-between cursor-pointer select-none ${
                      !hasAccess ? 'cursor-not-allowed bg-muted/30' : 'hover:bg-accent/5'
                    }`}
                  >
                    <div className="flex items-center gap-6">
                      <div className="hidden sm:flex text-3xl font-black text-muted-foreground/10 tabular-nums">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-semibold tracking-tight">
                            {module.title}
                          </h3>
                          {!hasAccess && <Lock className="w-4 h-4 text-muted-foreground" />}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                          <span>{module.lessons?.length || 0} {t('lessons')}</span>
                          {hasAccess && user?.role !== 'super_admin' && (
                            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-accent/10 text-accent rounded-full">
                              <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                              {module.progress}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {module?.categories && module?.categories?.length > 0 && (
                        <div className="hidden md:flex gap-1">
                          {user?.role === 'super_admin' && module?.categories?.slice(0, 2).map(category => (
                            <Chip key={category.id} category={category} />
                          ))}
                        </div>
                      )}
                      {hasAccess ? (
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        >
                          <ChevronDown className="w-6 h-6 text-muted-foreground" />
                        </motion.div>
                      ) : (
                        <LockKeyhole className="w-6 h-6 text-muted-foreground/40" />
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && hasAccess && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="border-t bg-muted/5"
                      >
                        <div className="p-2 sm:p-4 grid grid-cols-1 gap-2">
                          {module.lessons && module.lessons.length > 0 ? (
                            module.lessons.map((lesson) => (
                              <Link
                                key={lesson.id}
                                href={`/main/courses/lesson/${lesson.id}/?courseId=${courseId}`}
                                className={`group flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-accent/20 hover:bg-accent/10 transition-all ${
                                  !lesson.access && user?.role !== 'super_admin' 
                                    ? 'opacity-60 cursor-not-allowed pointer-events-none' 
                                    : ''
                                }`}
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center border group-hover:bg-accent group-hover:text-white transition-colors">
                                    <GraduationCap className="w-4 h-4" />
                                  </div>
                                  <span className="font-medium text-sm group-hover:text-accent transition-colors">
                                    {lesson.title}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {!lesson.access && user?.role !== 'super_admin' && (
                                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                                  )}
                                  <ChevronLeft className="w-4 h-4 rotate-180 text-muted-foreground group-hover:text-accent opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                                </div>
                              </Link>
                            ))
                          ) : (
                            <div className="p-4 text-center text-muted-foreground text-sm italic">
                              {t('no_lessons_find')}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
        </div>
      )}

      <div className="flex flex-col gap-2 mt-4">
        {course?.lessons && course?.lessons?.length > 0 && (
          course?.lessons?.map((lesson: any) => {
            const hasAccess = !!lesson.access;

            return hasAccess ? (
              <Link
                key={lesson.id}
                href={`/main/courses/lesson/${lesson.id}/?courseId=${courseId}`}
                className="group flex items-center justify-between p-4 rounded-xl border bg-card hover:shadow-md hover:border-accent/20 hover:bg-accent/5 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center border group-hover:bg-accent group-hover:text-white transition-colors">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold group-hover:text-accent transition-colors">
                      {lesson.title}
                    </span>
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                      {t('let_access')}
                    </span>
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5 rotate-180 text-muted-foreground group-hover:text-accent transition-all transform group-hover:translate-x-1" />
              </Link>
            ) : (
              <div
                key={lesson.id}
                className="flex items-center justify-between p-4 rounded-xl border bg-muted/30 opacity-75 cursor-not-allowed"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-background/50 flex items-center justify-center border">
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-muted-foreground">
                      {lesson.title}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      {t('close')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <CourseModal open={openEditModal} setOpen={setOpenEditModal} course={course} />
      <ConfirmModal
        open={openDeleteModal}
        setOnClose={() => setOpenDeleteModal(false)}
        confirmAction={deleteMutation.mutate}
      />
      <CategoryListModal list={categoryList} close={() => seCategoryList(undefined)} />
    </div>
  );
}
