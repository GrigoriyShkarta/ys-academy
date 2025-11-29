import LessonDetail from '@/components/Students/Student/components/LessonDetail';

export default function LessonDetailPage({ params }: { params: { id: number; lessonId: number } }) {
  return <LessonDetail studentId={params.id} lessonId={params.lessonId} />;
}
