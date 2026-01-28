import LessonRecordingsLayout from '@/components/LessonRecordings';

export default async function LessonRecordingsPage({
  params,
}: {
  params: Promise<{ id: number }>;
}) {
  const { id } = await params;

  return <LessonRecordingsLayout id={+id} />;
};