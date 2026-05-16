export type HolidayKey =
  | 'new_year'
  | 'christmas'
  | 'feb14'
  | 'feb23'
  | 'march8'
  | 'maslenitsa'
  | 'easter'
  | 'may1'
  | 'may9'
  | 'june1'
  | 'june12'
  | 'sept1'
  | 'teachers_day'
  | 'mothers_day'
  | 'national_unity'
  | 'halloween'
  | 'fathers_day';

export interface HolidaySettings {
  enabled: boolean;
  activeHoliday: HolidayKey | null;
  showBanner: boolean;
  calendarEnabled: boolean;
  calendarDays: Partial<Record<HolidayKey, number>> & {
    feb23: number;
    march8: number;
  };
}

const CACHE_KEY = 'holiday_settings_cache';
const CACHE_DURATION = 60 * 1000;
const ERROR_RETRY_DELAY = 30 * 1000;
const API_URL = 'https://functions.poehali.dev/9b1ac59e-93b6-41de-8974-a7f58d4ffaf9';

let isFetching = false;
let lastErrorTime = 0;

export const fetchHolidaySettingsFromAPI = async (): Promise<HolidaySettings> => {
  if (isFetching) return getCachedSettings();
  if (Date.now() - lastErrorTime < ERROR_RETRY_DELAY) return getCachedSettings();

  isFetching = true;
  try {
    const response = await fetch(`${API_URL}?holiday_settings=true`);
    const data = await response.json();

    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
    
    window.dispatchEvent(new CustomEvent('holiday-settings-changed', { detail: data }));
    return data;
  } catch (error) {
    lastErrorTime = Date.now();
    return getCachedSettings();
  } finally {
    isFetching = false;
  }
};

const DEFAULT_SETTINGS: HolidaySettings = {
  enabled: false,
  activeHoliday: null,
  showBanner: false,
  calendarEnabled: false,
  calendarDays: { feb23: 8, march8: 8 }
};

const getCachedSettings = (): HolidaySettings => {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const { data } = JSON.parse(cached);
      if (data && typeof data === 'object') {
        if (!data.calendarDays) data.calendarDays = { feb23: 8, march8: 8 };
        return data as HolidaySettings;
      }
    } catch { /* ignore */ }
  }
  return DEFAULT_SETTINGS;
};

export const getLocalHolidaySettings = getCachedSettings;

export const getHolidaySettings = (): HolidaySettings => {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) return data;
    } catch { /* ignore */ }
  }
  fetchHolidaySettingsFromAPI();
  return getCachedSettings();
};

export const saveHolidaySettings = async (settings: HolidaySettings): Promise<void> => {
  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_holiday',
        ...settings
      })
    });
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: settings,
      timestamp: Date.now()
    }));
    window.dispatchEvent(new CustomEvent('holiday-settings-changed', { detail: settings }));
  } catch (error) {
    console.error('Failed to save holiday settings to API:', error);
  }
};

export const enableHoliday = async (holiday: HolidayKey): Promise<void> => {
  const settings = getHolidaySettings();
  settings.enabled = true;
  settings.activeHoliday = holiday;
  settings.showBanner = true;
  settings.calendarEnabled = true;
  await saveHolidaySettings(settings);
};

export const disableHoliday = async (): Promise<void> => {
  const settings = getHolidaySettings();
  settings.enabled = false;
  settings.activeHoliday = null;
  settings.showBanner = false;
  settings.calendarEnabled = false;
  await saveHolidaySettings(settings);
};

export const toggleCalendar = async (enabled: boolean): Promise<void> => {
  const settings = getHolidaySettings();
  settings.calendarEnabled = enabled;
  await saveHolidaySettings(settings);
};

export const toggleBanner = async (enabled: boolean): Promise<void> => {
  const settings = getHolidaySettings();
  settings.showBanner = enabled;
  await saveHolidaySettings(settings);
};

export const setCalendarDays = async (holiday: HolidayKey, days: number): Promise<void> => {
  const settings = getHolidaySettings();
  settings.calendarDays[holiday] = days;
  await saveHolidaySettings(settings);
};