import * as React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.ComponentProps<'input'> {
  // Если хочешь явно указать, что это числовой инпут
  type?: 'text' | 'number' | 'email' | 'password' | 'time' | 'date';
}

function Input({ className, type, ...props }: InputProps) {
  const isNumberInput = type === 'number';

  // Обработчик ввода — блокируем всё, кроме цифр
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Разрешаем: Backspace, Delete, Tab, Escape, Enter
    if ([8, 9, 27, 13, 46].includes(e.keyCode)) {
      return;
    }

    // Разрешаем Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if (e.ctrlKey || e.metaKey) {
      if (['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
        return;
      }
    }

    // Блокируем всё, что не цифра
    if (!/[0-9]/.test(e.key)) {
      e.preventDefault();
    }

    // Вызываем оригинальный onKeyDown, если есть
    props.onKeyDown?.(e);
  };

  // Обработчик изменения — дополнительная чистка на случай вставки
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isNumberInput) {
      let value = e.target.value;

      // Удаляем всё, кроме цифр
      value = value.replace(/[^0-9]/g, '');

      // Убираем ведущие нули
      if (value.length > 1) {
        value = value.replace(/^0+/, '');
      }

      // Если остались только нули — оставляем один
      if (value === '') {
        e.target.value = '';
      } else if (value === '0' || value === '') {
        e.target.value = value;
      } else {
        e.target.value = value || '';
      }
    }

    props.onChange?.(e);
  };

  // При потере фокуса — финальная нормализация (например, '000' → '0')
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (isNumberInput) {
      const value = e.target.value.replace(/[^0-9]/g, '');
      if (value === '') {
        e.target.value = '';
      } else {
        e.target.value = parseInt(value, 10).toString();
      }
    }
    props.onBlur?.(e);
  };

  return (
    <input
      type={!type ? 'text' : type === 'number' ? 'text' : type}
      inputMode={isNumberInput ? 'numeric' : undefined}
      pattern={isNumberInput ? '[0-9]*' : undefined}
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className
      )}
      onKeyDown={isNumberInput ? handleKeyDown : props.onKeyDown}
      onChange={isNumberInput ? handleChange : props.onChange}
      onBlur={isNumberInput ? handleBlur : props.onBlur}
      {...props}
    />
  );
}

export { Input };
