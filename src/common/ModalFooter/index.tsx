'use client';

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface FormFooterProps {
  isLoading?: boolean;
  isValid?: boolean;
  onCancel?: () => void;
  onSubmitText?: string;
  onCancelText?: string;
  loadingText?: string;
  disabled?: boolean;
  onSave?: () => void;
  children?: ReactNode; // на случай, если ты хочешь добавить кастомный контент
}

export const FormFooter = ({
  isLoading = false,
  isValid = true,
  onCancel,
  onSubmitText,
  onCancelText,
  loadingText,
  disabled = false,
  onSave,
  children,
}: FormFooterProps) => {
  return (
    <DialogFooter className="flex justify-end space-x-2">
      {children}
      <Button variant="ghost" type="button" onClick={onCancel}>
        {onCancelText}
      </Button>

      <Button
        type={onSave ? 'button' : 'submit'}
        onClick={onSave && onSave}
        disabled={isLoading || !isValid || disabled}
        className="bg-accent flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin h-4 w-4" />
            {loadingText}
          </>
        ) : (
          onSubmitText
        )}
      </Button>
    </DialogFooter>
  );
};
