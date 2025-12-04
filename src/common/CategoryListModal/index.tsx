import { Category } from '@/components/Materials/utils/interfaces';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import Chip from '@/common/Chip';

interface Props {
  list?: Category[];
  close: () => void;
}

export default function CategoryListModal({ list, close }: Props) {
  return (
    <Dialog open={list && list.length > 0} onOpenChange={close}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        <DialogTitle>
          <VisuallyHidden>Preview Content</VisuallyHidden>
        </DialogTitle>

        <div className="flex gap-2">
          {list && list?.map(lesson => <Chip key={lesson.id} category={lesson} />)}
        </div>
      </DialogContent>
    </Dialog>
  );
}
