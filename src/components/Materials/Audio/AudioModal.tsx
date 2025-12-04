'use client';

import { Dispatch, FormEvent, SetStateAction, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { editAudio, uploadAudio } from '@/components/Materials/Audio/action';
import { IFile } from '@/components/Materials/utils/interfaces';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dropzone } from '@/common/Dropzone';
import { FormFooter } from '@/common/ModalFooter';
import AudioPreviewList from '@/components/Materials/Audio/AudioPreviewList';
import MultiSelect from '@/common/MultiSelect';
import { getCategories } from '@/components/Materials/Categories/action';

interface Props {
  openModal?: boolean;
  closeModal?: Dispatch<SetStateAction<boolean>>;
  hideTrigger?: boolean;
  audio?: IFile | null;
  setNewFiles?: Dispatch<SetStateAction<File[] | null>>;
  uploadedFiles: File[] | null;
  setUploadedFiles: Dispatch<SetStateAction<File[] | null>>;
  setSelectedFile?: Dispatch<SetStateAction<IFile | null>>;
}

export default function AudioModal({
  openModal,
  closeModal,
  hideTrigger,
  audio,
  uploadedFiles,
  setUploadedFiles,
  setSelectedFile,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations('Materials');
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [fetchingFileIdx, setFetchingFileIdx] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[] | undefined>([]);
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories({ page: 'all' }),
  });

  const categoryOptions = (categories?.data ?? []).map((c: any) => ({
    value: String(c.id),
    label: c.title,
    color: c.color,
  }));

  useEffect(() => {
    if (uploadedFiles) {
      setOpen(true);
      setAudioFiles(uploadedFiles);
    }
    if (audio) {
      setTitle(audio.title);
      setCategoryIds(audio?.categories?.map(c => String(c.id)));
      setOpen(true);
    }
    if (openModal) {
      setOpen(true);
    }
  }, [uploadedFiles, audio, openModal]);

  const handleClose = (value: boolean) => {
    setOpen(value);
    setAudioFiles([]);
    setFetchingFileIdx(null);
    if (setUploadedFiles) setUploadedFiles(null);
    if (setSelectedFile) setSelectedFile(null);
    if (closeModal) closeModal(value);
  };

  const appendFiles = (files: File[]) => {
    if (!files || files.length === 0) return;
    const sliceFiles = files.slice(0, 9 - audioFiles?.length);
    setAudioFiles(prevFiles => [...prevFiles, ...sliceFiles]);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    if (audio) {
      const formatedFile = {
        content: audio.url,
        categoryIds,
        title,
      };
      await editAudio(audio.id, formatedFile);
    } else {
      for (let i = 0; i < audioFiles.length; i++) {
        const item = audioFiles[i];
        const rawCategories = (item as any).categories ?? [];
        const categories = rawCategories.map((id: string | number) => Number(id));
        const formatedFile = {
          content: item,
          title: item.name?.replace(/\.[^/.]+$/, ''),
          categories,
        };
        setFetchingFileIdx(i);
        await uploadAudio(formatedFile);
      }
    }
    await queryClient.invalidateQueries({ queryKey: ['audios'] });
    setIsLoading(false);
    handleClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button className="bg-accent w-[240px] mx-auto">{t('addAudio')}</Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t(audio ? 'editAudio' : 'addAudio')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={e => onSubmit(e)} className="space-y-4">
          {audio ? (
            <>
              <>
                <label>{t('title')}</label>
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  maxLength={50}
                  placeholder={t('enterTitle')}
                  className="mt-2"
                />
              </>
              <MultiSelect
                options={categoryOptions}
                selected={categoryIds}
                onChange={next => setCategoryIds(prev => (prev ? next : undefined))}
                placeholder={t('select_categories')}
                className="w-full"
              />
              <audio
                controls
                preload="metadata"
                src={audio.url}
                className="block w-full h-[54px]"
              />
            </>
          ) : (
            <>
              <label>{t('files')}</label>
              <Dropzone
                multiple
                values={audioFiles}
                onChangeMany={files => appendFiles(files)}
                maxFiles={9}
                dragLabel={t('dragOrClick')}
                accept={['audio/', 'audio/*']}
                label={t('mp3_or_wav')}
                disabled={audioFiles?.length >= 9}
              />

              <AudioPreviewList
                fetchingIdx={fetchingFileIdx}
                uploadedFiles={audioFiles}
                setUploadedFiles={setAudioFiles}
              />
            </>
          )}

          <DialogFooter className="flex justify-end space-x-2">
            <FormFooter
              isLoading={isLoading}
              isValid={audioFiles?.length > 0 || !!audio}
              onCancel={() => handleClose(false)}
              onSubmitText={audio ? t('edit') : t('add')}
              onCancelText={t('cancel')}
              loadingText={t('uploading')}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
