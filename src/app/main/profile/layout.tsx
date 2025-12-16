export default function ProfileLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="relative w-full h-screen max-h-screen overflow-auto">{children}</div>;
}
