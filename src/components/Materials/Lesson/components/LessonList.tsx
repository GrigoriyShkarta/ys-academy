import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { BookOpenText } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';
import { Input } from '@/components/ui/input';

interface Props {
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  lessons: {
    id: number;
    title: string;
  }[];
}

export default function LessonList({ lessons, search, setSearch }: Props) {
  const t = useTranslations('Common');

  return (
    <div className="flex flex-col gap-8">
      <Input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder={t('search')}
        className="w-[340px]"
      />
      <ul className="flex flex-col gap-2">
        {lessons.map(lesson => (
          <li key={lesson.id} className="flex items-center gap-2">
            <BookOpenText color="#65a1f5" />
            <Link href={`lessons/${lesson.id}`} className="text-[18px] underline">
              {lesson.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
