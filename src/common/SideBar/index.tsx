'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { AnimatePresence, motion } from 'framer-motion';
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
  Moon,
  Music,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Users,
  Video,
} from 'lucide-react';
import { YS_TOKEN } from '@/lib/consts';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [openMaterials, setOpenMaterials] = useState(false);
  const { theme, setTheme } = useTheme();
  const t = useTranslations('SideBar');

  useEffect(() => {
    const token = localStorage.getItem(YS_TOKEN);
    if (!token) {
      window.location.href = '/';
    }
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

  const handleClickLogout = () => {
    localStorage.removeItem(YS_TOKEN);
    window.location.href = '/';
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 240 }}
      transition={{ duration: 0.25 }}
      className="h-screen border-r bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col justify-between shadow-sm"
    >
      {/* Header */}
      <div>
        <div
          className={`flex items-center ${
            collapsed ? 'justify-center' : 'justify-between'
          } p-4 border-b`}
        >
          {!collapsed && (
            <span className="font-bold text-lg whitespace-nowrap transition-opacity">Панель</span>
          )}
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Навигация */}
        <nav className="p-2 space-y-1">
          {menuItems.map(item => (
            <div key={item.name}>
              {/* Если нет подменю — ссылка */}
              {!item.submenu ? (
                <Link
                  href={item.href!}
                  className={`inline-flex items-center w-full gap-3 rounded-md text-sm font-medium
      ${collapsed ? 'justify-center' : 'justify-start'} hover:bg-muted transition`}
                >
                  <Button
                    variant="ghost"
                    className={`w-full gap-3 ${collapsed ? 'justify-center' : 'justify-start'}`}
                  >
                    {item.icon}
                    {!collapsed && <span>{t(item.name)}</span>}
                  </Button>
                </Link>
              ) : (
                // Если есть подменю — кнопка без ссылки
                <Button
                  variant="ghost"
                  className={`w-full ${collapsed ? 'justify-center' : 'justify-start'} gap-3`}
                  onClick={() => setOpenMaterials(!openMaterials)}
                >
                  {item.icon}
                  {!collapsed && <span>{t(item.name)}</span>}
                  {!collapsed &&
                    (openMaterials ? (
                      <ChevronUp className="w-4 h-4 ml-auto" />
                    ) : (
                      <ChevronDown className="w-4 h-4 ml-auto" />
                    ))}
                </Button>
              )}

              {/* Подменю */}
              {item.submenu && (
                <AnimatePresence>
                  {openMaterials && !collapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="flex flex-col ml-6 overflow-hidden"
                    >
                      {item.submenu.map(sub => (
                        <Link key={sub.name} href={sub.href}>
                          <Button variant="ghost" className="justify-start gap-2 w-full text-sm">
                            {sub.icon}
                            {t(sub.name)}
                          </Button>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Нижние кнопки */}
      <div className="p-2 border-t space-y-2">
        <Button variant="ghost" className="w-full justify-start gap-3" onClick={toggleTheme}>
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          {!collapsed && <span>{t('change_theme')}</span>}
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-red-600 hover:text-red-700"
          onClick={handleClickLogout}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>{t('logout')}</span>}
        </Button>
      </div>
    </motion.aside>
  );
}
