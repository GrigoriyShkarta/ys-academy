import { FormEvent, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { Subscription } from '@/components/Materials/utils/interfaces';
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
import { FormFooter } from '@/common/ModalFooter';
import { createSubscription } from '@/components/Materials/Subscriptions/action';
import { Label } from '@radix-ui/react-menu';

interface Props {
  hideTrigger?: boolean;
  openModal?: boolean;
  closeModal?: () => void;
  selectCategory?: (ids: []) => void;
  subscription?: Subscription | null;
}

export default function SubscriptionModal({
  subscription,
  closeModal,
  openModal,
  hideTrigger = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const initial = {
    title: '',
    price: 0,
    lessons_count: 0,
  };

  const [localAbonement, setLocalAbonement] = useState<{
    title: string;
    price: number;
    lessons_count: number;
  }>(initial);

  const t = useTranslations('Materials');
  const queryClient = useQueryClient();

  // Синхронизация с пропсом abonement (для редактирования)
  useEffect(() => {
    if (subscription) {
      setLocalAbonement({
        title: subscription.title || '',
        price: subscription.price || 0,
        lessons_count: subscription.lessons_count || 0,
      });
      setOpen(true);
    } else {
      setLocalAbonement(initial);
    }
  }, [subscription]);

  // Открытие модалки извне
  useEffect(() => {
    if (openModal !== undefined) {
      setOpen(openModal);
    }
  }, [openModal]);

  // Валидация формы: все поля должны быть заполнены корректно
  useEffect(() => {
    const isTitleValid = localAbonement.title.trim().length > 0;
    const isPriceValid = localAbonement.price > 0;
    const isLessonsValid = localAbonement.lessons_count > 0;

    setIsValid(isTitleValid && isPriceValid && isLessonsValid);
  }, [localAbonement]);

  const handleClose = (value: boolean) => {
    setOpen(value);
    closeModal?.();
    setLocalAbonement(initial);
    setIsValid(false);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isValid) return;

    setIsLoading(true);

    try {
      if (subscription) {
        // TODO: добавить updateAbonement, когда будет реализовано редактирование
        // await updateAbonement(abonement.id, localAbonement);
      } else {
        await createSubscription(localAbonement);
      }

      await queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    } finally {
      setIsLoading(false);
      handleClose(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button className="bg-accent w-[240px] mx-auto">{t('create_subscription')}</Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t(subscription ? 'edit_subscription' : 'create_subscription')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 flex flex-col">
          <div className="flex flex-col gap-1">
            <Label>{t('title')}:</Label>
            <Input
              value={localAbonement.title}
              placeholder={t('enterTitle')}
              onChange={e =>
                setLocalAbonement(prev => ({
                  ...prev,
                  title: e.target.value,
                }))
              }
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label>{t('price')}:</Label>
            <Input
              type="number"
              min="1"
              step="1"
              value={localAbonement.price === 0 ? '' : localAbonement.price}
              placeholder={t('price')}
              onChange={e => {
                const value = e.target.value === '' ? 0 : Number(e.target.value);
                setLocalAbonement(prev => ({
                  ...prev,
                  price: value,
                }));
              }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label>{t('lessons_count')}:</Label>
            <Input
              type="number"
              min="1"
              step="1"
              value={localAbonement.lessons_count === 0 ? '' : localAbonement.lessons_count}
              placeholder={t('lessons_count')}
              onChange={e => {
                const value = e.target.value === '' ? 0 : Number(e.target.value);
                setLocalAbonement(prev => ({
                  ...prev,
                  lessons_count: value,
                }));
              }}
            />
          </div>

          <DialogFooter className="flex justify-end space-x-2 mt-4">
            <FormFooter
              isLoading={isLoading}
              isValid={isValid}
              onCancel={() => handleClose(false)}
              onSubmitText={subscription ? t('edit') : t('add')}
              onCancelText={t('cancel')}
              loadingText={t('uploading')}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
