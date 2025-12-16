import CoursePageLayout from '@/components/Materials/Course/CoursePage';

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const courseId = Number(id);

  return <CoursePageLayout courseId={courseId} isStudentPage />;
}
