import { useTranslations } from 'next-intl';

export default function ConfirmTextChild() {
  const t = useTranslations('Common');

  return (
    <div className="flex flex-col gap-2">
      <p>{t('delete_files_confirm')}</p>
      <p>{t('files_used_in_lessons_warning')}</p>
    </div>
  );
}
