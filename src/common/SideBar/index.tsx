'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  BookAudio,
  BookOpen,
  ChevronDown,
  ChevronUp,
  FileText,
  Folder,
  GraduationCap,
  Image,
  LogOut,
  Menu,
  Moon,
  Music,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Users,
  Video,
  X,
} from 'lucide-react';
import { YS_TOKEN } from '@/lib/consts';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false); // десктоп: свернуть/развернуть
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // мобильное меню
  const [openMaterials, setOpenMaterials] = useState(false);
  const { theme, setTheme } = useTheme();
  const t = useTranslations('SideBar');

  useEffect(() => {
    const token = localStorage.getItem(YS_TOKEN);
    if (!token) window.location.href = '/';
  }, []);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const menuItems = [
    { name: 'students_database', icon: <Users className="w-5 h-5" />, href: '/main/students' },
    { name: 'my_courses', icon: <GraduationCap className="w-5 h-5" />, href: '/main/courses' },
    {
      name: 'my_materials',
      icon: <Folder className="w-5 h-5" />,
      submenu: [
        { name: 'audio_bank', href: '/main/materials/audio', icon: <Music className="w-4 h-4" /> },
        { name: 'photo_bank', href: '/main/materials/photo', icon: <Image className="w-4 h-4" /> },
        { name: 'video_bank', href: '/main/materials/video', icon: <Video className="w-4 h-4" /> },
        { name: 'text_bank', href: '/main/materials/text', icon: <FileText className="w-4 h-4" /> },
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
      ],
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem(YS_TOKEN);
    window.location.href = '/';
  };

  // Общий контент меню — используем и в сайдбаре, и в мобильном меню
  const MenuContent = () => (
    <>
      {menuItems.map(item => (
        <div key={item.name}>
          {!item.submenu ? (
            <Link
              href={item.href!}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.icon}
              <span>{t(item.name)}</span>
            </Link>
          ) : (
            <>
              <button
                onClick={() => setOpenMaterials(v => !v)}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{t(item.name)}</span>
                </div>
                {openMaterials ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {/* Подменю с плавным раскрытием через max-h + transition */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openMaterials ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="ml-10 mt-1 space-y-1 pb-2">
                  {item.submenu.map(sub => (
                    <Link
                      key={sub.name}
                      href={sub.href}
                      className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-white/10 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {sub.icon}
                      <span>{t(sub.name)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      ))}

      <div className="border-t border-white/10 pt-4 mt-4 space-y-2">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-white/10 transition-colors"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          <span>{t('change_theme')}</span>
        </button>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-400 hover:bg-red-900/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>{t('logout')}</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* ДЕСКТОПНАЯ САЙДБАР */}
      <aside
        className={`hidden md:flex h-screen flex-col justify-between border-r bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Заголовок */}
        <div>
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            {!collapsed && <span className="font-bold text-lg">Панель</span>}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="text-white hover:bg-white/10"
            >
              {collapsed ? (
                <PanelLeftOpen className="h-5 w-5" />
              ) : (
                <PanelLeftClose className="h-5 w-5" />
              )}
            </Button>
          </div>

          <nav className="p-3 space-y-1">
            {menuItems.map(item => (
              <div key={item.name}>
                {!item.submenu ? (
                  <Link
                    href={item.href!}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors ${
                      collapsed ? 'justify-center' : ''
                    }`}
                  >
                    {item.icon}
                    {!collapsed && <span>{t(item.name)}</span>}
                  </Link>
                ) : (
                  <button
                    onClick={() => !collapsed && setOpenMaterials(v => !v)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors ${
                      collapsed ? 'justify-center' : 'justify-between'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      {!collapsed && <span>{t(item.name)}</span>}
                    </div>
                    {!collapsed &&
                      (openMaterials ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      ))}
                  </button>
                )}

                {/* Подменю для десктопа */}
                {item.submenu && !collapsed && (
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      openMaterials ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="ml-10 mt-1 space-y-1 pb-2">
                      {item.submenu.map(sub => (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-white/10 transition-colors block"
                        >
                          {sub.icon}
                          <span>{t(sub.name)}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Нижние кнопки (только если не свернуто) */}
        {!collapsed && (
          <div className="p-4 border-t border-white/10 space-y-2">
            <Button variant="ghost" className="w-full justify-start gap-3" onClick={toggleTheme}>
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              <span>{t('change_theme')}</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-red-400"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
              <span>{t('logout')}</span>
            </Button>
          </div>
        )}
      </aside>

      {/* МОБИЛЬНЫЙ ХЕДЕР + ВЫПАДАЮЩЕЕ МЕНЮ */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-lg">
        <div className="flex items-center justify-between p-4">
          <span className="font-bold text-lg">Панель</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(v => !v)}
            className="text-white"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Выпадающее меню */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out bg-gray-800/95 backdrop-blur border-t border-white/10 ${
            mobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <nav className="p-4 pb-6 space-y-3">
            <MenuContent />
          </nav>
        </div>
      </header>

      {/* Отступ под фиксированный мобильный хедер */}
      <div className="md:hidden h-16" />
    </>
  );
}
