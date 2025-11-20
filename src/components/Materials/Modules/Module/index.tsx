'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteModule, getModule } from '@/components/Materials/Modules/action';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import ModuleModal from '@/components/Materials/Modules/ModuleModal';
import ConfirmModal from '@/common/ConfirmModal';
import Loader from '@/common/Loader';
import logo from '../../../../../public/assets/logo.png';

export default function ModuleLayout({ id }: { id: number }) {
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const queryClient = useQueryClient();
  const t = useTranslations('Materials');
  const router = useRouter();

  const { data: module, isLoading } = useQuery({
    queryKey: ['module'],
    queryFn: () => getModule(id),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteModule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      router.back();
    },
  });

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col gap-8 w-full">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center"
        aria-label="Назад"
      >
        <ChevronLeft />
        <span>{t('back')}</span>
      </button>

      <h1 className="text-5xl text-center">{module?.title}</h1>

      <div className="flex gap-4 w-full">
        <div className="flex flex-col w-1/3 h-1/3 gap-4">
          <img
            src={module?.url ? module.url : logo.src}
            alt={module?.title}
            className="object-cover"
          />
          <div className="flex justify-center gap-4">
            <Button variant="destructive" onClick={() => setOpenDeleteModal(true)}>
              {t('delete')}
            </Button>
            <Button className="bg-accent" onClick={() => setOpenEditModal(true)}>
              {t('edit')}
            </Button>
          </div>
        </div>

        <ul className="flex-col gap-2">
          {module?.lessons?.map(lesson => (
            <Link
              key={lesson.id}
              href={`/main/materials/lessons/${lesson.id}`}
              className="text-[18px] underline"
            >
              <li className="flex items-center gap-2">
                <span>{lesson.title}</span>
              </li>
            </Link>
          ))}
        </ul>
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
