import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface Props {
  label: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Field({ label, error, required, children, className }: Props) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label className="flex items-center gap-1">
        {label}
        {required && <span className="text-destructive text-sm leading-[14px]">*</span>}
      </Label>

      {children}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
