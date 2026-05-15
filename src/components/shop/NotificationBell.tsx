import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

const API_NOTIFICATIONS = 'https://functions.poehali.dev/fc281a64-4d76-4cbd-9ae6-6cf970c14f35';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  entity_type?: string;
  entity_id?: number;
  is_read: boolean;
  requires_rating: boolean;
  rating_given: boolean;
  created_at: string;
}

interface NotificationBellProps {
  userId: number;
  onNotificationClick?: (notification: Notification) => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ userId, onNotificationClick }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const loadNotifications = async () => {
    try {
      const response = await fetch(API_NOTIFICATIONS, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString(),
        },
      });

      const data = await response.json();
      
      if (data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  useEffect(() => {
    if (userId) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  const markAsRead = async (notificationId: number) => {
    try {
      await fetch(API_NOTIFICATIONS, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString(),
        },
        body: JSON.stringify({ notification_id: notificationId }),
      });

      loadNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(API_NOTIFICATIONS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString(),
        },
        body: JSON.stringify({ action: 'mark_all_read' }),
      });

      toast.success('Все уведомления отмечены как прочитанные');
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Ошибка при обновлении уведомлений');
    }
  };

  const deleteNotification = async (notificationId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(API_NOTIFICATIONS, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString(),
        },
        body: JSON.stringify({ notification_id: notificationId }),
      });

      toast.success('Уведомление удалено');
      loadNotifications();
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Ошибка при удалении уведомления');
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_status':
        return 'Package';
      case 'payment':
        return 'CreditCard';
      case 'system':
        return 'Bell';
      default:
        return 'Info';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <div className="relative inline-block">
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary/90 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border-2 border-blue-200/30 backdrop-blur-sm transition-all hover:scale-110"
          >
            <Icon name="Bell" size={18} className="sm:hidden" />
            <Icon name="Bell" size={22} className="hidden sm:block" />
          </Button>
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 min-w-[20px] h-[20px] sm:min-w-[22px] sm:h-[22px] px-1 text-[10px] sm:text-[11px] rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold shadow-lg animate-pulse pointer-events-none z-10">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </div>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Icon name="Bell" size={24} />
              Уведомления
            </SheetTitle>
            {notifications.length > 0 && unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                Прочитать все
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)] mt-6">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Icon name="Bell" size={48} className="text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Уведомлений пока нет</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all hover:bg-accent/50 ${
                    notification.is_read ? 'bg-muted/30' : 'bg-primary/5 border-primary/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${notification.is_read ? 'bg-muted' : 'bg-primary/10'}`}>
                      <Icon 
                        name={getNotificationIcon(notification.type)} 
                        size={20} 
                        className={notification.is_read ? 'text-muted-foreground' : 'text-primary'}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className={`font-semibold text-sm ${notification.is_read ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-primary rounded-full" />
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => deleteNotification(notification.id, e)}
                            className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Icon name="X" size={14} />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(notification.created_at).toLocaleString('ru-RU', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationBell;