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
import { useRouter } from 'next/navigation';
import ConfirmModal from '@/common/ConfirmModal';

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
  const [newSelectedIds, setNewSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [lessonId, setLessonId] = useState<number>();
  const [expandedModules, setExpandedModules] = useState<number[]>([]);
  const client = useQueryClient();
  const router = useRouter();
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
    setNewSelectedIds([]);
    setExpandedModules([]); 
  }, [course, open, getAllLessons]);

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds(prev => {
      const isSelected = prev.includes(id);
      const newSelected = isSelected ? prev.filter(i => i !== id) : [...prev, id];
      
      // Update newSelectedIds based on differences with initial state
      const allLessons = getAllLessons();
      const initialAcceptedIds = allLessons.filter(l => l.access).map(l => l.id);
      
      if (initialAcceptedIds.includes(id) !== newSelected.includes(id)) {
        setNewSelectedIds(nPrev => (nPrev.includes(id) ? nPrev : [...nPrev, id]));
      } else {
        setNewSelectedIds(nPrev => nPrev.filter(i => i !== id));
      }
      
      return newSelected;
    });
  }, [getAllLessons]);

  const toggleAllLessons = useCallback(() => {
    const allLessons = getAllLessons();
    const allIds = allLessons.map(l => l.id);
    const initialAcceptedIds = allLessons.filter(l => l.access).map(l => l.id);
    
    const areAllSelected = allIds.every(id => selectedIds.includes(id));
    const newSelected = areAllSelected ? [] : allIds;
    
    setSelectedIds(newSelected);
    
    // Find everything that differs from initial state
    const changedIds = allIds.filter(id => 
      newSelected.includes(id) !== initialAcceptedIds.includes(id)
    );
    setNewSelectedIds(changedIds);
  }, [getAllLessons, selectedIds]);

  const toggleModuleLessons = useCallback((moduleId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!course) return;
    
    const module = course.modules?.find(m => m.id === moduleId);
    if (!module || !module.lessons) return;
    
    const moduleLessonIds = module.lessons.map(l => l.id);
    const areAllModuleSelected = moduleLessonIds.every(id => selectedIds.includes(id));
    
    const newSelected = areAllModuleSelected 
      ? selectedIds.filter(id => !moduleLessonIds.includes(id))
      : Array.from(new Set([...selectedIds, ...moduleLessonIds]));
      
    setSelectedIds(newSelected);

    // Update newSelectedIds correctly
    const allLessons = getAllLessons();
    const initialAcceptedIds = allLessons.filter(l => l.access).map(l => l.id);
    
    const currentChanges = [...newSelectedIds];
    moduleLessonIds.forEach(id => {
      const isChanged = newSelected.includes(id) !== initialAcceptedIds.includes(id);
      const isAlreadyInNew = currentChanges.includes(id);
      
      if (isChanged && !isAlreadyInNew) {
        currentChanges.push(id);
      } else if (!isChanged && isAlreadyInNew) {
        const index = currentChanges.indexOf(id);
        currentChanges.splice(index, 1);
      }
    });
    setNewSelectedIds(currentChanges);
  }, [course, getAllLessons, newSelectedIds, selectedIds]);

  const toggleModuleExpand = (moduleId: number) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
    );
  };

  const handleAddAccess = async () => {
    if (!course) return;
    try {
      setLoading(true);

      
      const payload = newSelectedIds.map(id => {
        const isChecked = selectedIds.includes(id);

        if (isChecked) {
          return { id };
        } else {
          return {
            id,
            remove: true
          };
        }
      });

      if (payload.length > 0) {
        await assignLesson([+studentId], payload);
      }

      await client.invalidateQueries({ queryKey: ['courses'] });
      await client.invalidateQueries({ queryKey: ['student', studentId] });

      if (openConfirm) {
        router.push(`/main/students/${studentId}/lesson-detail/${lessonId}`);
      }
      
    } catch (error) {
      console.log('error: ', error);
    } finally {
      setLoading(false);
      close();
    }
  };

  const handleClickAccessIcon = (id: number) => {
    if (newSelectedIds.length > 0) {
      setOpenConfirm(true);
      setLessonId(id);
    } else {
      router.push(`/main/students/${studentId}/lesson-detail/${id}`);
    }
  }

  const renderLessonRow = (lesson: StudentLesson, className?: string) => (
    <div key={lesson.id} className={cn("flex items-center gap-4 py-2 hover:bg-muted rounded px-2", className)}>
      <Checkbox
        checked={selectedIds.includes(lesson.id)}
        onCheckedChange={() => toggleSelect(lesson.id)}
      />
      <div className="flex-1 text-sm font-medium truncate" title={lesson.title}>
        <Link href={`/main/materials/lessons/${lesson.id}`} className='hover:underline'>
          {lesson.title}
        </Link>
      </div>
      <div className="text-xs text-muted-foreground w-12 text-center">
        {lesson.accessString || '0/0'}
      </div>

      <UserLock className="w-4 h-4 cursor-pointer" onClick={() => handleClickAccessIcon(lesson.id)} />
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
          <div className="flex items-center gap-2 p-2 px-3 border rounded-md bg-muted/30">
            <Checkbox 
              checked={getAllLessons().length > 0 && getAllLessons().every(l => selectedIds.includes(l.id))}
              onCheckedChange={toggleAllLessons}
            />
            <span className="text-sm font-semibold">{t('select_all')}</span>
          </div>

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
                  <Checkbox 
                    className="ml-2"
                    checked={module.lessons?.length > 0 && module.lessons.every(l => selectedIds.includes(l.id))}
                    onCheckedChange={(checked) => toggleModuleLessons(module.id, { stopPropagation: () => {} } as any)}
                    onClick={(e) => e.stopPropagation()}
                  />
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
          <Button 
            className="bg-accent" 
            onClick={handleAddAccess} 
            disabled={loading || newSelectedIds.length === 0}
          >
            {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>

      <ConfirmModal
        open={openConfirm}
        confirmAction={handleAddAccess}
        textContent='Зберегти зміни перед тим як перейти на сторінку уроку?'
        setOnClose={() => setOpenConfirm(false)}
        isLoading={loading}
      />
    </Dialog>
  );
}
