
'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Search,
  Plus,
  Settings,
  Menu,
  ChevronDown
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  eachDayOfInterval,
  isToday,
  parseISO
} from 'date-fns';
import { uk, enUS } from 'date-fns/locale';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import axios from 'axios';

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  color?: string;
}

export default function CalendarLayout() {
  const locale = useLocale();
  const dateLocale = locale === 'ua' ? uk : enUS;
  const t = useTranslations('Calendar');
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch events from Google Calendar
  useEffect(() => {
    const fetchEvents = async () => {
      const url = process.env.NEXT_PUBLIC_CALENDAR_URL;
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY; 
      
      if (!url) return;

      setLoading(true);
      try {
        const response = await axios.get(url, {
          params: {
            key: apiKey,
            timeMin: startOfMonth(currentDate).toISOString(),
            timeMax: endOfMonth(currentDate).toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
          }
        });
        setEvents(response.data.items || []);
      } catch (error) {
        console.error('Failed to fetch calendar events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [currentDate]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [startDate, endDate]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventDate = event.start.dateTime 
        ? parseISO(event.start.dateTime) 
        : event.start.date ? parseISO(event.start.date) : null;
      return eventDate && isSameDay(eventDate, day);
    });
  };

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden border-t mt-18 md:mt-0 md:h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-medium hidden sm:block">{t('title')}</h1>
          </div>
          
          <Button variant="outline" size="sm" onClick={goToToday} className="ml-4 rounded-md border-border hover:bg-muted">
            {t('today')}
          </Button>
          
          <div className="flex items-center gap-1 ml-2">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 rounded-full">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 rounded-full">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          <h2 className="text-xl font-medium ml-2">
            {format(currentDate, 'LLLL yyyy', { locale: dateLocale })}
          </h2>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto no-scrollbar bg-background w-full">
          <div className="h-full flex flex-col">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 border-b sticky top-0 bg-background z-10 shadow-sm">
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map((day) => (
                <div key={day} className="py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-widest border-r last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            {/* Grid Cells */}
            <div className="flex-1 grid grid-cols-7 auto-rows-fr">
              {calendarDays.map((day, idx) => {
                const dayEvents = getEventsForDay(day);
                return (
                  <div 
                    key={idx}
                    className={cn(
                      "min-h-[140px] border-r border-b p-1 flex flex-col gap-1 transition-all",
                      !isSameMonth(day, monthStart) && "bg-muted/5 opacity-40",
                      idx % 7 === 6 && "border-r-0"
                    )}
                  >
                    <div className="flex justify-center pt-1">
                      <span className={cn(
                        "text-xs font-medium w-8 h-8 flex items-center justify-center rounded-full transition-colors",
                        isToday(day) ? "bg-accent text-primary-foreground font-bold shadow-sm" : "hover:bg-muted text-foreground/70"
                      )}>
                        {format(day, 'd')}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 mt-1 overflow-y-auto no-scrollbar scroll-smooth px-1 h-32">
                      {dayEvents.map((event) => (
                        <div 
                          key={event.id}
                          className="px-2 py-1 rounded-md text-[11px] font-semibold truncate cursor-pointer shadow-sm active:scale-95 transition-transform"
                          style={{ 
                            backgroundColor: 'var(--accent)', 
                            color: '#fff',
                            opacity: 0.9
                          }}
                        >
                          {format(parseISO(event.start.dateTime || event.start.date!), 'HH:mm')} {event.summary}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
