import LessonDetail from '@/components/Students/Student/components/LessonDetail';

export default async function LessonDetailPage({
  params,
}: {
  params: Promise<{ id: number; lessonId: number }>;
}) {
  const { id, lessonId } = await params;
  const studentId = Number(id);
  const numberLessonId = Number(lessonId);

  return <LessonDetail studentId={studentId} lessonId={numberLessonId} />;
}
