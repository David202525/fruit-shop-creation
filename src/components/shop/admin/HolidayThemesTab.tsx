import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';
import { HOLIDAY_LIST } from '@/utils/holidayConfig';
import type { HolidayKey } from '@/utils/holidaySettings';

interface HolidayThemesTabProps {
  settings: any;
  onEnableHoliday: (holiday: HolidayKey) => void;
  onDisableHoliday: () => void;
  onToggleCalendar: (enabled: boolean) => void;
  onToggleBanner: (enabled: boolean) => void;
  onOpenCalendarAdmin: (holiday: HolidayKey) => void;
  onSetCalendarDays: (holiday: HolidayKey, days: number) => void;
}

const HOLIDAY_DESCRIPTIONS: Partial<Record<HolidayKey, string>> = {
  new_year: 'Новогодние праздники',
  christmas: 'Рождество Христово',
  feb14: 'День святого Валентина',
  feb23: 'День защитника Отечества',
  march8: 'Международный женский день',
  maslenitsa: 'Проводы зимы',
  easter: 'Светлое Христово Воскресение',
  may1: 'Праздник весны и труда',
  may9: 'День Победы',
  june1: 'День защиты детей',
  june12: 'День России',
  sept1: 'День знаний',
  teachers_day: 'День учителя',
  mothers_day: 'День матери',
  fathers_day: 'День отца',
  national_unity: 'День народного единства',
  halloween: 'Хэллоуин'
};

const HolidayThemesTab = ({
  settings,
  onEnableHoliday,
  onDisableHoliday,
  onToggleCalendar,
  onToggleBanner,
  onOpenCalendarAdmin,
  onSetCalendarDays
}: HolidayThemesTabProps) => {

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Calendar" size={24} />
          Управление праздничными темами
        </CardTitle>
        <CardDescription>
          Включайте и настраивайте праздничные календари с подарками для клиентов
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Icon name="Sparkles" size={20} />
            Выбрать праздничную тему
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {HOLIDAY_LIST.map((meta) => {
              const isActive = settings.enabled && settings.activeHoliday === meta.key;
              const description = HOLIDAY_DESCRIPTIONS[meta.key] || meta.name;
              return (
                <Card
                  key={meta.key}
                  className={`transition-all ${isActive ? 'border-4 shadow-xl border-primary' : 'border-2 hover:shadow-lg'}`}
                >
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${meta.color} flex items-center justify-center text-5xl shadow-lg ${isActive ? 'animate-pulse' : ''}`}>
                        {meta.emoji}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-2xl flex items-center gap-2">
                          {meta.name}
                          {isActive && (
                            <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                              <Icon name="Check" size={12} className="mr-1" />
                              Активно
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription className="text-base">{description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {!isActive ? (
                      <Button
                        onClick={() => onEnableHoliday(meta.key)}
                        className={`w-full bg-gradient-to-r ${meta.color} hover:opacity-90 text-white`}
                        size="lg"
                      >
                        <Icon name="Sparkles" size={18} className="mr-2" />
                        Активировать тему
                      </Button>
                    ) : (
                      <Button
                        onClick={onDisableHoliday}
                        variant="outline"
                        className="w-full border-2"
                        size="lg"
                      >
                        <Icon name="X" size={18} className="mr-2" />
                        Отключить тему
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {settings.enabled && settings.activeHoliday && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Icon name="Calendar" size={24} className="text-primary" />
                <div>
                  <h4 className="font-semibold">Праздничный календарь</h4>
                  <p className="text-sm text-gray-600">Ежедневные подарки для клиентов</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => onOpenCalendarAdmin(settings.activeHoliday!)}
                  variant="outline"
                  size="sm"
                >
                  <Icon name="Settings" size={16} className="mr-2" />
                  Настроить призы
                </Button>
                <Switch
                  checked={settings.calendarEnabled}
                  onCheckedChange={onToggleCalendar}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Icon name="Layout" size={24} className="text-primary" />
                <div>
                  <h4 className="font-semibold">Праздничный баннер</h4>
                  <p className="text-sm text-gray-600">Баннер в верхней части сайта</p>
                </div>
              </div>
              <Switch
                checked={settings.showBanner}
                onCheckedChange={onToggleBanner}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Icon name="CalendarDays" size={24} className="text-primary" />
                <div>
                  <h4 className="font-semibold">Количество дней календаря</h4>
                  <p className="text-sm text-gray-600">Сколько дней будет доступно для открытия</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={settings.calendarDays?.[settings.activeHoliday] || 8}
                  onChange={(e) => onSetCalendarDays(settings.activeHoliday!, parseInt(e.target.value) || 8)}
                  className="w-20 px-3 py-2 border rounded-lg text-center font-semibold focus:ring-2 focus:ring-primary outline-none"
                />
                <span className="text-sm text-gray-600">дней</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HolidayThemesTab;