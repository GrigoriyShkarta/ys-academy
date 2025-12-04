import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import Link from 'next/link';
import { Lesson } from '@/components/Materials/utils/interfaces';

interface Props {
  list?: Lesson[];
  close: () => void;
}

export default function LessonsListModal({ list, close }: Props) {
  return (
    <Dialog open={list && list.length > 0} onOpenChange={close}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        <DialogTitle>
          <VisuallyHidden>Preview Content</VisuallyHidden>
        </DialogTitle>

        <ul className="">
          {list &&
            list?.map(lesson => (
              <Link
                key={lesson.id}
                href={`/lessons/${lesson.id}`}
                className="text-underline cursor-pointer"
              >
                <li>
                  <span className="text-sm">{lesson.title}</span>
                </li>
              </Link>
            ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
