import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AdminCodeVerificationProps {
  userId: number;
  userName: string;
  onVerify: (code: string) => void;
  onBack: () => void;
  error?: string;
}

const AdminCodeVerification = ({ userId, userName, onVerify, onBack, error }: AdminCodeVerificationProps) => {
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length === 6) {
      onVerify(code.trim());
    }
  };

  return (
    <div className="space-y-4 mt-6">
      <Alert>
        <Icon name="ShieldCheck" size={20} />
        <AlertDescription>
          Для входа в админ-панель отправлен одноразовый код. Проверьте почту.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="admin-code">Код из письма</Label>
          <Input
            id="admin-code"
            type="text"
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            className="text-center text-2xl tracking-widest font-mono"
            autoFocus
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Код действителен 10 минут
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <Icon name="AlertCircle" size={18} />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            <Icon name="ArrowLeft" size={18} className="mr-2" />
            Назад
          </Button>
          <Button type="submit" className="flex-1" disabled={code.length !== 6}>
            <Icon name="LogIn" size={18} className="mr-2" />
            Войти
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminCodeVerification;