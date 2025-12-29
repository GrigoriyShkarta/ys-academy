import CoursePageLayout from '@/components/Materials/Course/CoursePage';

export default async function CoursePage({ params }: { params: Promise<{ id: number }> }) {
  const { id } = await params;

  return <CoursePageLayout courseId={+id} />;
}
