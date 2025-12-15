'use client';

import { useState } from 'react';
import { Course, IFile } from '@/components/Materials/utils/interfaces';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/query-core';
import { getCategories } from '@/components/Materials/Categories/action';
import { getCourses } from '@/components/Materials/Course/action';
import Loader from '@/common/Loader';
import { Button } from '@/components/ui/button';
import MediaGallery from '@/common/MediaGallery';
import { deleteModule } from '@/components/Materials/Modules/action';
import CourseModal from '@/components/Materials/Course/CourseModal';
import { useUser } from '@/providers/UserContext';

export default function CourseLayout() {
  const [isCreateCourse, setIsCreateCourse] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState<Course | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const t = useTranslations('Materials');
  const { user } = useUser();

  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses', search, selectedCategories],
    queryFn: () => getCourses({ search, categories: selectedCategories }),
    placeholderData: keepPreviousData,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories({ page: 'all' }),
    enabled: user?.role === 'super_admin',
  });

  const categoryOptions = (categories?.data ?? []).map((c: any) => ({
    value: String(c.id),
    label: c.title,
    color: c.color,
  }));

  const onMultiSelectChange = (selected: string[]) => {
    setSelectedCategories(selected);
  };

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col gap-4 p-4 mt-18 sm:mt-0">
      <Button
        className="bg-accent w-[240px] mx-auto"
        onClick={() => {
          setSelectedFile(null);
          setIsCreateCourse(true);
        }}
      >
        {t('create_course')}
      </Button>

      {courses && (
        <MediaGallery
          data={courses}
          handleEdit={(item: IFile) => {
            setSelectedFile(item as Course);
            setIsCreateCourse(true);
          }}
          handleDelete={ids => deleteModule(ids[0])}
          onSearchChange={newSearch => {
            setSearch(newSearch);
          }}
          multiSelectOptions={categoryOptions}
          onMultiSelectChange={onMultiSelectChange}
          linkUrl={'courses'}
          hiddenClickAll
          isOneSelectItem
          hiddenCheckbox
          isLink
          queryKey="courses"
          hideLessons
        />
      )}

      <CourseModal open={isCreateCourse} setOpen={setIsCreateCourse} course={selectedFile} />
    </div>
  );
}
