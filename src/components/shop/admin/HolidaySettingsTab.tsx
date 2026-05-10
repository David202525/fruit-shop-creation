import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { getHolidaySettings, enableHoliday, disableHoliday, toggleCalendar, toggleBanner, setCalendarDays } from '@/utils/holidaySettings';
import type { HolidayKey } from '@/utils/holidaySettings';
import { HOLIDAY_LIST } from '@/utils/holidayConfig';
import CalendarAdmin from '@/components/CalendarAdmin';
import HolidayCalendar from '@/components/HolidayCalendar';
import HolidayThemesTab from './HolidayThemesTab';
import HolidayPrizesTab from './HolidayPrizesTab';
import HolidayCalendarsTab from './HolidayCalendarsTab';

const HolidaySettingsTab = () => {
  const [settings, setSettings] = useState(getHolidaySettings());
  const [showCalendarAdmin, setShowCalendarAdmin] = useState<HolidayKey | null>(null);
  const [activeTab, setActiveTab] = useState<'themes' | 'prizes' | 'calendar'>('themes');
  const [showCalendarPreview, setShowCalendarPreview] = useState<HolidayKey | null>(null);

  const refreshSettings = () => {
    setSettings(getHolidaySettings());
  };

  const handleEnableHoliday = (holiday: HolidayKey) => {
    enableHoliday(holiday);
    refreshSettings();
  };

  const handleDisableHoliday = () => {
    disableHoliday();
    refreshSettings();
  };

  const handleToggleCalendar = (enabled: boolean) => {
    toggleCalendar(enabled);
    refreshSettings();
  };

  const handleToggleBanner = (enabled: boolean) => {
    toggleBanner(enabled);
    refreshSettings();
  };

  const handleSetCalendarDays = (holiday: HolidayKey, days: number) => {
    setCalendarDays(holiday, days);
    localStorage.removeItem(`calendar_${holiday}`);
    refreshSettings();
  };

  const resetAllCalendars = () => {
    if (!confirm('⚠️ ВНИМАНИЕ! Это действие обнулит календари всех пользователей. Все открытые подарки будут сброшены. Продолжить?')) {
      return;
    }

    HOLIDAY_LIST.forEach((meta) => {
      localStorage.removeItem(`calendar_${meta.key}`);
    });
    alert('✅ Календари успешно обнулены!');
  };

  return (
    <div className="space-y-6">
      {/* Навигация по категориям */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('themes')}
          className={`px-4 py-3 font-semibold transition-colors relative ${
            activeTab === 'themes'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Icon name="Sparkles" size={18} />
            Праздничные темы
          </div>
        </button>
        <button
          onClick={() => setActiveTab('prizes')}
          className={`px-4 py-3 font-semibold transition-colors relative ${
            activeTab === 'prizes'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Icon name="Gift" size={18} />
            Управление призами
          </div>
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-3 font-semibold transition-colors relative ${
            activeTab === 'calendar'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Icon name="Calendar" size={18} />
            Календари пользователей
          </div>
        </button>
      </div>

      {/* Вкладка: Праздничные темы */}
      {activeTab === 'themes' && (
        <HolidayThemesTab
          settings={settings}
          onEnableHoliday={handleEnableHoliday}
          onDisableHoliday={handleDisableHoliday}
          onToggleCalendar={handleToggleCalendar}
          onToggleBanner={handleToggleBanner}
          onOpenCalendarAdmin={setShowCalendarAdmin}
          onSetCalendarDays={handleSetCalendarDays}
        />
      )}

      {/* Вкладка: Управление призами */}
      {activeTab === 'prizes' && (
        <HolidayPrizesTab
          settings={settings}
          onOpenCalendarAdmin={setShowCalendarAdmin}
        />
      )}

      {/* Вкладка: Календари пользователей */}
      {activeTab === 'calendar' && (
        <HolidayCalendarsTab
          settings={settings}
          onOpenCalendarAdmin={setShowCalendarAdmin}
          onOpenCalendarPreview={setShowCalendarPreview}
          onResetAllCalendars={resetAllCalendars}
        />
      )}

      {/* Модальное окно редактирования календаря */}
      {showCalendarAdmin && (
        <CalendarAdmin
          holiday={showCalendarAdmin}
          onClose={() => setShowCalendarAdmin(null)}
        />
      )}

      {/* Модальное окно превью календаря (режим клиента) */}
      {showCalendarPreview && (
        <HolidayCalendar
          holiday={showCalendarPreview}
          onClose={() => setShowCalendarPreview(null)}
          testMode={true}
        />
      )}
    </div>
  );
};

export default HolidaySettingsTab;