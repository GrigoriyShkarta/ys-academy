import CoursePageLayout from '@/components/Materials/Course/CoursePage';

export default function CoursePage({ params }: { params: { id: number } }) {
  return <CoursePageLayout courseId={params.id} />;
}
