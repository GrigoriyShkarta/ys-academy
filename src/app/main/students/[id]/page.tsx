import Student from '@/components/Students/Student';

export default function StudentPage({ params }: { params: { id: number } }) {
  return <Student id={params.id} />;
}
