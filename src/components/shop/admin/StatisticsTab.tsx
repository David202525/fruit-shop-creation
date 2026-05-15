import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { formatDate } from '@/lib/dateUtils';

const API_STATISTICS = 'https://functions.poehali.dev/5417d2b2-c525-4686-856d-577e2d90240c';

interface DailyStats {
  date: string;
  visits: number;
  unique_visitors: number;
}

interface PlatformStats {
  platform: string;
  count: number;
}

interface BrowserStats {
  browser: string;
  count: number;
}

interface RefererStats {
  source: string;
  count: number;
}

interface Statistics {
  daily: DailyStats[];
  platforms: PlatformStats[];
  browsers: BrowserStats[];
  referers: RefererStats[];
}

export default function StatisticsTab() {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await fetch(`${API_STATISTICS}?action=stats`);
        const data = await response.json();
        if (data.daily) setStatistics(data);
      } catch (error) {
        console.error('Failed to fetch statistics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Статистика посещений</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Загрузка...</div>
        </CardContent>
      </Card>
    );
  }

  if (!statistics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Статистика посещений</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Не удалось загрузить статистику
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalVisits = statistics.daily.reduce((sum, day) => sum + day.visits, 0);
  const totalUnique = Math.max(...statistics.daily.map(day => day.unique_visitors), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего визитов (7 дней)</CardTitle>
            <Icon name="TrendingUp" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVisits}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Уникальных посетителей</CardTitle>
            <Icon name="Users" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUnique}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ежедневная статистика</CardTitle>
          <CardDescription>За последние 7 дней</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {statistics.daily.map((day) => (
              <div key={day.date} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm font-medium">
                  {formatDate(day.date, { day: 'numeric', month: 'long' })}
                </span>
                <div className="flex gap-4">
                  <span className="text-sm text-muted-foreground">
                    Визитов: <strong>{day.visits}</strong>
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Уникальных: <strong>{day.unique_visitors}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>По платформам</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {statistics.platforms.map((platform) => (
                <div key={platform.platform} className="flex items-center justify-between py-1">
                  <span className="text-sm">{platform.platform}</span>
                  <span className="text-sm font-medium">{platform.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>По браузерам</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {statistics.browsers.map((browser) => (
                <div key={browser.browser} className="flex items-center justify-between py-1">
                  <span className="text-sm">{browser.browser}</span>
                  <span className="text-sm font-medium">{browser.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Источники переходов</CardTitle>
          <CardDescription>Топ-10 источников трафика</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {statistics.referers.map((referer, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm truncate max-w-[70%]">{referer.source}</span>
                <span className="text-sm font-medium">{referer.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}