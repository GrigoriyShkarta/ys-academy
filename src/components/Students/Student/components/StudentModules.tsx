import { StudentModule } from '@/components/Students/interface';
import logo from '../../../../../public/assets/logo.png';
import { useState } from 'react';
import StudentModuleModal from '@/components/Students/Student/components/StudentModuleModal';

export default function StudentModules({
  modules,
  studentId,
}: {
  modules?: StudentModule[];
  studentId: number;
}) {
  const [selectedModule, setSelectedModule] = useState<StudentModule | null>(null);
  const [openModal, setOpenModal] = useState(false);

  const selectModule = (module: StudentModule) => {
    setSelectedModule(module);
    setOpenModal(true);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-2 xl:grid-cols-5 gap-4 w-full box-border">
      {modules &&
        modules.map(module => {
          const total = module.lessons?.length ?? 0;
          const completed = module.lessons ? module.lessons.filter(l => l.access).length : 0;

          return (
            <div
              key={module.id}
              className={`relative group rounded-lg overflow-hidden border hover:shadow-md transition`}
              onClick={() => selectModule(module)}
            >
              <img
                src={module?.url ? module.url : logo.src}
                alt={module.title}
                className="w-full h-48 object-cover cursor-pointer"
              />

              <div
                className="p-2 text-center text-sm font-medium text-muted-foreground truncate"
                title={module.title}
              >
                {module.title}
              </div>

              <div className="absolute top-2 left-2 bg-white/90 text-xs font-medium px-2 py-1 rounded shadow text-secondary">
                {completed}/{total}
              </div>
            </div>
          );
        })}

      <StudentModuleModal
        studentId={studentId}
        moduleId={selectedModule?.id as number}
        open={openModal}
        close={() => setOpenModal(false)}
        lessons={selectedModule?.lessons}
      />
    </div>
  );
}
