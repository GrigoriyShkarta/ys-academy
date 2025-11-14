import { Dispatch, FormEvent, SetStateAction, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { editPhoto, uploadPhoto } from '@/components/Materials/Photo/action';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dropzone } from '@/common/Dropzone';
import { FormFooter } from '@/common/ModalFooter';
import { IFile } from '@/components/Materials/utils/interfaces';
import PhotoPreviewList from '@/components/Materials/Audio/PhotoPreviewList';

interface Props {
  openModal?: boolean;
  closeModal?: Dispatch<SetStateAction<boolean>>;
  hideTrigger?: boolean;
  photo?: IFile | null;
  setSelectedFile?: Dispatch<SetStateAction<IFile | null>>;
  uploadedFiles: File[] | null;
  setUploadedFiles: Dispatch<SetStateAction<File[] | null>>;
}

export default function PhotoModal({
  photo,
  setSelectedFile,
  openModal,
  closeModal,
  hideTrigger,
  uploadedFiles,
  setUploadedFiles,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [fetchingFileIdx, setFetchingFileIdx] = useState<number | null>(null);
  const t = useTranslations('Materials');
  const queryClient = useQueryClient();

  useEffect(() => {
    if (uploadedFiles) {
      setOpen(true);
      setPhotoFiles(uploadedFiles);
    }
    if (photo) {
      setTitle(photo.title);
      setOpen(true);
    }
    if (openModal) {
      setOpen(true);
    }
  }, [uploadedFiles, photo, openModal]);

  const appendFiles = (files: File[]) => {
    if (!files || files.length === 0) return;
    const sliceFiles = files.slice(0, 9 - photoFiles?.length);
    setPhotoFiles(prevFiles => [...prevFiles, ...sliceFiles]);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    if (photo) {
      const formatedFile = {
        content: photo.url,
        title,
      };
      await editPhoto(photo.id, formatedFile);
    } else {
      for (let i = 0; i < photoFiles.length; i++) {
        const item = photoFiles[i];
        const formatedFile = {
          content: item,
          title: item.name?.replace(/\.[^/.]+$/, ''),
        };
        setFetchingFileIdx(i);
        await uploadPhoto(formatedFile);
      }
    }
    await queryClient.invalidateQueries({ queryKey: ['photos'] });
    setIsLoading(false);
    handleClose(false);
  };

  const handleClose = (val: boolean) => {
    setOpen(val);
    setPhotoFiles([]);
    setPhotoFiles([]);
    setFetchingFileIdx(null);
    if (setSelectedFile) {
      setSelectedFile(null);
    }
    if (closeModal) {
      closeModal(false);
    }
    if (setUploadedFiles) {
      setUploadedFiles(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button className="bg-accent w-[240px] mx-auto">{t('addPhoto')}</Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t(photo ? 'editPhoto' : 'addPhoto')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={e => onSubmit(e)} className="space-y-4">
          {photo ? (
            <>
              <>
                <label>{t('title')}</label>
                <Input placeholder={t('enterTitle')} />
              </>

              <img
                src={photo.url}
                alt={photo.title}
                className="block w-full  h-full max-h-[250px] object-contain"
              />
            </>
          ) : (
            <>
              <label>{t('file')}</label>
              <Dropzone
                multiple
                values={photoFiles}
                onChangeMany={files => appendFiles(files)}
                dragLabel={t('dragOrClick')}
                accept={['image/*']}
                label={t('jpeg_or_png')}
                maxFiles={9}
                disabled={photoFiles?.length >= 9}
              />

              <PhotoPreviewList
                fetchingIdx={fetchingFileIdx}
                uploadedFiles={photoFiles}
                setUploadedFiles={setPhotoFiles}
              />
            </>
          )}

          <DialogFooter className="flex justify-end space-x-2">
            <FormFooter
              isLoading={isLoading}
              isValid={photoFiles?.length > 0 || !!photo}
              onCancel={() => handleClose(false)}
              onSubmitText={t('add')}
              onCancelText={t('cancel')}
              loadingText={t('uploading')}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
