import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit, MoreHorizontal, Trash2 } from 'lucide-react';

interface Props {
  handleEdit: () => void;
  handleDelete: () => void;
}

export default function TableActionMenu({ handleEdit, handleDelete }: Props) {
  const t = useTranslations('Common');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        <DropdownMenuItem onClick={handleEdit}>
          <Edit /> {t('edit')}
        </DropdownMenuItem>
        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={handleDelete}>
          <Trash2 /> {t('delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
