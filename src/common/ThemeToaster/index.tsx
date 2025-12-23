'use client';

import { Toaster } from 'sonner';
import { useTheme } from 'next-themes';

export function ThemedToaster() {
  const { theme } = useTheme(); // light / dark / system

  return <Toaster theme={theme === 'dark' ? 'dark' : 'light'} richColors closeButton />;
}
