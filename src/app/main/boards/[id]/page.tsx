import BoardLayout from "@/components/Boards";

export default async function StudentBoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BoardLayout boardId={id} />;
}