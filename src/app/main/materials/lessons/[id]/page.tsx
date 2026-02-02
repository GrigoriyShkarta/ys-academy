import LessonLayout from '@/components/Materials/Lesson/LessonLayout';

interface LessonPageProps {
  params: Promise<{ id: string }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { id } = await params;
  const lessonId = Number(id);
  return <LessonLayout lessonId={lessonId} />;
}
