export default function MaterialsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative p-2 md:p-8 w-full h-screen max-h-screen overflow-auto">{children}</div>
  );
}
