import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface HolidayThemeSectionProps {
  holidayTheme: string;
  onThemeChange: (theme: string) => void;
}

const THEME_OPTIONS: { value: string; emoji: string; label: string }[] = [
  { value: 'none', emoji: '🌿', label: 'Без праздничной темы' },
  { value: 'new_year', emoji: '🎄', label: 'Новый год' },
  { value: 'christmas', emoji: '⛪', label: 'Рождество' },
  { value: 'feb14', emoji: '❤️', label: '14 Февраля — День святого Валентина' },
  { value: 'feb23', emoji: '🎖️', label: '23 Февраля — День защитника Отечества' },
  { value: 'maslenitsa', emoji: '🥞', label: 'Масленица' },
  { value: 'march8', emoji: '🌸', label: '8 Марта — Международный женский день' },
  { value: 'easter', emoji: '🐣', label: 'Пасха' },
  { value: 'may1', emoji: '🌷', label: '1 Мая — Праздник весны и труда' },
  { value: 'may9', emoji: '🎗️', label: '9 Мая — День Победы' },
  { value: 'june1', emoji: '🧒', label: '1 Июня — День защиты детей' },
  { value: 'june12', emoji: '🇷🇺', label: '12 Июня — День России' },
  { value: 'summer', emoji: '☀️', label: 'Лето' },
  { value: 'sept1', emoji: '📚', label: '1 Сентября — День знаний' },
  { value: 'teachers_day', emoji: '👩‍🏫', label: 'День учителя' },
  { value: 'mothers_day', emoji: '💐', label: 'День матери' },
  { value: 'fathers_day', emoji: '👨‍👧', label: 'День отца' },
  { value: 'national_unity', emoji: '🤝', label: '4 Ноября — День народного единства' },
  { value: 'halloween', emoji: '🎃', label: 'Хэллоуин' }
];

const HolidayThemeSection = ({ holidayTheme, onThemeChange }: HolidayThemeSectionProps) => {
  return (
    <div className="border-b pb-4 mb-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span>🎃</span> Праздничная тема сайта <span>🎄</span>
      </h3>
      <div>
        <Label htmlFor="holiday-theme">Выберите праздничную тему</Label>
        <input type="hidden" name="holiday_theme" value={holidayTheme} />
        <Select value={holidayTheme} onValueChange={onThemeChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Выберите тему" />
          </SelectTrigger>
          <SelectContent className="max-h-80">
            {THEME_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <div className="flex items-center gap-2">
                  <span>{opt.emoji}</span>
                  <span>{opt.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">
          Праздничное оформление сайта будет автоматически применено
        </p>
      </div>
    </div>
  );
};

export default HolidayThemeSection;