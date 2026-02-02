import LessonLayout from "@/components/Materials/Lesson/LessonLayout";

export default async function LessonCoursePage({ params }: { params: Promise<{ id: number }> }) {
  const { id } = await params;
  return (<LessonLayout lessonId={+id} />
    
  );
}