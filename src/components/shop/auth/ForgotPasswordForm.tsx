import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Icon from '@/components/ui/icon';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

const API_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const ForgotPasswordForm = ({ onBack }: ForgotPasswordFormProps) => {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (!value.startsWith('+7')) {
      value = '+7' + value.replace(/^\+?7?/, '');
    }
    value = value.replace(/[^\d+]/g, '');
    if (value.length > 12) value = value.slice(0, 12);
    setPhone(value);
    e.target.value = value;
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'forgot_password', phone })
      });

      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || 'Ошибка запроса');

      setSuccess(data.message || 'Код отправлен на вашу почту');
      setStep('reset');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при отправке запроса');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_password', phone, code, new_password: newPassword })
      });

      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || 'Ошибка сброса пароля');

      setSuccess('Пароль успешно изменён! Теперь вы можете войти.');
      setTimeout(() => onBack(), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при сбросе пароля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-2">
        <Icon name="ArrowLeft" size={16} className="mr-2" />
        Назад к входу
      </Button>

      {error && (
        <Alert variant="destructive">
          <Icon name="AlertCircle" size={16} />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 text-green-700 dark:text-green-400">
          <Icon name="CheckCircle" size={16} />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {step === 'request' ? (
        <form onSubmit={handleRequestReset} className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Восстановление пароля</h3>
            <p className="text-sm text-muted-foreground">
              Укажите номер телефона. Код для сброса пароля придёт на привязанный email.
            </p>
          </div>

          <div>
            <Label htmlFor="forgot-phone">Телефон</Label>
            <Input
              id="forgot-phone"
              type="tel"
              placeholder="+7 (999) 123-45-67"
              value={phone}
              onChange={handlePhoneChange}
              onFocus={(e) => { if (e.target.value === '') e.target.value = '+7'; }}
              required
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Отправка...' : 'Отправить код'}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Введите код и новый пароль</h3>
            <p className="text-sm text-muted-foreground">
              Код восстановления отправлен на ваш email. Действителен 15 минут.
            </p>
          </div>

          <div>
            <Label htmlFor="reset-code">Код из письма</Label>
            <Input
              id="reset-code"
              type="text"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="new-password">Новый пароль</Label>
            <Input
              id="new-password"
              type="password"
              placeholder="Введите новый пароль"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Сохранение...' : 'Изменить пароль'}
          </Button>

          <Button type="button" variant="link" className="w-full text-sm" onClick={() => setStep('request')}>
            Запросить код повторно
          </Button>
        </form>
      )}
    </div>
  );
};

export default ForgotPasswordForm;