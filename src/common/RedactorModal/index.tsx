import { useState } from 'react';
import ReactQuill from 'react-quill-new';
import { Button } from '@/components/ui/button';
import { quillFormats, quillModules } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface Props {
  open: boolean;
  close: () => void;
  confirm: (content: string) => void;
  content?: string;
}

export default function RedactorModal({ open, close, confirm, content }: Props) {
  const [value, setValue] = useState<string>(content ?? '');
  const t = useTranslations('Materials');

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        close();
        setValue('');
      }}
    >
      <DialogContent className="sm:max-w-[1024px] max-h-[90vh] overflow-y-auto overflow-visible [scrollbar-gutter:stable]">
        <DialogTitle>
          <VisuallyHidden />
        </DialogTitle>
        <div className="w-full space-y-4">
          <ReactQuill
            theme="snow"
            value={value}
            onChange={setValue}
            modules={quillModules}
            formats={quillFormats}
          />
          <div className="w-full flex justify-end space-x-2">
            <Button
              variant="ghost"
              onClick={() => {
                close();
                setValue('');
              }}
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={() => {
                confirm(value);
                close();
              }}
              className="bg-accent"
            >
              {t(content ? 'edit' : 'add')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
