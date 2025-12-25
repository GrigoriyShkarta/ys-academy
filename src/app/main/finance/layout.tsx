import { ReactNode } from 'react';

export default function FinanceLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="relative w-full h-screen max-h-screen overflow-auto">{children}</div>;
}
