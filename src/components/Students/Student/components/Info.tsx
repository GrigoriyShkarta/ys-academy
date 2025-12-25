import { Student } from '@/components/Students/interface';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from 'next-intl';

export default function Info({ student }: { student: Student }) {
  const t = useTranslations('Students');

  return (
    <div className="w-full mx-auto space-y-8">
      {/* Основная информация */}
      <Card>
        <CardHeader>
          <CardTitle>{t('basic_information')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label={t('city')} value={student?.city ?? '—'} />
          <InfoRow label={t('email')} value={student?.email ?? '—'} />
          <InfoRow
            label={t('date_of_birth')}
            value={student.birthDate ? new Date(student.birthDate).toLocaleDateString() : '—'}
          />
          <InfoRow label={t('telegram')} value={student?.telegram ?? '—'} />
          <InfoRow label={t('instagram')} value={student?.instagram ?? '—'} />
        </CardContent>
      </Card>

      {/* Опыт */}
      <Card>
        <CardHeader>
          <CardTitle>{t('music_and_vocal_experience')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoBlock title={t('musical_level')} text={student.musicLevel} />
          <InfoBlock title={t('vocal_experience')} text={student.vocalExperience} />
        </CardContent>
      </Card>

      {/* Цели */}
      <Card>
        <CardHeader>
          <CardTitle>{t('learning_goals')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {student.goals || '—'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/* ====== Вспомогательные компоненты ====== */

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string | null;
  icon?: React.ReactNode;
}) {
  if (!value) return null;

  return (
    <div className="flex items-center gap-3 text-sm">
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <span className="text-muted-foreground w-32">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function InfoBlock({ title, text }: { title: string; text?: string | null }) {
  return (
    <div>
      <h4 className="text-sm font-medium mb-1">{title}</h4>
      <p className="text-sm text-muted-foreground whitespace-pre-line">{text || '—'}</p>
    </div>
  );
}
