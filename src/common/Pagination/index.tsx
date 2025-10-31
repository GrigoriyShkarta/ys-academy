import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

interface Props {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, onPageChange, totalPages }: Props) {
  const t = useTranslations('Common');

  return (
    <div className="flex justify-center items-center mt-2 gap-2">
      <Button
        variant="outline"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        {t('back')}
      </Button>
      <span className="text-sm text-muted-foreground">
        {t('page')} {currentPage} {t('of')} {totalPages}
      </span>
      <Button
        variant="outline"
        disabled={currentPage === totalPages || totalPages === 0}
        onClick={() => onPageChange(currentPage + 1)}
      >
        {t('forward')}
      </Button>
    </div>
  );
}
