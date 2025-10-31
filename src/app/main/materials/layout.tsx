export default function MaterialsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="p-8 w-full h-full max-h-screen overflow-auto">{children}</div>;
}
