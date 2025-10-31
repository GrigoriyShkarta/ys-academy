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

export default function ModulesLayout() {
  const [isCreateModule, setIsCreateModule] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState<Module | null>(null);
  const t = useTranslations('Materials');

  const { data: modules, isLoading } = useQuery({
    queryKey: ['modules', search],
    queryFn: () => getModules({ search }),
    placeholderData: keepPreviousData,
  });

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-5xl text-center mb-2">{t('my_modules')}</h1>
      <Button
        className="bg-accent w-[240px] mx-auto"
        onClick={() => {
          setSelectedFile(null);
          setIsCreateModule(true);
        }}
      >
        {t('create_module')}
      </Button>

      {modules && (
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
          linkUrl={'modules'}
          hiddenClickAll
          isOneSelectItem
          hiddenCheckbox
          isLink
          queryKey="modules"
        />
      )}

      <ModuleModal open={isCreateModule} setOpen={setIsCreateModule} module={selectedFile} />
    </div>
  );
}
