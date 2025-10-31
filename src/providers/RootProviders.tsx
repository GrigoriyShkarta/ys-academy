'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from './ThemeProviders';
import ReactQueryProvider from './ReactQueryProvider';
import { NextIntlClientProvider } from 'next-intl';

interface RootProvidersProps {
  children: ReactNode;
}

export default function RootProviders({ children }: RootProvidersProps) {
  return (
    <NextIntlClientProvider>
      <ReactQueryProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </ReactQueryProvider>
    </NextIntlClientProvider>
  );
}
