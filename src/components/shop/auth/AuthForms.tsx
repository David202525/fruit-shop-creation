import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface AuthFormsProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>, action: 'login' | 'register') => void;
  handlePhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onForgotPassword: () => void;
}

const AuthForms = ({ onSubmit, handlePhoneChange, onForgotPassword }: AuthFormsProps) => {
  const location = useLocation();
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [promoCodeFromUrl, setPromoCodeFromUrl] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const refCode = params.get('ref');
    if (refCode) {
      setPromoCodeFromUrl(refCode.toUpperCase().trim());
    }
  }, [location]);

  const handleRegisterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!agreedToTerms || !agreedToPrivacy) {
      alert('Пожалуйста, примите все соглашения для продолжения регистрации');
      return;
    }
    onSubmit(e, 'register');
  };

  return (
    <Tabs defaultValue="login">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">Вход</TabsTrigger>
        <TabsTrigger value="register">Регистрация</TabsTrigger>
      </TabsList>
      <TabsContent value="login">
        <form onSubmit={(e) => onSubmit(e, 'login')} className="space-y-3" autoComplete="on">
          <div>
            <Label htmlFor="login-phone">Телефон</Label>
            <Input 
              id="login-phone" 
              name="phone" 
              type="tel" 
              placeholder="+7 (999) 123-45-67" 
              defaultValue="+7"
              onChange={handlePhoneChange}
              onFocus={(e) => {
                if (e.target.value === '') e.target.value = '+7';
              }}
              autoComplete="username"
              required 
            />
          </div>
          <div>
            <Label htmlFor="login-password">Пароль</Label>
            <Input id="login-password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <Button type="submit" className="w-full">Войти</Button>
          <Button 
            type="button" 
            variant="link" 
            className="w-full text-sm text-muted-foreground"
            onClick={onForgotPassword}
          >
            Забыли пароль?
          </Button>
        </form>
      </TabsContent>
      <TabsContent value="register">
        <form onSubmit={handleRegisterSubmit} className="space-y-3" autoComplete="on">
          <div>
            <Label htmlFor="register-phone">Телефон</Label>
            <Input 
              id="register-phone" 
              name="phone" 
              type="tel" 
              placeholder="+7 (999) 123-45-67" 
              defaultValue="+7"
              onChange={handlePhoneChange}
              onFocus={(e) => {
                if (e.target.value === '') e.target.value = '+7';
              }}
              autoComplete="username"
              required 
            />
          </div>
          <div>
            <Label htmlFor="register-name">Имя</Label>
            <Input id="register-name" name="full_name" placeholder="Иван Иванов" autoComplete="name" />
          </div>
          <div>
            <Label htmlFor="register-email">Email <span className="text-muted-foreground text-xs">(необязательно, для восстановления пароля)</span></Label>
            <Input id="register-email" name="email" type="email" placeholder="example@mail.ru" autoComplete="email" />
          </div>
          <div>
            <Label htmlFor="register-password">Пароль</Label>
            <Input id="register-password" name="password" type="password" autoComplete="new-password" required />
          </div>
          
          <div>
            <Label htmlFor="register-promo">Промокод (необязательно)</Label>
            <Input 
              id="register-promo" 
              name="promo_code" 
              placeholder="Введите промокод друга" 
              className="uppercase"
              maxLength={8}
              defaultValue={promoCodeFromUrl}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {promoCodeFromUrl ? `Промокод ${promoCodeFromUrl} применён автоматически` : 'Если у вас есть промокод от друга, введите его здесь'}
            </p>
          </div>
          
          <div className="space-y-3 pt-2">
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="terms" 
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
              />
              <label
                htmlFor="terms"
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Я принимаю{' '}
                <Link to="/terms" className="text-primary hover:underline" target="_blank">
                  пользовательское соглашение
                </Link>
              </label>
            </div>
            
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="privacy" 
                checked={agreedToPrivacy}
                onCheckedChange={(checked) => setAgreedToPrivacy(checked as boolean)}
              />
              <label
                htmlFor="privacy"
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Я согласен с{' '}
                <Link to="/privacy-policy" className="text-primary hover:underline" target="_blank">
                  политикой обработки персональных данных
                </Link>
              </label>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={!agreedToTerms || !agreedToPrivacy}
          >
            Зарегистрироваться
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );
};

export default AuthForms;