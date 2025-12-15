'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from './ThemeProviders';
import ReactQueryProvider from './ReactQueryProvider';
import { NextIntlClientProvider } from 'next-intl';
import { UserProvider } from '@/providers/UserContext';

interface RootProvidersProps {
  children: ReactNode;
}

export default function RootProviders({ children }: RootProvidersProps) {
  return (
    <NextIntlClientProvider>
      <ReactQueryProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <UserProvider>{children}</UserProvider>
        </ThemeProvider>
      </ReactQueryProvider>
    </NextIntlClientProvider>
  );
}
