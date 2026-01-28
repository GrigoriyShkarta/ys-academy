import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { StudentCourse, StudentLesson } from '@/components/Students/interface';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Loader2, UserLock, Folder, FolderOpen } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { assignLesson } from '@/components/Materials/Lesson/action';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Props {
  course?: StudentCourse;
  studentId: number;
  open: boolean;
  close: () => void;
}

export default function StudentCourseModal({
  course,
  open,
  close,
  studentId,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedModules, setExpandedModules] = useState<number[]>([]);
  const client = useQueryClient();

  const t = useTranslations('Common');

  console.log('course', course)

  // Collect all lessons from modules and orphan lessons
  const getAllLessons = useCallback(() => {
    if (!course) return [];
    const moduleLessons = course.modules?.flatMap(m => m.lessons) || [];
    const orphanLessons = course.lessons || [];
    return [...moduleLessons, ...orphanLessons];
  }, [course]);

  useEffect(() => {
    if (!open || !course) return;
    
    const allLessons = getAllLessons();
    const acceptedIds = allLessons.filter(l => l.access).map(l => l.id);

    setSelectedIds(acceptedIds);
    // Expand all modules by default or keep collapsed? usually collapsed is cleaner, but let's see. 
    // Requirement says "clicking expands", so initially collapsed is fine.
    setExpandedModules([]); 
  }, [course, open, getAllLessons]);

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  }, []);

  const toggleModuleExpand = (moduleId: number) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
    );
  };

  const handleAddAccess = async () => {
    if (!course) return;
    try {
      setLoading(true);

      const allLessons = getAllLessons();
      const allLessonIds = allLessons.map(l => l.id);
      
      const selected = selectedIds;

      // Add access
      const toAdd = selected.map(id => ({ id }));

      // Remove access
      const toRemove = allLessonIds
        .filter(id => !selected.includes(id))
        .map(id => ({ id, remove: true }));

      const payload = [...toAdd, ...toRemove];

      await assignLesson([+studentId], payload);

      await client.invalidateQueries({ queryKey: ['courses'] }); // Invalidate courses list? Or specific student course?
      // Since StudentCourses usually fetches student data which might include courses.
      // Ideally invalidate queries related to this student.
      await client.invalidateQueries({ queryKey: ['student', studentId] }); 
      
    } catch (error) {
      console.log('error: ', error);
    } finally {
      setLoading(false);
      close();
    }
  };

  const renderLessonRow = (lesson: StudentLesson, className?: string) => (
    <div key={lesson.id} className={cn("flex items-center gap-4 py-2 hover:bg-muted rounded px-2", className)}>
      <Checkbox
        checked={selectedIds.includes(lesson.id)}
        onCheckedChange={() => toggleSelect(lesson.id)}
      />
      <div className="flex-1 text-sm font-medium truncate" title={lesson.title}>
        {lesson.title}
      </div>
      <div className="text-xs text-muted-foreground w-12 text-center">
        {lesson.accessString || '0/0'}
      </div>
      <Link
        href={`/main/students/${studentId}/lesson-detail/${lesson.id}`}
        className="text-muted-foreground hover:text-primary transition-colors"
      >
        <UserLock className="w-4 h-4" />
      </Link>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto w-full">
        <DialogTitle>
          {course?.title ?? t('course_structure')}
          <VisuallyHidden>{t('course_structure')}</VisuallyHidden>
        </DialogTitle>

        <div className="flex flex-col gap-2 mt-4">
          {/* Modules */}
          {course?.modules?.map(module => {
            const isExpanded = expandedModules.includes(module.id);
            const hasLessons = module.lessons && module.lessons.length > 0;

            return (
              <div key={module.id} className="border rounded-md overflow-hidden">
                <div 
                  className={cn(
                    "flex items-center gap-2 p-3 cursor-pointer hover:bg-muted transition-colors",
                    !hasLessons && "cursor-default opacity-60"
                  )}
                  onClick={() => hasLessons && toggleModuleExpand(module.id)}
                >
                  {isExpanded ? (
                    <FolderOpen className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <Folder className="w-5 h-5 text-yellow-500" />
                  )}
                  <span className="font-medium text-sm">{module.title}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {module.lessons?.length || 0} {t('lessons').toLowerCase()}
                  </span>
                </div>
                
                {isExpanded && hasLessons && (
                  <div className="pl-4 pr-2 pb-2 pt-1 border-t flex flex-col gap-1">
                    {module.lessons.map(lesson => renderLessonRow(lesson, "ml-4"))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Orphan Lessons */}
          {course?.lessons && course.lessons.length > 0 && (
            <div className="border rounded-md p-2 mt-2">
              {course.lessons.map(lesson => renderLessonRow(lesson))}
            </div>
          )}
          
          {(!course?.modules?.length && !course?.lessons?.length) && (
            <div className="text-center text-muted-foreground py-8">
              {t('no_content')}
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
           <Button variant="outline" onClick={close}>
             {t('cancel')}
           </Button>
          <Button className="bg-accent" onClick={handleAddAccess} disabled={loading}>
            {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
            {t('add_access')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
