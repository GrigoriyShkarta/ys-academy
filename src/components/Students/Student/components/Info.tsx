import { Student } from '@/components/Students/interface';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { useState } from 'react';
import InfoUserModal from '@/components/Students/Student/components/InfoUserModal';

export default function Info({ student }: { student: Student }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6 w-full flex flex-col items-center">
      <div className="relative">
        <Avatar className="w-48 h-48">
          <AvatarImage src={student?.photo ?? ''} alt={student.name} />
          <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
        </Avatar>

        <Button
          size="icon"
          onClick={() => setOpen(true)}
          className="absolute bottom-2 right-2 rounded-full shadow-md bg-accent"
        >
          <Pencil className="w-4 h-4" />
        </Button>
      </div>

      <h1 className="text-4xl">{student.name}</h1>

      <div className="flex flex-col gap-2">
        <p className="text-lg">Email: {student.email}</p>
      </div>

      <InfoUserModal open={open} close={() => setOpen(false)} student={student} />
    </div>
  );
}
