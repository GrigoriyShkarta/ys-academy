'use client';

import { Dispatch, SetStateAction } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import 'react-quill-new/dist/quill.snow.css';

interface Props {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  content: string;
}

export default function PreviewModal({ open, setOpen, content }: Props) {
  const isHtmlContent = () => {
    const trimmed = content.trim();
    return trimmed.startsWith('<') && trimmed.endsWith('>');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[750px] w-fit bg-transparent border-none shadow-none p-0 flex items-center justify-center"
      >
        <DialogTitle>
          <VisuallyHidden>Preview Content</VisuallyHidden>
        </DialogTitle>

        <div
          className={`relative w-fit max-w-3xl max-h-[80vh] h-full flex items-center justify-center overflow-auto rounded-2xl p-4 ${
            isHtmlContent() ? 'bg-white' : 'bg-transparent'
          }`}
        >
          {isHtmlContent() ? (
            <div
              className="ql-editor prose prose-sm max-w-none w-full text-black"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <img src={content} alt="Full preview" className="object-contain max-h-[75vh] w-auto" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
