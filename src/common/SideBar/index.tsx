'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useUser } from '@/providers/UserContext';
import { YS_TOKEN } from '@/lib/consts';
import {
  Banknote,
  BookAudio,
  BookOpen,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Folder,
  Image,
  Layers,
  LogOut,
  Menu,
  Moon,
  Music,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  TagsIcon,
  User,
  Users,
  Video,
  X,
} from 'lucide-react';

/* ===================== TYPES ===================== */

type MenuItem = {
  name: string;
  href?: string;
  icon: ReactNode;
  submenu?: MenuItem[];
};

/* ===================== COMPONENT ===================== */

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  const pathname = usePathname() || '/';
  const { theme, setTheme } = useTheme();
  const { user } = useUser();
  const t = useTranslations('SideBar');

  /* ===================== HELPERS ===================== */

  const isActive = (href?: string) =>
    !!href && (pathname === href || pathname.startsWith(`${href}/`));

  const isGroupActive = (item: MenuItem) => item.submenu?.some(sub => isActive(sub.href));

  const toggleSubmenu = (key: string) => {
    setCollapsed(false);
    setOpenSubmenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCollapse = () => {
    setCollapsed(v => !v);
    setOpenSubmenus({});
  };

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const handleLogout = () => {
    localStorage.removeItem(YS_TOKEN);
    window.location.href = '/';
  };

  /* ===================== MENU CONFIG ===================== */

  const studentMenu: MenuItem[] = [
    {
      name: 'my_profile',
      icon: <User className="w-5 h-5" />,
      href: '/main/profile',
    },
  ];

  const adminMenu: MenuItem[] = [
    {
      name: 'students_database',
      icon: <Users className="w-5 h-5" />,
      href: '/main/students',
    },
    {
      name: 'my_finance',
      icon: <Banknote className="w-5 h-5" />,
      submenu: [
        {
          name: 'subscriptions',
          href: '/main/finance/subscriptions',
          icon: <CreditCard className="w-4 h-4" />,
        },
      ],
    },
    {
      name: 'my_materials',
      icon: <Folder className="w-5 h-5" />,
      submenu: [
        { name: 'audio_bank', href: '/main/materials/audio', icon: <Music className="w-4 h-4" /> },
        { name: 'photo_bank', href: '/main/materials/photo', icon: <Image className="w-4 h-4" /> },
        { name: 'video_bank', href: '/main/materials/video', icon: <Video className="w-4 h-4" /> },
        {
          name: 'categories',
          href: '/main/materials/categories',
          icon: <TagsIcon className="w-4 h-4" />,
        },
        {
          name: 'lessons',
          href: '/main/materials/lessons',
          icon: <BookOpen className="w-4 h-4" />,
        },
        {
          name: 'modules',
          href: '/main/materials/modules',
          icon: <BookAudio className="w-4 h-4" />,
        },
        { name: 'courses', href: '/main/materials/courses', icon: <Layers className="w-4 h-4" /> },
      ],
    },
  ];

  const menu = user?.role === 'super_admin' ? adminMenu : studentMenu;

  /* ===================== RENDER ===================== */

  const MenuContent = ({ isCollapsed = false }: { isCollapsed?: boolean }) => (
    <>
      {menu.map(item => {
        const hasSubmenu = !!item.submenu;
        const open = !!openSubmenus[item.name];
        const active = hasSubmenu ? isGroupActive(item) : isActive(item.href);

        if (!hasSubmenu) {
          return (
            <Link
              key={item.name}
              href={item.href!}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                ${active ? 'bg-white/20 text-white' : 'hover:bg-white/10'}
                ${isCollapsed ? 'justify-center' : ''}
              `}
            >
              {item.icon}
              {!isCollapsed && <span>{t(item.name)}</span>}
            </Link>
          );
        }

        return (
          <div key={item.name}>
            <button
              onClick={() => toggleSubmenu(item.name)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                ${active ? 'bg-white/20 text-white' : 'hover:bg-white/10'}
                ${isCollapsed ? 'justify-center' : 'justify-between'}
              `}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                {!isCollapsed && <span>{t(item.name)}</span>}
              </div>
              {!isCollapsed &&
                (open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
            </button>

            {!isCollapsed && (
              <div
                className={`overflow-hidden transition-all duration-300
                  ${open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
                `}
              >
                <div className="ml-10 mt-1 space-y-1 pb-2">
                  {item.submenu!.map(sub => {
                    const subActive = isActive(sub.href);
                    return (
                      <Link
                        key={sub.name}
                        href={sub.href!}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors
                          ${subActive ? 'bg-white/20 text-white' : 'hover:bg-white/10'}
                        `}
                      >
                        {sub.icon}
                        <span>{t(sub.name)}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div className="mt-6 space-y-2 border-t border-white/10 pt-4">
        <button
          onClick={toggleTheme}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-white/10
            ${isCollapsed ? 'justify-center' : ''}
          `}
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          {!isCollapsed && <span>{t('change_theme')}</span>}
        </button>

        <button
          onClick={handleLogout}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-400 hover:bg-red-900/20
            ${isCollapsed ? 'justify-center' : ''}
          `}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span>{t('logout')}</span>}
        </button>
      </div>
    </>
  );

  /* ===================== LAYOUT ===================== */

  return (
    <>
      {/* DESKTOP */}
      <aside
        className={`hidden md:flex h-screen flex-col border-r bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300
          ${collapsed ? 'w-20' : 'w-64'}
        `}
      >
        <div
          className={`flex items-center ${
            collapsed ? 'justify-center' : 'justify-between'
          } border-b border-white/10 p-4`}
        >
          {!collapsed && (
            <Link href="/main" className="text-lg font-bold">
              YS Vocal Coach
            </Link>
          )}
          <Button variant="ghost" size="icon" onClick={handleCollapse}>
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <MenuContent isCollapsed={collapsed} />
        </nav>
      </aside>

      {/* MOBILE */}
      <header className="fixed top-0 z-50 w-full bg-gradient-to-b from-gray-900 to-gray-800 text-white md:hidden">
        <div className="flex items-center justify-between p-4">
          <span className="text-lg font-bold">YS Vocal Coach</span>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(v => !v)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        <div
          className={`overflow-hidden transition-all duration-300
            ${mobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}
          `}
        >
          <nav className="space-y-3 p-4 pb-6">
            <MenuContent />
          </nav>
        </div>
      </header>

      <div className="h-16 md:hidden" />
    </>
  );
}
