import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface Props {
  open: boolean;
  setOnClose: () => void;
  confirmAction: () => void;
  isLoading?: boolean;
  textContent?: string;
}

export default function ConfirmModal({
  open,
  confirmAction,
  isLoading,
  setOnClose,
  textContent,
}: Props) {
  const t = useTranslations('Common');

  return (
    <Dialog open={open} onOpenChange={setOnClose}>
      <DialogContent>
        <DialogTitle>
          <VisuallyHidden>Preview Image</VisuallyHidden>
        </DialogTitle>
        <div className="flex flex-col gap-4">
          <p className="text-center">{textContent || t('confirm_action')}</p>
          <div className="flex w-full gap-4 justify-center">
            <Button variant="ghost" type="button" onClick={setOnClose}>
              {t('cancel')}
            </Button>
            <Button
              className="bg-accent flex items-center justify-center gap-2"
              onClick={confirmAction}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" />
                  {t('sending')}
                </>
              ) : (
                t('send')
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
