import ModuleLayout from '@/components/Materials/Modules/Module';

export default function ModulePage({ params }: { params: { id: number } }) {
  return <ModuleLayout id={params.id} />;
}
