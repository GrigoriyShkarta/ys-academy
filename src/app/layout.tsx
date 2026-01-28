import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { NextIntlClientProvider } from 'next-intl';
import ReactQueryProvider from '@/providers/ReactQueryProvider';
import { ThemeProvider } from '@/providers/ThemeProviders';
import { UserProvider } from '@/providers/UserContext';
import { ThemedToaster } from '@/common/ThemeToaster';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'YS Vocal Academy',
  description: 'Вокальна освіта, що виведе тебе на новий рівень',
  authors: [{ name: 'Яна Сабада' }],
  viewport: 'width=device-width, initial-scale=1',
  openGraph: {
    title: 'YS Vocal Academy',
    description: 'Вокальна освіта, що виведе тебе на новий рівень',
    type: 'website',
    url: 'https://ys-academy.vercel.app/main',
    images: [
      {
        url: 'https://ys-academy.vercel.app/assets/ys_ava.jpeg',
        width: 1200,
        height: 630,
        alt: 'Викладач вокалу Яна Сабада',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YS Vocal Academy',
    description: 'Вокальна освіта, що виведе тебе на новий рівень',
    images: ['https://ys-academy.vercel.app/assets/ys_ava.jpeg'],
  },
  metadataBase: new URL('https://ys-academy.vercel.app/main'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NextIntlClientProvider>
          <ReactQueryProvider>
            <ThemeProvider>
              <ThemedToaster />
              <UserProvider>{children}</UserProvider>
            </ThemeProvider>
          </ReactQueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
