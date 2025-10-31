import Sidebar from '@/common/SideBar';

export default function MainLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex">
      <Sidebar />

      {children}
    </div>
  );
}
