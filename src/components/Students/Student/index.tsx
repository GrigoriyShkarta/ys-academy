'use client';

import { useQuery } from '@tanstack/react-query';
import { getStudent } from '@/components/Students/Student/actions';
import Info from '@/components/Students/Student/components/Info';
import StudentCourses from '@/components/Students/Student/components/StudentCourses';
import { Pencil } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import InfoUserModal from '@/components/Students/Student/components/InfoUserModal';
import { useTranslations } from 'next-intl';
import Loader from '@/common/Loader';
import Subscriptions from '@/components/Students/Student/components/Subscriptions/Subscriptions';
import { useUser } from '@/providers/UserContext';

export default function Student({ id }: { id: number }) {
  const [open, setOpen] = useState(false);
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'profile' | 'courses' | 'subscriptions'>('profile');
  const t = useTranslations('Students');

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: () => getStudent(id),
    enabled: !!id,
  });

  if (isLoading) return <Loader />;

  if (!student) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 w-full space-y-8 mt-18 sm:mt-0">
      {/* Header: Avatar + Name + Contacts */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Avatar className="w-48 h-48">
            <AvatarImage src={student.photo ?? ''} alt={student.name} />
            <AvatarFallback className="text-5xl">{student.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <Button
            size="icon"
            variant="secondary"
            onClick={() => setOpen(true)}
            className="absolute bottom-2 right-2 rounded-full shadow-md bg-accent text-white"
          >
            <Pencil className="w-5 h-5" />
          </Button>
        </div>
        <h1 className="text-4xl font-semibold text-center">{student.name}</h1>
        {user?.role === 'super_admin' && (
          <span
            className={`px-2 py-1 rounded-full ${student.isActive ? 'bg-green-500' : 'bg-red-500'}`}
          >
            {student.isActive ? t('active') : t('inactive')}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="w-full">
        <Tabs value={activeTab} onValueChange={val => setActiveTab(val as any)}>
          <TabsList className="flex gap-2 mb-4 justify-center">
            <TabsTrigger value="profile" className="px-4 py-2 rounded-t-lg shadow-sm">
              {t('profile')}
            </TabsTrigger>
            {user?.role === 'super_admin' && (
              <TabsTrigger value="courses" className="px-4 py-2 rounded-t-lg shadow-sm">
                {t('courses')}
              </TabsTrigger>
            )}
            <TabsTrigger value="subscriptions" className="px-4 py-2 rounded-t-lg shadow-sm">
              {t('subscriptions')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Info student={student} />
          </TabsContent>

          <TabsContent value="courses">
            <StudentCourses courses={student.courses} userId={id} />
          </TabsContent>

          <TabsContent value="subscriptions">
            <Subscriptions student={student} />
          </TabsContent>
        </Tabs>
      </div>

      <InfoUserModal open={open} close={() => setOpen(false)} student={student} />
    </div>
  );
}
