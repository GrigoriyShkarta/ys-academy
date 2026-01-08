import { StudentCourse } from '@/components/Students/interface';
import Link from 'next/link';
import logo from '../../../../../public/assets/logo.png';
import Chip from '@/common/Chip';
import { CircleChevronRight, LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { Category } from '@/components/Materials/utils/interfaces';
import CategoryListModal from '@/common/CategoryListModal';
import { useUser } from '@/providers/UserContext';
import { useTranslations } from 'next-intl';

export default function StudentCourses({
  courses,
  userId,
}: {
  courses?: StudentCourse[];
  userId: number;
}) {
  const [categoryList, seCategoryList] = useState<Category[] | undefined>([]);
  const { user } = useUser();
  const t = useTranslations('SideBar')

  return (
    <div className="flex flex-col gap-4 p-4 mt-18 sm:mt-0 w-full max-h-screen overflow-auto">
      <h1 className="text-4xl text-center">{t('my_courses')}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-2 xl:grid-cols-5 gap-4 w-full h-fit box-border">
      
      {courses &&
        courses.map(course => {
          if (course.access || user?.role === 'super_admin') {
            return (
              <Link
                href={`/main/course/${course.id}/?id=${userId}`}
                className="relative group rounded-lg overflow-hidden border hover:shadow-md transition"
                key={course.id}
              >
                <img
                  src={course?.url ? course.url : logo.src}
                  alt={course.title}
                  className="w-full h-48 object-cover cursor-pointer"
                />

                <div className="absolute left-2 top-2 p-1 bg-white/50 text-xs rounded-xl">
                  {course.progress}%
                </div>

                <div
                  className="p-2 text-center text-sm font-medium text-muted-foreground truncate"
                  title={course.title}
                >
                  {course.title}
                </div>
              </Link>
            );
          } else {
            return (
              <div
                key={course.id}
                className={`relative group rounded-lg overflow-hidden border hover:shadow-md transition`}
              >
                <img
                  src={course?.url ? course.url : logo.src}
                  alt={course.title}
                  className="w-full h-48 object-cover cursor-pointer"
                />

                <div
                  className="p-2 text-center text-sm font-medium text-muted-foreground truncate"
                  title={course.title}
                >
                  {course.title}
                </div>
                {course?.categories?.slice(0, 2).map(category => (
                  <Chip key={category.id} category={category} />
                ))}

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

      <CategoryListModal list={categoryList} close={() => seCategoryList(undefined)} />
    </div>
  </div>);
}
