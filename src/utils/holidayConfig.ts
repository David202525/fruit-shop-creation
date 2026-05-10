import type { HolidayKey } from './holidaySettings';

export interface HolidayMeta {
  key: HolidayKey;
  name: string;
  emoji: string;
  color: string;
  gradient: string;
  accent: string;
  text: string;
  bannerTitle: string;
  bannerDescription: string;
  bannerButton: string;
  particles: string[];
  animation: string;
  defaultDays: number;
}

export const HOLIDAY_LIST: HolidayMeta[] = [
  {
    key: 'new_year',
    name: 'Новый год',
    emoji: '🎄',
    color: 'from-red-600 to-green-600',
    gradient: 'from-red-600 via-green-600 to-red-600',
    accent: 'bg-red-500',
    text: 'text-red-900',
    bannerTitle: 'С Новым годом!',
    bannerDescription: 'Открывайте подарки в новогоднем календаре каждый день',
    bannerButton: 'Открыть календарь',
    particles: ['🎄', '🎅', '❄️', '⛄', '🎁', '✨'],
    animation: 'snow',
    defaultDays: 24
  },
  {
    key: 'christmas',
    name: 'Рождество',
    emoji: '⛪',
    color: 'from-amber-500 to-yellow-600',
    gradient: 'from-amber-500 via-yellow-600 to-amber-500',
    accent: 'bg-amber-500',
    text: 'text-amber-900',
    bannerTitle: 'Светлого Рождества!',
    bannerDescription: 'Праздничные подарки и сюрпризы каждый день',
    bannerButton: 'Открыть календарь',
    particles: ['⛪', '⭐', '🕯️', '✨', '🎁'],
    animation: 'spring',
    defaultDays: 7
  },
  {
    key: 'feb14',
    name: '14 Февраля',
    emoji: '❤️',
    color: 'from-rose-500 to-pink-500',
    gradient: 'from-rose-500 via-pink-500 to-rose-500',
    accent: 'bg-rose-500',
    text: 'text-rose-900',
    bannerTitle: 'С Днём святого Валентина!',
    bannerDescription: 'Романтические подарки в праздничном календаре',
    bannerButton: 'Получить подарок',
    particles: ['❤️', '💖', '💕', '🌹', '💐', '✨'],
    animation: 'spring',
    defaultDays: 7
  },
  {
    key: 'feb23',
    name: '23 Февраля',
    emoji: '🎖️',
    color: 'from-blue-600 to-green-600',
    gradient: 'from-blue-600 via-green-600 to-blue-600',
    accent: 'bg-blue-500',
    text: 'text-blue-900',
    bannerTitle: 'С 23 Февраля!',
    bannerDescription: 'Открывайте праздничный календарь и получайте подарки каждый день',
    bannerButton: 'Открыть календарь',
    particles: ['⭐', '🎯', '🏆', '⚡'],
    animation: 'military',
    defaultDays: 8
  },
  {
    key: 'march8',
    name: '8 Марта',
    emoji: '🌸',
    color: 'from-pink-500 to-purple-500',
    gradient: 'from-pink-500 via-purple-500 to-pink-500',
    accent: 'bg-pink-500',
    text: 'text-pink-900',
    bannerTitle: 'С 8 Марта!',
    bannerDescription: 'Специальные подарки и сюрпризы ждут вас в праздничном календаре',
    bannerButton: 'Получить подарок',
    particles: ['🌸', '🌺', '🌷', '💐', '🦋', '✨'],
    animation: 'spring',
    defaultDays: 8
  },
  {
    key: 'maslenitsa',
    name: 'Масленица',
    emoji: '🥞',
    color: 'from-orange-500 to-yellow-500',
    gradient: 'from-orange-500 via-yellow-500 to-orange-500',
    accent: 'bg-orange-500',
    text: 'text-orange-900',
    bannerTitle: 'Широкая Масленица!',
    bannerDescription: 'Блины, веселье и подарки всю неделю',
    bannerButton: 'Открыть календарь',
    particles: ['🥞', '☀️', '🔥', '✨'],
    animation: 'spring',
    defaultDays: 7
  },
  {
    key: 'easter',
    name: 'Пасха',
    emoji: '🐣',
    color: 'from-yellow-400 to-pink-400',
    gradient: 'from-yellow-400 via-pink-400 to-yellow-400',
    accent: 'bg-yellow-500',
    text: 'text-yellow-900',
    bannerTitle: 'Светлой Пасхи!',
    bannerDescription: 'Праздничные подарки в пасхальном календаре',
    bannerButton: 'Получить подарок',
    particles: ['🐣', '🥚', '🌷', '🌸', '✨'],
    animation: 'spring',
    defaultDays: 7
  },
  {
    key: 'may1',
    name: '1 Мая',
    emoji: '🌷',
    color: 'from-red-500 to-pink-500',
    gradient: 'from-red-500 via-pink-500 to-red-500',
    accent: 'bg-red-500',
    text: 'text-red-900',
    bannerTitle: 'С Праздником весны и труда!',
    bannerDescription: 'Подарки и сюрпризы в честь 1 Мая',
    bannerButton: 'Открыть календарь',
    particles: ['🌷', '🌹', '🌼', '✨'],
    animation: 'spring',
    defaultDays: 5
  },
  {
    key: 'may9',
    name: '9 Мая',
    emoji: '🎗️',
    color: 'from-orange-500 to-red-600',
    gradient: 'from-orange-500 via-red-600 to-orange-500',
    accent: 'bg-orange-600',
    text: 'text-orange-900',
    bannerTitle: 'С Днём Победы!',
    bannerDescription: 'Праздничный календарь к 9 Мая',
    bannerButton: 'Открыть календарь',
    particles: ['🎗️', '⭐', '🌹', '🕊️'],
    animation: 'military',
    defaultDays: 9
  },
  {
    key: 'june1',
    name: '1 Июня',
    emoji: '🧒',
    color: 'from-sky-400 to-yellow-400',
    gradient: 'from-sky-400 via-yellow-400 to-sky-400',
    accent: 'bg-sky-500',
    text: 'text-sky-900',
    bannerTitle: 'С Днём защиты детей!',
    bannerDescription: 'Подарки и радость для всей семьи',
    bannerButton: 'Получить подарок',
    particles: ['🎈', '🧸', '🎠', '🍭', '✨'],
    animation: 'spring',
    defaultDays: 5
  },
  {
    key: 'june12',
    name: '12 Июня',
    emoji: '🇷🇺',
    color: 'from-blue-500 to-red-500',
    gradient: 'from-white via-blue-500 to-red-500',
    accent: 'bg-blue-500',
    text: 'text-blue-900',
    bannerTitle: 'С Днём России!',
    bannerDescription: 'Праздничные подарки в честь Дня России',
    bannerButton: 'Открыть календарь',
    particles: ['🇷🇺', '⭐', '✨'],
    animation: 'spring',
    defaultDays: 5
  },
  {
    key: 'sept1',
    name: '1 Сентября',
    emoji: '📚',
    color: 'from-yellow-500 to-orange-500',
    gradient: 'from-yellow-500 via-orange-500 to-yellow-500',
    accent: 'bg-yellow-600',
    text: 'text-yellow-900',
    bannerTitle: 'С Днём знаний!',
    bannerDescription: 'Подарки школьникам и студентам',
    bannerButton: 'Открыть календарь',
    particles: ['📚', '✏️', '🎒', '🍎', '✨'],
    animation: 'spring',
    defaultDays: 7
  },
  {
    key: 'teachers_day',
    name: 'День учителя',
    emoji: '👩‍🏫',
    color: 'from-emerald-500 to-teal-500',
    gradient: 'from-emerald-500 via-teal-500 to-emerald-500',
    accent: 'bg-emerald-500',
    text: 'text-emerald-900',
    bannerTitle: 'С Днём учителя!',
    bannerDescription: 'Праздничный календарь к 5 октября',
    bannerButton: 'Получить подарок',
    particles: ['📖', '✏️', '🍎', '🌹', '✨'],
    animation: 'spring',
    defaultDays: 5
  },
  {
    key: 'mothers_day',
    name: 'День матери',
    emoji: '💐',
    color: 'from-fuchsia-500 to-pink-500',
    gradient: 'from-fuchsia-500 via-pink-500 to-fuchsia-500',
    accent: 'bg-fuchsia-500',
    text: 'text-fuchsia-900',
    bannerTitle: 'С Днём матери!',
    bannerDescription: 'Тёплые подарки для самых дорогих',
    bannerButton: 'Получить подарок',
    particles: ['💐', '🌷', '💖', '🌸', '✨'],
    animation: 'spring',
    defaultDays: 5
  },
  {
    key: 'fathers_day',
    name: 'День отца',
    emoji: '👨‍👧',
    color: 'from-indigo-500 to-blue-600',
    gradient: 'from-indigo-500 via-blue-600 to-indigo-500',
    accent: 'bg-indigo-500',
    text: 'text-indigo-900',
    bannerTitle: 'С Днём отца!',
    bannerDescription: 'Подарки самым лучшим папам',
    bannerButton: 'Получить подарок',
    particles: ['👔', '⭐', '🏆', '✨'],
    animation: 'military',
    defaultDays: 5
  },
  {
    key: 'national_unity',
    name: 'День народного единства',
    emoji: '🤝',
    color: 'from-red-500 to-blue-600',
    gradient: 'from-red-500 via-white to-blue-600',
    accent: 'bg-red-600',
    text: 'text-red-900',
    bannerTitle: 'С Днём народного единства!',
    bannerDescription: 'Праздничные подарки в честь 4 ноября',
    bannerButton: 'Открыть календарь',
    particles: ['🤝', '🇷🇺', '⭐', '✨'],
    animation: 'spring',
    defaultDays: 5
  },
  {
    key: 'halloween',
    name: 'Хэллоуин',
    emoji: '🎃',
    color: 'from-orange-600 to-purple-700',
    gradient: 'from-orange-600 via-purple-700 to-orange-600',
    accent: 'bg-orange-600',
    text: 'text-orange-900',
    bannerTitle: 'С Хэллоуином!',
    bannerDescription: 'Жуткие подарки в тыквенном календаре',
    bannerButton: 'Открыть календарь',
    particles: ['🎃', '👻', '🦇', '🕸️', '🕷️'],
    animation: 'spring',
    defaultDays: 7
  }
];

export const HOLIDAY_MAP: Record<HolidayKey, HolidayMeta> = HOLIDAY_LIST.reduce(
  (acc, h) => {
    acc[h.key] = h;
    return acc;
  },
  {} as Record<HolidayKey, HolidayMeta>
);

export const getHolidayMeta = (key: HolidayKey | null | undefined): HolidayMeta => {
  if (key && HOLIDAY_MAP[key]) return HOLIDAY_MAP[key];
  return HOLIDAY_MAP.feb23;
};
