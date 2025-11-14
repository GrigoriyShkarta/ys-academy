import { useTranslations } from 'next-intl';

export default function DrugOverflow({ dragActive }: { dragActive: boolean }) {
  const t = useTranslations('Common');

  return (
    dragActive && (
      <div className="absolute inset-0 z-500 flex items-center justify-center h-screen bg-black/40 pointer-events-none">
        <div className="rounded-md border-2 border-dashed border-white bg-white/10 px-6 py-4 text-white">
          {t('drug_drop_here')}
        </div>
      </div>
    )
  );
}
