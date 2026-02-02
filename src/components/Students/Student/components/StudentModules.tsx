import { StudentModule } from '@/components/Students/interface';
import { useState } from 'react';
import StudentModuleModal from '@/components/Students/Student/components/StudentModuleModal';
import Chip from '@/common/Chip';
import { ChevronDown, Lock, PlayCircle, Settings2 } from 'lucide-react';
import { Category } from '@/components/Materials/utils/interfaces';
import CategoryListModal from '@/common/CategoryListModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function StudentModules({
  modules,
  studentId,
  courseId,
}: {
  modules?: StudentModule[];
  studentId: number;
  courseId: number;
}) {
  const [selectedModule, setSelectedModule] = useState<StudentModule | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [categoryList, seCategoryList] = useState<Category[] | undefined>([]);
  const [expandedModules, setExpandedModules] = useState<number[]>([]);
  const t = useTranslations('Common');

  const openManagementModal = (e: React.MouseEvent, module: StudentModule) => {
    e.stopPropagation();
    setSelectedModule(module);
    setOpenModal(true);
  };

  const toggleModule = (moduleId: number) => {
    setExpandedModules(prev =>
      prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
    );
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {modules &&
        modules.map((module, index) => {
          const total = module.lessons?.length ?? 0;
          const completed = module.lessons ? module.lessons.filter(l => l.access).length : 0;
          const isExpanded = expandedModules.includes(module.id);

          return (
            <div
              key={module.id}
              className="border rounded-xl bg-card overflow-hidden transition-all hover:shadow-md"
            >
              <div
                onClick={() => toggleModule(module.id)}
                className="p-5 flex items-center justify-between cursor-pointer select-none hover:bg-accent/5"
              >
                <div className="flex items-center gap-6">
                  <div className="hidden sm:flex text-3xl font-black text-muted-foreground/10 tabular-nums">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-semibold tracking-tight">
                        {module.title}
                      </h3>
                      {!module.access && <Lock className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      <span>{total} {t('lessons')}</span>
                      <span className="flex items-center gap-1.5 px-2 py-0.5 bg-accent/10 text-accent rounded-full font-bold">
                        {completed}/{total}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={(e) => openManagementModal(e, module)}
                    className="p-2 hover:bg-accent/10 rounded-full transition-colors text-muted-foreground hover:text-accent"
                    title={t('edit')}
                  >
                    <Settings2 className="w-5 h-5" />
                  </button>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  >
                    <ChevronDown className="w-6 h-6 text-muted-foreground" />
                  </motion.div>
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="border-t bg-muted/5"
                  >
                    <div className="p-2 sm:p-4 grid grid-cols-1 gap-2">
                      {module.lessons && module.lessons.length > 0 ? (
                        module.lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className={`group flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-accent/20 hover:bg-accent/10 transition-all ${
                              !lesson.access ? 'opacity-60' : ''
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center border group-hover:bg-accent group-hover:text-white transition-colors">
                                <PlayCircle className="w-4 h-4" />
                              </div>
                              <span className="font-medium text-sm group-hover:text-accent transition-colors">
                                {lesson.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-semibold">
                              {lesson.access ? (
                                <span className="text-green-500">{t('let_access')}</span>
                              ) : (
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <Lock className="w-3.5 h-3.5" />
                                  {t('close')}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-muted-foreground text-sm italic">
                          {t('no_lessons_find')}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

      <StudentModuleModal
        studentId={studentId}
        courseId={courseId}
        moduleId={selectedModule?.id as number}
        open={openModal}
        close={() => setOpenModal(false)}
        lessons={selectedModule?.lessons}
      />
      <CategoryListModal list={categoryList} close={() => seCategoryList(undefined)} />
    </div>
  );
}
