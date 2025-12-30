'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/query-core';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import ModuleModal from '@/components/Materials/Modules/ModuleModal';
import { deleteModule, getModules } from '@/components/Materials/Modules/action';
import MediaGallery from '@/common/MediaGallery';
import { IFile, Module } from '@/components/Materials/utils/interfaces';
import Loader from '@/common/Loader';
import { getCategories } from '@/components/Materials/Categories/action';
import { useUser } from '@/providers/UserContext';

export default function ModulesLayout() {
  const [isCreateModule, setIsCreateModule] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState<Module | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const t = useTranslations('Materials');
  const { user } = useUser();

  const { data: modules, isLoading } = useQuery({
    queryKey: ['modules', search, selectedCategories],
    queryFn: () => getModules({ search, categories: selectedCategories }),
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
          setIsCreateModule(true);
        }}
      >
        {t('create_module')}
      </Button>

      {modules && modules?.length > 0 && (
        <MediaGallery
          data={modules}
          handleEdit={(item: IFile) => {
            setSelectedFile(item);
            setIsCreateModule(true);
          }}
          handleDelete={ids => deleteModule(ids[0])}
          onSearchChange={newSearch => {
            setSearch(newSearch);
          }}
          multiSelectOptions={categoryOptions}
          onMultiSelectChange={onMultiSelectChange}
          linkUrl={'modules'}
          hiddenClickAll
          isOneSelectItem
          hiddenCheckbox
          isLink
          queryKey="modules"
          hideLessons
        />
      )}

      <ModuleModal open={isCreateModule} setOpen={setIsCreateModule} module={selectedFile} />
    </div>
  );
}
