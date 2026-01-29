import { Bell, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { Notification } from '@/components/Students/interface';
import { deleteNotification, readNotifications } from '@/components/Students/Student/actions';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';

interface Props {
  notifications: Notification[];
}

const NOTIFICATION_MESSAGES: Record<string, string> = {
  new_task: 'Вам назначено нове завдання, перейдіть в трекер щоб переглянути',
  lesson_record: 'Додано запис уроку',
  new_lesson: 'Відкрит доступ до нового уроку',
  student_updated_task_column: 'оновив/оновила статус завдання',
};

export default function NotificationBell({ notifications }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [localNotifications, setLocalNotifications] = useState(notifications);
  const containerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const t = useTranslations('Common');

  const unreadCount = localNotifications.filter(n => !n.read).length;
  const hasUnread = unreadCount > 0;

  useEffect(() => {
    setLocalNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = async () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      const unreadIds = localNotifications.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length > 0) {
        try {
          await readNotifications(unreadIds);
          // Optimistically update local state to mark as read
           setLocalNotifications(prev =>
            prev.map(n => (unreadIds.includes(n.id) ? { ...n, read: true } : n))
          );
          // Invalidate query to refetch fresh data
          await queryClient.invalidateQueries({ queryKey: ['student'] });
          await queryClient.invalidateQueries({ queryKey: ['user'] });
        } catch (error) {
          console.error('Error reading notifications:', error);
        }
      }
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      setLocalNotifications(prev => prev.filter(n => n.id !== id));
      await queryClient.invalidateQueries({ queryKey: ['student'] });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const sortedNotifications = [...localNotifications].sort((a, b) => {
    if (a.read === b.read) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return a.read ? 1 : -1;
  });

  const renderMessage = (notification: string): ReactNode => {
    const firstSpaceIndex = notification.indexOf(' ');
    
    // If no space, it's just a type key
    if (firstSpaceIndex === -1) {
      return NOTIFICATION_MESSAGES[notification] || notification;
    }

    const type = notification.substring(0, firstSpaceIndex);
    const content = notification.substring(firstSpaceIndex + 1);

    if (type === 'student_updated_task_column') {
      try {
        const data = JSON.parse(content);
        return (
          <span>
            <Link 
              href={`/main/students/${data.id}`} 
              className="text-accent hover:underline font-bold"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
            >
              {data.name}
            </Link>
            {' '}
            {NOTIFICATION_MESSAGES[type]}
            {data.task ? `: ${data.task}` : ''}
          </span>
        );
      } catch (e) {
        console.error('Failed to parse notification JSON', e);
      }
    }

    // Fallback for cases like type + simple string (e.g. legacy notifications)
    if (NOTIFICATION_MESSAGES[type]) {
      return `${content} ${NOTIFICATION_MESSAGES[type]}`;
    }

    return notification;
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={handleOpen}
        className={`relative p-2 rounded-full transition-colors ${
          hasUnread ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600' : 'hover:bg-accent text-muted-foreground'
        }`}
      >
        <Bell className={`w-6 h-6 ${hasUnread ? 'animate-swing' : ''}`} />
        {hasUnread && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-background" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-popover border rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="p-4 border-b bg-muted/30">
            <h3 className="font-semibold">{t('notifications')}</h3>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {sortedNotifications.length > 0 ? (
              <div className="divide-y">
                {sortedNotifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`p-4 relative group transition-colors ${
                      !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="pr-8">
                        <div className="text-sm font-medium mb-1">
                          {renderMessage(notification.title)}
                        </div>
                       <span className="text-xs text-muted-foreground">
                          {format(new Date(notification.createdAt), 'dd.MM.yyyy HH:mm')}
                       </span>
                    </div>
                    
                    <button
                      onClick={(e) => handleDelete(e, notification.id)}
                      className="absolute right-2 top-2 p-2 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive rounded-full transition-all"
                      title={t('delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {!notification.read && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p>{t('no_notifications')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes swing {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(15deg); }
          40% { transform: rotate(-10deg); }
          60% { transform: rotate(5deg); }
          80% { transform: rotate(-5deg); }
        }
        .animate-swing {
          animation: swing 2s infinite ease-in-out;
          transform-origin: top center;
        }
      `}</style>
    </div>
  );
}
