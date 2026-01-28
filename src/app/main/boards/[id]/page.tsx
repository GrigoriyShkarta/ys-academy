import BoardLayout from "@/components/Boards";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function StudentBoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BoardLayout />;
}