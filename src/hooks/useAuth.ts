import { useState, useEffect } from 'react';
import { User } from '@/types/shop';
import { logUserAction } from '@/utils/userLogger';

const API_AUTH = 'https://functions.poehali.dev/2cc7c24d-08b2-4c44-a9a7-8d09198dbefc';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);
  const [banInfo, setBanInfo] = useState<{banned: boolean; ban_reason?: string; ban_until?: string} | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      localStorage.setItem('userId', parsedUser.id.toString());
    }
  }, []);

  useEffect(() => {
    const syncUserData = async () => {
      if (!user?.id) return;
      
      try {
        const [balanceResponse, banResponse] = await Promise.all([
          fetch(`${API_AUTH}?action=balance&user_id=${user.id}`, { 
            signal: AbortSignal.timeout(5000)
          }).catch(() => null),
          fetch(`${API_AUTH}?action=ban_status&user_id=${user.id}`, { 
            signal: AbortSignal.timeout(5000)
          }).catch(() => null)
        ]);
        
        const balanceData = balanceResponse ? await balanceResponse.json().catch(() => ({})) : {};
        const banData = banResponse ? await banResponse.json().catch(() => ({})) : {};
        
        if (banData.banned) {
          setBanInfo({
            banned: true,
            ban_reason: banData.ban_reason,
            ban_until: banData.ban_until
          });
          setUser(null);
          localStorage.removeItem('user');
          localStorage.removeItem('userId');
          return;
        } else if (banInfo?.banned) {
          setBanInfo(null);
        }
        
        if (balanceData.balance !== undefined) {
          setUser(prev => {
            if (!prev) return prev;
            const updatedUser = {
              ...prev,
              balance: balanceData.balance,
              cashback: balanceData.cashback,
              is_admin: balanceData.is_admin
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            localStorage.setItem('userId', updatedUser.id.toString());
            return updatedUser;
          });
        }
      } catch (error) {
        // Тихо игнорируем ошибки синхронизации - не критично для работы сайта
      }
    };

    const interval = setInterval(syncUserData, 10000);
    if (user?.id) {
      syncUserData();
    }

    return () => clearInterval(interval);
  }, [user?.id]);

  const handleAuth = async (
    e: React.FormEvent<HTMLFormElement>, 
    action: 'login' | 'register',
    onSuccess: (user: User, message: string, requiresCode?: boolean) => void,
    onError: (error: string) => void
  ) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const phone = formData.get('phone');
      const password = formData.get('password');
      const promoCode = action === 'register' ? formData.get('promo_code') : null;
      

      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(API_AUTH, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        body: JSON.stringify({
          action,
          phone,
          password,
          full_name: formData.get('full_name') || '',
          promo_code: promoCode || null
        })
      });
      
      clearTimeout(timeoutId);
      
      const data = await response.json();

      
      if (data.banned) {
        setBanInfo({
          banned: true,
          ban_reason: data.ban_reason,
          ban_until: data.ban_until
        });
        onError(data.ban_reason || 'Аккаунт заблокирован');
        return;
      }
      
      if (!response.ok) {
        let errorMsg = data.error;
        if (response.status === 402) {
          errorMsg = 'Сервис временно недоступен. Попробуйте позже';
        } else if (response.status === 500) {
          errorMsg = data.error || 'Ошибка сервера. Попробуйте позже';
        } else if (response.status === 0) {
          errorMsg = 'Не удалось подключиться. Проверьте интернет';
        } else {
          errorMsg = errorMsg || `Ошибка ${response.status}`;
        }

        onError(errorMsg);
        return;
      }
      
      if (data.requires_code) {
        const message = 'Введите код доступа';
        onSuccess(data.user, message, true);
        setBanInfo(null);
      } else if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('userId', data.user.id.toString());
        
        await logUserAction(
          data.user.id,
          action === 'login' ? 'auth_login' : 'auth_register',
          action === 'login' ? 'Вход в систему' : 'Регистрация нового аккаунта',
          undefined,
          undefined,
          { phone: data.user.phone }
        );
        

        
        const message = action === 'login' ? 'Вы вошли в систему' : 'Регистрация успешна';
        onSuccess(data.user, message, false);
        setBanInfo(null);
      } else {
        const errorMsg = data.error || 'Неизвестная ошибка. Проверьте данные';

        onError(errorMsg);
      }
    } catch (error) {
      console.error('Auth exception:', error);
      let errorMessage = 'Не удалось подключиться к серверу';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Превышено время ожидания. Попробуйте ещё раз';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Ошибка соединения. Проверьте интернет или попробуйте позже';
        } else {
          errorMessage = `Ошибка: ${error.message}`;
        }
      }
      
      onError(errorMessage);
    }
  };

  const handleDirectLogin = async (
    phone: string,
    password: string,
    onSuccess: (user: User, message: string, requiresCode?: boolean) => void,
    onError: (error: string) => void,
    skipAdminCode: boolean = false
  ) => {
    try {

      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(API_AUTH, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        body: JSON.stringify({
          action: 'login',
          phone,
          password,
          skip_admin_code: skipAdminCode
        })
      });
      
      clearTimeout(timeoutId);
      
      const data = await response.json();

      
      if (data.banned) {
        setBanInfo({
          banned: true,
          ban_reason: data.ban_reason,
          ban_until: data.ban_until
        });
        onError(data.ban_reason || 'Аккаунт заблокирован');
        return;
      }
      
      if (!response.ok) {
        let errorMsg = data.error;
        if (response.status === 402) {
          errorMsg = 'Сервис временно недоступен. Попробуйте позже';
        } else if (response.status === 500) {
          errorMsg = data.error || 'Ошибка сервера. Попробуйте позже';
        } else if (response.status === 0) {
          errorMsg = 'Не удалось подключиться. Проверьте интернет';
        } else {
          errorMsg = errorMsg || `Ошибка ${response.status}`;
        }

        onError(errorMsg);
        return;
      }
      
      if (data.requires_code) {
        const message = 'Введите код доступа';
        onSuccess(data.user, message, true);
        setBanInfo(null);
      } else if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('userId', data.user.id.toString());
        const message = 'Вы вошли в систему';
        onSuccess(data.user, message, false);
        setBanInfo(null);
      } else {
        const errorMsg = data.error || 'Неизвестная ошибка. Проверьте данные';
        console.error('Direct login error:', errorMsg, data);
        onError(errorMsg);
      }
    } catch (error) {
      console.error('Direct login exception:', error);
      let errorMessage = 'Не удалось подключиться к серверу';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Превышено время ожидания. Попробуйте ещё раз';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Ошибка соединения. Проверьте интернет или попробуйте позже';
        } else {
          errorMessage = `Ошибка: ${error.message}`;
        }
      }
      
      onError(errorMessage);
    }
  };

  const handleLogout = async (onLogout: () => void) => {
    if (user?.id) {
      await logUserAction(
        user.id,
        'auth_logout',
        'Выход из системы',
        undefined,
        undefined,
        { phone: user.phone }
      );
    }
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    onLogout();
  };

  const clearBanInfo = () => {
    setBanInfo(null);
  };

  return {
    user,
    setUser,
    isRefreshingBalance,
    setIsRefreshingBalance,
    handleAuth,
    handleDirectLogin,
    handleLogout,
    banInfo,
    clearBanInfo
  };
};