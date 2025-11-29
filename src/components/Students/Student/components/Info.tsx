import { Student } from '@/components/Students/interface';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Info({ student }: { student: Student }) {
  return (
    <div className="space-y-4 w-full flex flex-col">
      <div className="space-y-4 w-full flex flex-col items-center">
        <Avatar className="w-48 h-48">
          <AvatarImage src={student?.avatar ?? ''} alt={student.name} />
          <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
        </Avatar>

        <h1 className="text-4xl">{student.name}</h1>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-lg">Email: {student.email}</p>
      </div>
    </div>
  );
}
