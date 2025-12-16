import ModuleLayout from '@/components/Materials/Modules/Module';

export default async function ModulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const moduleId = Number(id);
  return <ModuleLayout moduleId={moduleId} />;
}
