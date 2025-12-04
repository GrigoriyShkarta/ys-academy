import { Category } from '@/components/Materials/utils/interfaces';

export default function Chip({ category }: { category: Category }) {
  return (
    <div
      className="p-1 rounded-xl w-fit leading-3.5"
      style={{ backgroundColor: category?.color ?? '' }}
    >
      {category.title}
    </div>
  );
}
