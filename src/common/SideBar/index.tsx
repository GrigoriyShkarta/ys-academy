'use client';

import { ReactNode, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useUser } from '@/providers/UserContext';
import { YS_TOKEN } from '@/lib/consts';
import {
  Timer, Music, LayoutGrid, Piano, MessageCircle,
  Banknote, BookAudio, BookOpen, Component, ChevronDown, ChevronUp,
  CreditCard, Folder, Image, Layers, LogOut, LayoutList, Menu, MonitorPlay,
  Moon, PanelLeftClose, PanelLeftOpen, SquareKanban, Sun, TagsIcon, User, Users, Video, X
} from 'lucide-react';
import { useMetronome } from '@/providers/MetronomeContext';
import { useTuner } from '@/providers/TunerContext';
import { usePiano } from '@/providers/PianoContext';
import { cn } from '@/lib/utils';
import NotificationBell from '@/components/Students/NotificationBell';
import { getMe } from '@/services/profile';
import { getStudent } from '@/components/Students/Student/actions';
import { useQuery } from '@tanstack/react-query';

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
  const [showWidgetsMenu, setShowWidgetsMenu] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  const pathname = usePathname() || '/';
  const { theme, setTheme } = useTheme();
  const { user } = useUser();
  const t = useTranslations('SideBar');

  const { isWidgetVisible: isMetronomeVisible, showWidget: showMetronome, hideWidget: hideMetronome } = useMetronome();
  const { isWidgetVisible: isTunerVisible, showWidget: showTuner, hideWidget: hideTuner } = useTuner();
  const { isWidgetVisible: isPianoVisible, showWidget: showPiano, hideWidget: hidePiano } = usePiano();
  
  const { data: userData } = useQuery({
    queryKey: ['user'],
    queryFn: getMe,
  });

  const { data: studentData } = useQuery({
    queryKey: ['student', userData?.id],
    queryFn: () => getStudent(userData!.id),
    enabled: !!userData?.id && userData?.role !== 'super_admin',
  });

  /* ===================== HELPERS ===================== */
  
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setShowWidgetsMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    {
      name: 'my_courses',
      icon: <Layers className="w-5 h-5" />,
      href: '/main/courses',
    },
    {
      name: 'lesson_recordings',
      icon: <MonitorPlay className="w-5 h-5" />,
      href: '/main/lesson-recordings',
    },
    {
      name: 'tracker',
      icon: <LayoutList className="w-5 h-5" />,
      href: '/main/tracker',
    },
    // {
    //   name: 'my_boards',
    //   href: '/main/boards',
    //   icon: <SquareKanban className="w-5 h-5" />,
    // },
    {
      name: 'my_widgets',
      icon: <Component className="w-5 h-5" />,
      submenu: [
        {
          name: 'metronome',
          href: '/main/widgets/metronome',
          icon: <Timer className="w-4 h-4" />,
        },
        {
          name: 'tuner',
          href: '/main/widgets/tuner',
          icon: <Music className="w-4 h-4" />,
        },
        {
          name: 'piano',
          href: '/main/widgets/piano',
          icon: <Piano className="w-4 h-4" />,
        }
      ],
    },  
  ];

  const adminMenu: MenuItem[] = [
    {
      name: 'students_database',
      icon: <Users className="w-5 h-5" />,
      href: '/main/students',
    },
    // {
    //   name: 'tracker',
    //   icon: <LayoutList className="w-5 h-5" />,
    //   href: '/main/tracker',
    // },
    // {
    //   name: 'lesson_recordings',
    //   href: '/main/lesson-recordings',
    //   icon: <MonitorPlay className="w-5 h-5" />,
    // },
    // {
    //   name: 'boards',
    //   href: '/main/boards',
    //   icon: <SquareKanban className="w-5 h-5" />,
    // },
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
      name: 'my_widgets',
      icon: <Component className="w-5 h-5" />,
      submenu: [
        {
          name: 'metronome',
          href: '/main/widgets/metronome',
          icon: <Timer className="w-4 h-4" />,
        },
        {
          name: 'tuner',
          href: '/main/widgets/tuner',
          icon: <Music className="w-4 h-4" />,
        },
        {
          name: 'piano',
          href: '/main/widgets/piano',
          icon: <Piano className="w-4 h-4" />,
        }
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
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                ${active ? 'bg-white/20 text-white' : 'hover:bg-white/10'}
                ${isCollapsed ? 'justify-center' : ''}
              `}
            >
              <div className="shrink-0">{item.icon}</div>
              {!isCollapsed && <span
                className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out
                  ${isCollapsed ? 'w-0 max-w-0 opacity-0' : 'w-auto max-w-[300px] opacity-100'}
                `}
              >
                {t(item.name)}
              </span>}
            </Link>
          );
        }

        return (
          <div key={item.name}>
            <button
              onClick={() => toggleSubmenu(item.name)}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                ${active ? 'bg-white/20 text-white' : 'hover:bg-white/10'}
                ${isCollapsed ? 'justify-center' : 'justify-between'}
              `}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="shrink-0">{item.icon}</div>
                {!isCollapsed &&
                  (<span
                  className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out
                    ${isCollapsed ? 'w-0 max-w-0 opacity-0' : 'w-auto max-w-[300px] opacity-100'}
                  `}
                >
                  {t(item.name)}
                </span>)
                }
                
              </div>
              {!isCollapsed &&
              <div
                className={`shrink-0 transition-all duration-300 ease-in-out ${
                  isCollapsed ? 'w-0 opacity-0' : 'w-4 opacity-100'
                }`}
              >
                {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
              }
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out
                ${!isCollapsed && open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
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
                      <div className="shrink-0">{sub.icon}</div>
                      <span>{t(sub.name)}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}

      <div className="mt-auto space-y-2 border-t border-white/10 pt-4">
        <button
          onClick={toggleTheme}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-white/10
            ${isCollapsed ? 'justify-center' : ''}
          `}
        >
          <div className="shrink-0">
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </div>
          <span
            className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out
            ${isCollapsed ? 'w-0 max-w-0 opacity-0' : 'w-auto max-w-[300px] opacity-100'}`}
          >
            {t('change_theme')}
          </span>
        </button>

        <button
          onClick={handleLogout}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-400 hover:bg-red-900/20
            ${isCollapsed ? 'justify-center' : ''}
          `}
        >
          <div className="shrink-0">
            <LogOut className="w-5 h-5" />
          </div>
          <span
            className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out
            ${isCollapsed ? 'w-0 max-w-0 opacity-0' : 'w-auto max-w-[300px] opacity-100'}`}
          >
            {t('logout')}
          </span>
        </button>

        <div
          className={`mt-4 flex flex-col items-center justify-center overflow-hidden text-center text-[10px] text-white/40 pb-2 transition-all duration-300 ease-in-out
             ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-20 opacity-100'}
          `}
        >
          <p className="mb-1 whitespace-nowrap">© {new Date().getFullYear()} YS Vocal Academy</p>
          <p className="whitespace-nowrap">{t('all_rights_reserved')}</p>
        </div>
      </div>
    </>
  );

  /* ===================== LAYOUT ===================== */

  return (
    <>
      {/* DESKTOP */}
      <aside
        className={`hidden sticky top-0 md:flex h-screen flex-col border-r bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 ease-in-out shrink-0
          ${collapsed ? 'w-20' : 'w-66'}
        `}
      >
        <div
          className={`flex items-center ${
            collapsed ? 'justify-center' : 'justify-between'
          } border-b border-white/10 p-4 transition-all duration-300`}
        >
          <div
            className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out
              ${collapsed ? 'w-0 max-w-0 opacity-0' : 'w-auto max-w-[300px] opacity-100'}
            `}
          >
            <Link href="/main" className="text-lg font-bold">
              YS Vocal Academy
            </Link>
          </div>
          <Button variant="ghost" size="icon" onClick={handleCollapse} className="shrink-0">
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
        </div>

        <nav className="flex-1 flex flex-col space-y-1 overflow-y-auto overflow-x-hidden p-3 scrollbar-thin scrollbar-thumb-white/10">
          <MenuContent isCollapsed={collapsed} />
        </nav>
      </aside>

      {/* MOBILE */}
      <header className="fixed top-0 z-50 w-full bg-gradient-to-b from-gray-900 to-gray-800 text-white md:hidden">
        <div className="flex items-center justify-between p-4">
          <span className="text-lg font-bold">YS Vocal Academy</span>
          <div className="flex items-center gap-2">
            <Link
              href="https://t.me/yana_vocalcoach"
              target="_blank"
              className="p-2 text-white hover:text-blue-400 transition-colors"
            >
              <MessageCircle className="w-6 h-6" />
            </Link>

            <div className="relative group" ref={widgetRef}>
              <button
                onClick={() => setShowWidgetsMenu(v => !v)}
                className="p-2 text-white hover:text-blue-400 transition-colors"
              >
                <LayoutGrid className="w-6 h-6" />
              </button>
              
              {showWidgetsMenu && <div className="absolute right-0 top-[40px] left-[-18px] flex flex-col gap-2 p-2 bg-gray-900/95 backdrop-blur-sm rounded-xl border border-white/10 shadow-xl z-50 animate-in fade-in slide-in-from-top-2">
                <button
                  onClick={() => isPianoVisible ? hidePiano() : showPiano()}
                  className={cn("p-2 transition-all hover:bg-white/10 rounded-lg", isPianoVisible ? "text-blue-400 bg-white/5" : "text-white")}
                  title={t('piano')}
                >
                  <Piano className="w-5 h-5" />
                </button>
                <button
                  onClick={() => isTunerVisible ? hideTuner() : showTuner()}
                  className={cn("p-2 transition-all hover:bg-white/10 rounded-lg", isTunerVisible ? "text-emerald-400 bg-white/5" : "text-white")}
                  title={t('tuner')}
                >
                  <Music className="w-5 h-5" />
                </button>
                <button
                  onClick={() => isMetronomeVisible ? hideMetronome() : showMetronome()}
                  className={cn("p-2 transition-all hover:bg-white/10 rounded-lg", isMetronomeVisible ? "text-orange-400 bg-white/5" : "text-white")}
                  title={t('metronome')}
                >
                  <Timer className="w-5 h-5" />
                </button>
              </div>}
            </div>

            {userData?.role !== 'super_admin' && studentData && (
                <NotificationBell notifications={studentData.notifications ?? []} />
            )}
            
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(v => !v)}>
              {mobileMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        <div
          className={`overflow-hidden transition-all duration-300
            ${mobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}
          `}
        >
          <nav className="space-y-3 p-4 pb-4">
            <MenuContent />
          </nav>
        </div>
      </header>

      <div className="h-16 md:hidden" />
    </>
  );
}
