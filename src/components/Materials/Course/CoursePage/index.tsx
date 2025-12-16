'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { deleteCourse, getCourse } from '@/components/Materials/Course/action';
import Loader from '@/common/Loader';
import { ChevronLeft, CircleChevronRight, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Chip from '@/common/Chip';
import CourseModal from '@/components/Materials/Course/CourseModal';
import StudentModules from '@/components/Students/Student/components/StudentModules';
import ConfirmModal from '@/common/ConfirmModal';
import { useUser } from '@/providers/UserContext';
import Link from 'next/link';
import logo from '../../../../../public/assets/logo.png';
import { Category } from '@/components/Materials/utils/interfaces';
import CategoryListModal from '@/common/CategoryListModal';

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
  const { user } = useUser();

  const t = useTranslations('Common');
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('id');

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => getCourse(courseId, userId ? +userId : undefined),
    enabled: !!courseId,
  });

  console.log('courseId', courseId);

  const deleteMutation = useMutation({
    mutationFn: () => deleteCourse(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      router.back();
    },
  });

  console.log('isLoading', isLoading);
  console.log('course', course);

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
        <div className="flex gap-1 flex-wrap">
          {course?.categories?.map(c => (
            <Chip key={c.id} category={c} />
          ))}
        </div>
      </div>

      {isStudentPage && userId && course.modules.length > 0 && user?.role !== 'student' ? (
        <StudentModules studentId={+userId} modules={course.modules} courseId={courseId} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-2 xl:grid-cols-5 gap-4 w-full box-border">
          {course?.modules &&
            course.modules.map(module => {
              if (module.access) {
                return (
                  <Link
                    href={`/main/materials/modules/${module.id}/?id=${userId}`}
                    className="relative group rounded-lg overflow-hidden border hover:shadow-md transition"
                    key={module.id}
                  >
                    <img
                      src={module?.url ? module.url : logo.src}
                      alt={module.title}
                      className="w-full h-48 object-cover cursor-pointer"
                    />

                    <div className="absolute left-2 top-2 p-1 bg-white/50 text-xs rounded-xl">
                      {module.progress}%
                    </div>

                    <div
                      className="p-2 text-center text-sm font-medium text-muted-foreground truncate"
                      title={module.title}
                    >
                      {module.title}
                    </div>
                    {module?.categories && module?.categories?.length > 0 && (
                      <div className="flex gap-1 m-2 justify-center">
                        {module?.categories?.slice(0, 2).map(category => (
                          <Chip key={category.id} category={category} />
                        ))}
                        {module?.categories?.length > 2 && (
                          <CircleChevronRight
                            className="cursor-pointer"
                            onClick={() => seCategoryList(module.categories)}
                          />
                        )}
                      </div>
                    )}
                  </Link>
                );
              } else {
                return (
                  <div
                    key={module.id}
                    className={`relative group rounded-lg overflow-hidden border hover:shadow-md transition`}
                  >
                    <img
                      src={module?.url ? module.url : logo.src}
                      alt={module.title}
                      className="w-full h-48 object-cover cursor-pointer"
                    />

                    <div
                      className="p-2 text-center text-sm font-medium text-muted-foreground truncate"
                      title={module.title}
                    >
                      {module.title}
                    </div>
                    {module?.categories && module?.categories?.length > 0 && (
                      <div className="flex gap-1 m-2 justify-center">
                        {module?.categories?.slice(0, 2).map(category => (
                          <Chip key={category.id} category={category} />
                        ))}
                        {module?.categories?.length > 2 && (
                          <CircleChevronRight
                            className="cursor-pointer"
                            onClick={() => seCategoryList(module.categories)}
                          />
                        )}
                      </div>
                    )}

                    <div className="absolute left-0 top-0 w-full h-full bg-black/30">
                      <LockKeyhole
                        width={69}
                        height={60}
                        className="m-auto h-[85%] text-white"
                        color="white"
                      />
                    </div>
                  </div>
                );
              }
            })}
        </div>
      )}

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
