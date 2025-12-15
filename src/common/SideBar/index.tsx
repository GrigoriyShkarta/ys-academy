'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/providers/UserContext';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  BookAudio,
  BookOpen,
  ChevronDown,
  ChevronUp,
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
import { YS_TOKEN } from '@/lib/consts';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openMaterials, setOpenMaterials] = useState(false);
  const { theme, setTheme } = useTheme();
  const t = useTranslations('SideBar');
  const pathname = usePathname() || '/';
  const { user } = useUser();

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const isInMaterials = pathname.startsWith('/main/materials');

  const studentItems = [
    {
      name: 'my_profile',
      icon: <User className="w-5 h-5" />,
      href: '/main/profile',
      submenu: false,
    },
  ];

  const menuItems = [
    { name: 'students_database', icon: <Users className="w-5 h-5" />, href: '/main/students' },
    // { name: 'my_courses', icon: <GraduationCap className="w-5 h-5" />, href: '/main/courses' },
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
        {
          name: 'courses',
          href: '/main/materials/courses',
          icon: <Layers className="w-4 h-4" />,
        },
      ],
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem(YS_TOKEN);
    window.location.href = '/';
  };

  const handleCollapse = () => {
    setCollapsed(prev => !prev);
    setOpenMaterials(false);
  };

  const handleMaterials = () => {
    setCollapsed(false);
    setOpenMaterials(prev => !prev);
  };

  const MenuContent = ({ isCollapsed = false }: { isCollapsed?: boolean }) => (
    <>
      {(user?.role === 'super_admin' ? menuItems : studentItems).map(item => {
        const hasSubmenu = !!item?.submenu;
        const isGroupActive = hasSubmenu && isInMaterials;
        const isItemActive = !hasSubmenu && item.href && isActive(item.href);

        if (!hasSubmenu) {
          return (
            <Link
              key={item.name}
              href={item.href!}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isItemActive ? 'bg-white/20 text-white' : 'hover:bg-white/10'
              } ${isCollapsed ? 'justify-center' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.icon}
              {!isCollapsed && <span>{t(item.name)}</span>}
            </Link>
          );
        }

        return (
          <div key={item.name}>
            <button
              onClick={handleMaterials}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isGroupActive ? 'bg-white/20 text-white' : 'hover:bg-white/10'
              } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                {!isCollapsed && <span>{t(item.name)}</span>}
              </div>
              {!isCollapsed &&
                (openMaterials ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                ))}
            </button>

            {!isCollapsed && (
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openMaterials ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="ml-10 mt-1 space-y-1 pb-2">
                  {Array.isArray(item.submenu) &&
                    item.submenu!.map(sub => {
                      const subActive = isActive(sub.href);
                      return (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors block ${
                            subActive ? 'bg-white/20 text-white' : 'hover:bg-white/10'
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
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

      <div className={`border-t border-white/10 pt-4 mt-6 space-y-2`}>
        <button
          onClick={toggleTheme}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-white/10 ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          {!isCollapsed && <span>{t('change_theme')}</span>}
        </button>

        <button
          onClick={handleLogout}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-900/20 ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span>{t('logout')}</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* ДЕСКТОПНАЯ САЙДБАР */}
      <aside
        className={`hidden md:flex h-screen flex-col border-r bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          {!collapsed && <span className="font-bold text-lg">YS Vocal Coach</span>}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCollapse}
            className={`text-white hover:bg-white/10 ${collapsed ? 'mx-auto' : ''}`}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Меню */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <MenuContent isCollapsed={collapsed} />
        </nav>
      </aside>

      {/* МОБИЛЬНЫЙ ХЕДЕР + МЕНЮ */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-lg">
        <div className="flex items-center justify-between p-4">
          <span className="font-bold text-lg">YS Vocal Coach</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(v => !v)}
            className="text-white"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out bg-gray-800/95 backdrop-blur border-t border-white/10 ${
            mobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <nav className="p-4 pb-6 space-y-3">
            <MenuContent /> {/* всегда раскрыто */}
          </nav>
        </div>
      </header>

      {/* Отступ под мобильный хедер */}
      <div className="md:hidden h-16" />
    </>
  );
}
