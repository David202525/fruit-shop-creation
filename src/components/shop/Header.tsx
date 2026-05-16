import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import Icon from '@/components/ui/icon';
import SideMenu from './SideMenu';
import SnowEffect from './SnowEffect';
import LeafyTitle from './LeafyTitle';
import NotificationBell from './NotificationBell';
import OnlineCounter from './OnlineCounter';

import { useState, useEffect } from 'react';

interface User {
  id: number;
  phone: string;
  full_name: string;
  is_admin: boolean;
}

interface CartItem {
  product: {
    id: number;
    name: string;
    price: number;
    image_url: string;
  };
  quantity: number;
}

interface HeaderProps {
  cart: CartItem[];
  user: User | null;
  currentSection: string;
  siteSettings?: { site_name?: string; holiday_theme?: string; logo_url?: string };
  favoritesCount?: number;
  onSectionChange: (section: string) => void;
  onShowAuth: () => void;
  renderCartContent: () => React.ReactNode;
  renderProfileContent: () => React.ReactNode;
  onNotificationClick?: (notification: unknown) => void;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Header = ({ 
  cart, 
  user, 
  currentSection, 
  siteSettings,
  favoritesCount = 0,
  onSectionChange, 
  onShowAuth,
  renderCartContent,
  renderProfileContent,
  onNotificationClick
}: HeaderProps) => {
  const isNewYear = siteSettings?.holiday_theme === 'new_year';
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
  };
  
  return (
    <header className="header-height sticky z-50 overflow-hidden text-white" style={{ top: 'var(--banner-height, 0px)', background: 'linear-gradient(135deg, #064e3b 0%, #065f46 40%, #047857 70%, #059669 100%)' }}>
      {/* Неоновое свечение снизу */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-80" />
      {/* Тонкая текстура */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,rgba(52,211,153,0.15)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_100%,rgba(16,185,129,0.1)_0%,transparent_50%)] pointer-events-none" />
      {isNewYear && <SnowEffect />}
      
      {isNewYear && (
        <>
          <div className="absolute top-2 right-8 sm:right-16 md:right-24 lg:right-32 hidden sm:flex gap-3 opacity-90 animate-pulse">
            <div className="text-4xl sm:text-5xl" style={{ animation: 'swing 3s ease-in-out infinite' }}>🎄</div>
            <div className="text-3xl sm:text-4xl" style={{ animation: 'swing 3s ease-in-out 0.5s infinite' }}>✨</div>
            <div className="text-2xl sm:text-3xl" style={{ animation: 'swing 3s ease-in-out 1s infinite' }}>🎁</div>
          </div>
          
          <div className="absolute top-1 left-1/4 hidden sm:flex gap-2 opacity-60">
            <div className="text-xl">❄️</div>
            <div className="text-xl" style={{ animation: 'twinkle 2s ease-in-out infinite' }}>⛄</div>
          </div>
          
          <style>{`
            @keyframes swing {
              0%, 100% { transform: rotate(-5deg); }
              50% { transform: rotate(5deg); }
            }
            @keyframes twinkle {
              0%, 100% { opacity: 0.4; }
              50% { opacity: 1; }
            }
          `}</style>
        </>
      )}
      
      <div className="container mx-auto px-2 sm:px-4 py-1.5 sm:py-2.5 flex items-center justify-between relative z-10 min-w-0 gap-1">
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink min-w-0 overflow-hidden">
          <SideMenu siteSettings={siteSettings} user={user} onSectionChange={onSectionChange} onShowAuth={onShowAuth} />
          <button 
            onClick={() => onSectionChange('home')} 
            className="flex items-center gap-1.5 sm:gap-2 hover:opacity-90 transition min-w-0 flex-shrink overflow-hidden"
          >
            {siteSettings?.logo_url && siteSettings.logo_url.startsWith('http') && (
              <img 
                src={siteSettings.logo_url} 
                alt={`Логотип ${siteSettings?.site_name || 'Питомник растений'}`}
                className="h-9 w-9 sm:h-11 sm:w-11 md:h-12 md:w-12 rounded-full object-cover border-2 border-white/30 shadow-md flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <div className="flex flex-col leading-tight">
              <span
                className="font-display font-bold text-base sm:text-xl md:text-2xl tracking-wide truncate max-w-[130px] sm:max-w-[240px] md:max-w-none"
                style={{
                  color: '#ffffff',
                  textShadow: '0 0 20px rgba(52,211,153,0.6), 0 0 40px rgba(52,211,153,0.3), 0 1px 3px rgba(0,0,0,0.3)'
                }}
              >
                {siteSettings?.site_name || 'Питомник растений'}
              </span>
              <span
                className="text-[9px] sm:text-[11px] font-sans tracking-[0.2em] uppercase"
                style={{ color: 'rgba(110,231,183,0.85)' }}
              >
                Питомник · Саженцы · Доставка
              </span>
            </div>
          </button>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          <OnlineCounter />
          <button onClick={() => onSectionChange('home')} className="hover:opacity-80 transition">Главная</button>
          <button onClick={() => onSectionChange('catalog')} className="hover:opacity-80 transition">Каталог</button>
          <button onClick={() => onSectionChange('about')} className="hover:opacity-80 transition">О нас</button>
          <button onClick={() => onSectionChange('delivery')} className="hover:opacity-80 transition">Доставка</button>
          <button onClick={() => onSectionChange('care')} className="hover:opacity-80 transition">Уход</button>
          <button onClick={() => onSectionChange('contacts')} className="hover:opacity-80 transition">Контакты</button>
        </nav>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {!isInstalled && deferredPrompt && (
            <Button
              variant="ghost"
              size="sm"
              className="hidden lg:flex items-center gap-2 text-primary-foreground hover:bg-primary/90 bg-white/10 backdrop-blur-sm border border-white/20"
              onClick={handleInstallApp}
            >
              <Icon name="Download" size={16} />
              <span className="hidden xl:inline">Установить</span>
            </Button>
          )}

          {user && (
            <>
              <NotificationBell 
                userId={user.id} 
                onNotificationClick={onNotificationClick}
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className={`relative overflow-visible text-pink-100 w-9 h-9 sm:w-11 sm:h-11 rounded-full transition-all hover:scale-110 ${isNewYear ? 'snow-icon-button' : ''}`}
                style={{ background: 'linear-gradient(135deg,rgba(239,68,68,0.35),rgba(236,72,153,0.35))', border: '1.5px solid rgba(252,165,165,0.4)', boxShadow: '0 0 12px rgba(239,68,68,0.25)' }}
                onClick={() => onSectionChange('favorites')}
              >
                <Icon name="Heart" size={16} className="sm:hidden" />
                <Icon name="Heart" size={20} className="hidden sm:block" />
                {favoritesCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] min-h-[20px] px-1.5 py-0.5 text-[11px] rounded-full flex items-center justify-center bg-gradient-to-br from-red-500 to-red-600 text-white font-bold shadow-lg animate-pulse pointer-events-none z-10 leading-none">
                    {favoritesCount > 99 ? '99+' : favoritesCount}
                  </span>
                )}
                {isNewYear && <div className="icon-snow-sparkle">❄️</div>}
              </Button>
            </>
          )}

          {user && <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className={`relative overflow-visible text-amber-100 w-9 h-9 sm:w-11 sm:h-11 rounded-full transition-all hover:scale-110 ${isNewYear ? 'snow-icon-button' : ''}`} style={{ background: 'linear-gradient(135deg,rgba(234,179,8,0.35),rgba(245,158,11,0.35))', border: '1.5px solid rgba(253,230,138,0.4)', boxShadow: '0 0 12px rgba(234,179,8,0.25)' }}>
                <Icon name="ShoppingCart" size={16} className="sm:hidden" />
                <Icon name="ShoppingCart" size={20} className="hidden sm:block" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] min-h-[20px] px-1.5 py-0.5 text-[11px] rounded-full flex items-center justify-center bg-gradient-to-br from-yellow-500 to-amber-600 text-white font-bold shadow-lg animate-pulse pointer-events-none z-10 leading-none">
                    {cart.length > 99 ? '99+' : cart.length}
                  </span>
                )}
                {isNewYear && <div className="icon-snow-sparkle">✨</div>}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-4 sm:p-6">
              <SheetHeader>
                <SheetTitle>Корзина</SheetTitle>
              </SheetHeader>
              {renderCartContent()}
            </SheetContent>
          </Sheet>}

          {user ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className={`relative text-sky-100 w-9 h-9 sm:w-11 sm:h-11 rounded-full transition-all hover:scale-110 ${isNewYear ? 'snow-icon-button' : ''}`} style={{ background: 'linear-gradient(135deg,rgba(59,130,246,0.35),rgba(14,165,233,0.35))', border: '1.5px solid rgba(147,197,253,0.4)', boxShadow: '0 0 12px rgba(59,130,246,0.25)' }}>
                  <Icon name="User" size={16} className="sm:hidden" />
                  <Icon name="User" size={20} className="hidden sm:block" />
                  {isNewYear && <div className="icon-snow-sparkle">🎅</div>}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-4 sm:p-6">
                <SheetHeader>
                  <SheetTitle>Профиль</SheetTitle>
                </SheetHeader>
                {renderProfileContent()}
              </SheetContent>
            </Sheet>
          ) : (
            <Button 
              onClick={onShowAuth} 
              className="rounded-full px-3 sm:px-5 py-1.5 text-xs sm:text-sm font-semibold text-emerald-900 transition-all hover:scale-105 border-0 min-h-[36px] sm:min-h-[40px]"
              style={{ background: 'linear-gradient(135deg, #6ee7b7, #34d399)', boxShadow: '0 0 16px rgba(52,211,153,0.5)' }}
            >
              Войти
            </Button>
          )}
        </div>
      </div>
      
      <style>{`
        .snow-icon-button {
          position: relative;
          overflow: visible;
        }
        
        .icon-snow-sparkle {
          position: absolute;
          top: -8px;
          left: -8px;
          font-size: 14px;
          animation: sparkle-rotate 3s ease-in-out infinite;
          pointer-events: none;
          filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.8));
        }
        
        @keyframes sparkle-rotate {
          0%, 100% { 
            transform: rotate(0deg) scale(1); 
            opacity: 0.8;
          }
          50% { 
            transform: rotate(20deg) scale(1.2); 
            opacity: 1;
          }
        }
        
        .snow-icon-button::before {
          content: '';
          position: absolute;
          top: -3px;
          left: 0;
          right: 0;
          height: 10px;
          background: linear-gradient(to bottom, 
            rgba(255, 255, 255, 0.6) 0%, 
            rgba(240, 249, 255, 0.3) 50%, 
            transparent 100%
          );
          border-radius: 50%;
          pointer-events: none;
          z-index: 10;
        }
        
        .snow-icon-button:hover::before {
          height: 14px;
          background: linear-gradient(to bottom, 
            rgba(255, 255, 255, 0.8) 0%, 
            rgba(240, 249, 255, 0.5) 50%, 
            transparent 100%
          );
        }
      `}</style>
    </header>
  );
};

export default Header;