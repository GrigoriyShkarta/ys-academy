// src/providers/ThemeProviders.tsx
'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const [mounted, setMounted] = React.useState(false);

  // Set mounted flag after initial client-side render
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Return null or a fallback UI until mounted to avoid hydration mismatch
  if (!mounted) {
    return <>{children}</>; // Render children without theme wrapper
  }

  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem {...props}>
      {children}
    </NextThemesProvider>
  );
}
