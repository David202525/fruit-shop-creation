import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const API_SETTINGS = 'https://functions.poehali.dev/9b1ac59e-93b6-41de-8974-a7f58d4ffaf9';

interface ResponseTimerSettingsProps {
  warningSeconds: number;
  dangerSeconds: number;
  onSaved: (warning: number, danger: number) => void;
}

export default function ResponseTimerSettings({
  warningSeconds,
  dangerSeconds,
  onSaved,
}: ResponseTimerSettingsProps) {
  const { toast } = useToast();
  const [warning, setWarning] = useState(String(warningSeconds));
  const [danger, setDanger] = useState(String(dangerSeconds));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const w = parseInt(warning, 10);
    const d = parseInt(danger, 10);

    if (!w || w < 5 || !d || d < 5) {
      toast({
        title: 'Неверные значения',
        description: 'Минимум 5 секунд для каждого порога',
        variant: 'destructive',
      });
      return;
    }
    if (d <= w) {
      toast({
        title: 'Неверные значения',
        description: 'Красный таймер должен быть больше жёлтого',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(API_SETTINGS, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_response_warning_seconds: w,
          chat_response_danger_seconds: d,
        }),
      });

      if (!response.ok) throw new Error('save failed');

      onSaved(w, d);
      toast({ title: 'Настройки таймера сохранены' });
    } catch {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить настройки',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Icon name="Timer" size={18} />
          Таймер ответа администратора
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Настройка времени, через которое таймер ответа становится жёлтым (предупреждение) и красным (срочно). Изменять может только главный администратор.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-sm">Жёлтый (секунд)</Label>
            <Input
              type="number"
              min={5}
              value={warning}
              onChange={(e) => setWarning(e.target.value)}
              placeholder="60"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Красный (секунд)</Label>
            <Input
              type="number"
              min={5}
              value={danger}
              onChange={(e) => setDanger(e.target.value)}
              placeholder="180"
            />
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} size="sm">
          <Icon name="Save" size={14} className="mr-2" />
          {saving ? 'Сохраняем...' : 'Сохранить'}
        </Button>
      </CardContent>
    </Card>
  );
}
