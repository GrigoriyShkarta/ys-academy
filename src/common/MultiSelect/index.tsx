// typescript
// src/common/MultiSelect/index.tsx

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  selected?: string[];
  onChange?: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
}

export default function MultiSelect({
  options,
  selected = [],
  onChange,
  placeholder,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [localSelected, setLocalSelected] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement | null>(null);
  const t = useTranslations('Common');

  // Реф для отложенного вызова onChange — хранит следующий массив, когда он инициирован пользователем
  const pendingOnChange = useRef<string[] | null>(null);

  useEffect(() => {
    const incoming = selected ?? [];
    setLocalSelected(prev => {
      if (prev.length === incoming.length && prev.every((v, i) => v === incoming[i])) {
        return prev;
      }
      return incoming;
    });
  }, [selected]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // После изменения localSelected вызываем onChange если есть отложенное значение (инициировано пользователем)
  useEffect(() => {
    if (!pendingOnChange.current) return;
    const pending = pendingOnChange.current;
    // убедиться, что localSelected действительно соответствует ожидаемому значению
    if (
      pending.length === localSelected.length &&
      pending.every((v, i) => v === localSelected[i])
    ) {
      onChange?.(localSelected);
    }
    pendingOnChange.current = null;
  }, [localSelected, onChange]);

  const toggleOption = (value: string) => {
    setLocalSelected(prev => {
      const exists = prev.includes(value);
      const next = exists ? prev.filter(v => v !== value) : [...prev, value];
      // пометить, что изменение пришло от пользователя и нужно уведомить родителя после рендера
      pendingOnChange.current = next;
      return next;
    });
  };

  const displayText = (() => {
    if (!localSelected || localSelected.length === 0) return placeholder ?? t('select');
    const labels = options
      .filter(o => localSelected.includes(o.value))
      .map(o => o.label)
      .filter(Boolean);
    return labels.length > 0 ? labels.join(', ') : `${localSelected.length} выбран(о)`;
  })();

  return (
    <div className={cn('relative', className)} ref={ref}>
      <Input
        readOnly
        value={displayText}
        onClick={() => setOpen(v => !v)}
        className="pr-8 cursor-pointer"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      {open && (
        <div className="absolute z-50 mt-2 w-52 max-h-64 overflow-auto rounded border bg-background p-2 shadow">
          {options.map(opt => (
            <label
              key={opt.value}
              className="flex items-center gap-2 px-2 py-1 hover:bg-muted rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={localSelected.includes(opt.value)}
                onChange={() => toggleOption(opt.value)}
                className="h-4 w-4"
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
