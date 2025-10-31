import LessonLayout from '@/components/Materials/Lesson/LessonLayout';

interface LessonPageProps {
  params: { id: string };
}

export default function LessonPage({ params }: LessonPageProps) {
  return <LessonLayout id={Number(params.id)} />;
}
