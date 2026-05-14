import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { getHolidaySettings } from '@/utils/holidaySettings';
import type { HolidayKey } from '@/utils/holidaySettings';
import { getHolidayMeta } from '@/utils/holidayConfig';

interface HolidayBannerProps {
  onOpenCalendar: (holiday: HolidayKey) => void;
  isPrizeModalOpen?: boolean;
}

const HolidayBanner = ({ onOpenCalendar, isPrizeModalOpen = false }: HolidayBannerProps) => {
  const [settings, setSettings] = useState(getHolidaySettings());
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const currentSettings = getHolidaySettings();
    setSettings(currentSettings);

    const dismissedKey = `holiday_banner_dismissed_${currentSettings.activeHoliday}`;
    const dismissed = localStorage.getItem(dismissedKey);
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const today = new Date();
      const hoursPassed = (today.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60);
      if (hoursPassed < 1) {
        setIsVisible(false);
      }
    }

    const handleSettingsChange = (e: CustomEvent) => {
      setSettings(e.detail);
      setIsVisible(true);
    };

    const handleStorageChange = () => {
      const updatedSettings = getHolidaySettings();
      setSettings(updatedSettings);
      setIsVisible(true);
    };

    window.addEventListener('holiday-settings-changed', handleSettingsChange as EventListener);
    window.addEventListener('storage', handleStorageChange);

    const interval = setInterval(() => {
      const updatedSettings = getHolidaySettings();
      setSettings(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(updatedSettings)) {
          setIsVisible(true);
          return updatedSettings;
        }
        return prev;
      });
    }, 5000);

    return () => {
      window.removeEventListener('holiday-settings-changed', handleSettingsChange as EventListener);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const dismissBanner = () => {
    setIsVisible(false);
    document.body.style.paddingTop = '0px';
    const dismissedKey = `holiday_banner_dismissed_${settings.activeHoliday}`;
    localStorage.setItem(dismissedKey, new Date().toISOString());
  };

  useEffect(() => {
    const isShowing = settings.enabled && settings.showBanner && settings.activeHoliday && isVisible && !isPrizeModalOpen;
    document.body.style.paddingTop = isShowing ? '48px' : '0px';
    return () => { document.body.style.paddingTop = '0px'; };
  }, [settings.enabled, settings.showBanner, settings.activeHoliday, isVisible, isPrizeModalOpen]);

  if (!settings.enabled || !settings.showBanner || !settings.activeHoliday || !isVisible || isPrizeModalOpen) return null;

  const activeHoliday = settings.activeHoliday;
  const meta = getHolidayMeta(activeHoliday);

  const currentConfig = {
    gradient: meta.gradient,
    emoji: meta.emoji,
    title: meta.bannerTitle,
    description: meta.bannerDescription,
    buttonText: meta.bannerButton,
    particles: meta.particles,
    animation: meta.animation
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] overflow-hidden shadow-2xl">
      <div className={`relative bg-gradient-to-r ${currentConfig.gradient} text-white py-3 px-4`}>
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
            backgroundSize: '30px 30px'
          }}
        />

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute text-4xl animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${8 + Math.random() * 8}s`
              }}
            >
              {currentConfig.particles[Math.floor(Math.random() * currentConfig.particles.length)]}
            </div>
          ))}
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <button
            onClick={dismissBanner}
            className="absolute top-0 right-0 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <Icon name="X" size={20} />
          </button>

          <div className="flex items-center justify-center gap-4">
            <span className="text-2xl">{currentConfig.emoji}</span>
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
              <span className="font-bold text-base sm:text-lg">{currentConfig.title}</span>
              <span className="text-white/80 text-sm hidden sm:inline">{currentConfig.description}</span>
            </div>
            <button
              onClick={() => onOpenCalendar(activeHoliday)}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-white text-gray-800 rounded-full font-bold text-sm shadow-lg hover:shadow-xl transform hover:scale-105 transition-all whitespace-nowrap"
            >
              <Icon name="Gift" size={16} />
              {currentConfig.buttonText}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
          }
        }

        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
    </div>
  );
};

export default HolidayBanner;