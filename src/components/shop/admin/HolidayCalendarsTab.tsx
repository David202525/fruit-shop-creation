import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { HOLIDAY_LIST, getHolidayMeta } from '@/utils/holidayConfig';
import type { HolidayKey } from '@/utils/holidaySettings';

interface HolidayCalendarsTabProps {
  settings: any;
  onOpenCalendarAdmin: (holiday: HolidayKey) => void;
  onOpenCalendarPreview: (holiday: HolidayKey) => void;
  onResetAllCalendars: () => void;
}

const HolidayCalendarsTab = ({
  settings,
  onOpenCalendarAdmin,
  onOpenCalendarPreview,
  onResetAllCalendars
}: HolidayCalendarsTabProps) => {
  const getCalendarStats = (holiday: HolidayKey) => {
    const calendar = localStorage.getItem(`calendar_${holiday}`);
    if (!calendar) return { total: 0, opened: 0 };

    const days = JSON.parse(calendar);
    return {
      total: days.length,
      opened: days.filter((d: any) => d.opened).length
    };
  };

  const resetCalendar = (holiday: HolidayKey) => {
    const meta = getHolidayMeta(holiday);
    if (confirm(`Обнулить календарь "${meta.name}"? Все открытые подарки будут сброшены.`)) {
      localStorage.removeItem(`calendar_${holiday}`);
      alert('✅ Календарь обнулен!');
      window.location.reload();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Users" size={24} />
          Календари пользователей
        </CardTitle>
        <CardDescription>
          Статистика и управление праздничными календарями
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {settings.enabled && settings.activeHoliday && (() => {
          const calendar = localStorage.getItem(`calendar_${settings.activeHoliday}`);
          const meta = getHolidayMeta(settings.activeHoliday as HolidayKey);

          if (!calendar) return null;

          const days = JSON.parse(calendar);

          return (
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="LayoutGrid" size={20} />
                  Превью календаря: {meta.name}
                </CardTitle>
                <CardDescription>
                  Так видят календарь пользователи
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                  {days.map((day: any) => (
                    <div
                      key={day.day}
                      className={`aspect-square rounded-lg flex items-center justify-center text-lg font-bold transition-all ${
                        day.opened
                          ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-md'
                          : `bg-gradient-to-br ${meta.color} text-white opacity-80`
                      }`}
                    >
                      {day.opened ? (
                        <Icon name="Gift" size={20} />
                      ) : (
                        <span>{day.day}</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })()}

        <div className="grid md:grid-cols-2 gap-4">
          {HOLIDAY_LIST.map((meta) => {
            const stats = getCalendarStats(meta.key);
            const progress = stats.total > 0 ? (stats.opened / stats.total) * 100 : 0;

            return (
              <Card key={meta.key} className="border-2">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center text-3xl`}>
                      {meta.emoji}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{meta.name}</CardTitle>
                      <CardDescription>Праздничный календарь</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Всего дней:</span>
                      <span className="font-semibold">{stats.total}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Открыто подарков:</span>
                      <span className="font-semibold text-green-600">{stats.opened}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Прогресс</span>
                        <span>{progress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`bg-gradient-to-r ${meta.color} h-2.5 rounded-full transition-all`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button
                      onClick={() => onOpenCalendarPreview(meta.key)}
                      className={`w-full bg-gradient-to-r ${meta.color} hover:opacity-90 text-white`}
                    >
                      <Icon name="Eye" size={16} className="mr-2" />
                      Открыть как клиент
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => onOpenCalendarAdmin(meta.key)}
                        variant="outline"
                        className="flex-1"
                      >
                        <Icon name="Settings" size={16} className="mr-2" />
                        Настроить
                      </Button>
                      <Button
                        onClick={() => resetCalendar(meta.key)}
                        variant="outline"
                        className="flex-1 text-orange-600 border-orange-300 hover:bg-orange-50"
                      >
                        <Icon name="RotateCcw" size={16} className="mr-2" />
                        Обнулить
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="border-t pt-6">
          <div className="flex items-center justify-between p-4 bg-red-50 border-2 border-red-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Icon name="AlertTriangle" size={24} className="text-red-600" />
              <div>
                <h4 className="font-semibold text-red-900">Опасная зона</h4>
                <p className="text-sm text-red-700">Необратимое действие для всех календарей</p>
              </div>
            </div>
            <Button onClick={onResetAllCalendars} variant="destructive">
              <Icon name="Trash2" size={16} className="mr-2" />
              Обнулить все календари
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HolidayCalendarsTab;