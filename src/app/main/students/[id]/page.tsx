import Student from '@/components/Students/Student';

export default async function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const studentId = Number(id);
  return <Student id={studentId} />;
}
