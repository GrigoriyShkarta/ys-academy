import TrackerLayout from "@/components/Tracker";

export default async function TrackerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TrackerLayout id={Number(id)} />;
}