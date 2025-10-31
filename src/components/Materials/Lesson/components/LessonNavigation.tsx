import { LessonBlockType } from '@/components/Materials/utils/interfaces';

interface Props {
  blocks: LessonBlockType[];
}

export default function LessonNavigation({ blocks }: Props) {
  return (
    <ul className="fixed top-25 right-5 z-100 rounded-xl p-2 bg-accent/20">
      hi
      {blocks.map(block => (
        <li key={block.id}>{block.title}</li>
      ))}
    </ul>
  );
}
