import { Button } from '@/components/ui/button';
import { ArrowUpIcon, Edit3Icon, Send, SquareChevronUp, Trash } from 'lucide-react';
import { StudentSubscription } from '@/components/Students/interface';
import { Dispatch, SetStateAction, useState } from 'react';
import ConfirmModal from '@/common/ConfirmModal';
import { useTranslations } from 'next-intl';

interface Props {
  subscription: StudentSubscription;
  idx: number;
  handleCopyMessage: (subscription: StudentSubscription) => void;
  createNewSubscription: (subscriptionId: number) => void;
  handleClickEditSubscription: (subscriptionId: number) => void;
  setEditingId: Dispatch<SetStateAction<number | undefined>>;
  isLoadingDelete: boolean;
  editingId: number | undefined;
  handleDeleteSubscription: (subscriptionId: number) => Promise<void>;
  hiddenButtons: boolean;
  setShowMore: Dispatch<SetStateAction<number[]>>;
}

export default function SubscriptionButtons({
  subscription,
  handleCopyMessage,
  createNewSubscription,
  handleClickEditSubscription,
  setEditingId,
  isLoadingDelete,
  editingId,
  handleDeleteSubscription,
  hiddenButtons,
  setShowMore,
  idx,
}: Props) {
  const [openConfirm, setOpenConfirm] = useState(false);
  const t = useTranslations('Students');

  const handleCloseCard = () => {
    setShowMore(prev => prev.filter(i => i !== idx));
  };

  return (
    <div className="flex gap-2">
      {!hiddenButtons ? (
        <>
          <Button
            variant="outline"
            onClick={() => handleCopyMessage(subscription)}
            title={t('send_email')}
          >
            <Send />
          </Button>
          <Button
            variant="outline"
            onClick={() => createNewSubscription(subscription.id)}
            title={t('extend_subscription')}
          >
            <ArrowUpIcon />
          </Button>
        </>
      ) : (
        <Button variant="outline" onClick={handleCloseCard} title={t('collapse')}>
          <SquareChevronUp />
        </Button>
      )}

      <Button
        variant="outline"
        onClick={() => handleClickEditSubscription(subscription.id)}
        title={t('edit')}
      >
        <Edit3Icon />
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          setEditingId(subscription.id);
          setOpenConfirm(true);
        }}
        title={t('delete')}
        className="bg-red-200!"
      >
        <Trash color="red" />
      </Button>

      <ConfirmModal
        open={openConfirm}
        isLoading={isLoadingDelete}
        setOnClose={() => setOpenConfirm(false)}
        confirmAction={() => {
          handleDeleteSubscription(editingId!).then(() => setOpenConfirm(false));
        }}
      />
    </div>
  );
}
