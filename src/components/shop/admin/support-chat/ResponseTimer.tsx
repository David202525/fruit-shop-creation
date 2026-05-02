import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';

interface ResponseTimerProps {
  lastUserMessageAt: string | null;
  warningSeconds: number;
  dangerSeconds: number;
}

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s} сек`;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function ResponseTimer({
  lastUserMessageAt,
  warningSeconds,
  dangerSeconds,
}: ResponseTimerProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!lastUserMessageAt) return null;

  const startMs = new Date(lastUserMessageAt).getTime();
  if (isNaN(startMs)) return null;

  const elapsed = Math.max(0, Math.floor((now - startMs) / 1000));

  let bg = 'bg-green-100 text-green-800 border-green-300';
  let icon = 'Timer';
  if (elapsed >= dangerSeconds) {
    bg = 'bg-red-100 text-red-800 border-red-400 animate-pulse';
    icon = 'AlarmClock';
  } else if (elapsed >= warningSeconds) {
    bg = 'bg-yellow-100 text-yellow-800 border-yellow-400';
    icon = 'Clock';
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs sm:text-sm font-semibold ${bg}`}
      title="Время ожидания ответа клиента"
    >
      <Icon name={icon} size={14} />
      <span>{formatTime(elapsed)}</span>
    </div>
  );
}
