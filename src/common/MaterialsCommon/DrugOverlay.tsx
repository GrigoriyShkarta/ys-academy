import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export default function DrugOverlay({ dragActive }: { dragActive: boolean }) {
  const t = useTranslations('Materials');
  return (
    <div
      className={cn(
        'absolute inset-4 rounded-md pointer-events-none transition-opacity',
        dragActive ? 'opacity-100' : 'opacity-0'
      )}
      aria-hidden
    >
      <div className="h-full w-full flex items-center justify-center border-2 border-dashed border-accent bg-accent/5 rounded-md pointer-events-none">
        <div className="text-center pointer-events-none bg-secondary p-4 rounded-md z-1">
          <div className="text-lg font-medium">{t('drop_here')}</div>
          <div className="text-sm text-muted-foreground mt-1">{t('drop_to_upload')}</div>
        </div>
      </div>
    </div>
  );
}
