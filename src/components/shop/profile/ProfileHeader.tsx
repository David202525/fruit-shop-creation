import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { User } from '@/types/shop';
import SBPTopUpDialog from '../SBPTopUpDialog';
import { logUserAction } from '@/utils/userLogger';

interface ProfileHeaderProps {
  user: User | null;
  siteSettings?: Record<string, unknown>;
  onShowAdminPanel: () => void;
  onUserUpdate: (updatedUser: User) => void;
}

const API_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const ProfileHeader = ({ user, siteSettings, onShowAdminPanel, onUserUpdate }: ProfileHeaderProps) => {
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [showTopUpDialog, setShowTopUpDialog] = useState(false);
  const [showEmailEdit, setShowEmailEdit] = useState(false);
  const [emailInput, setEmailInput] = useState(user?.email || '');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMsg, setEmailMsg] = useState('');

  const avatarEmojis = ['👤', '😊', '😎', '🤓', '🥳', '😇', '🤠', '🧑‍💻', '👨‍💼', '👩‍💼', '🦸', '🦹', '🧙', '🧛', '🧜', '🧚'];

  const handleSaveEmail = async () => {
    if (!user) return;
    setEmailLoading(true);
    setEmailMsg('');
    try {
      const response = await fetch(`${API_URL}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_email', user_id: user.id, email: emailInput.trim().toLowerCase() })
      });
      const data = await response.json();
      if (data.success) {
        const updatedUser = { ...user, email: emailInput.trim().toLowerCase() };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        onUserUpdate(updatedUser);
        setEmailMsg('Email сохранён');
        setShowEmailEdit(false);
      } else {
        setEmailMsg(data.error || 'Ошибка сохранения');
      }
    } catch {
      setEmailMsg('Ошибка сети');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleUpdateAvatar = async (avatar: string) => {
    if (!user) return;

    try {
      const response = await fetch(`${API_URL}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_avatar',
          user_id: user.id,
          avatar: avatar
        })
      });

      const data = await response.json();

      if (data.success) {
        await logUserAction(
          user.id,
          'profile_update',
          'Обновление аватара профиля',
          'user',
          user.id,
          { avatar }
        );
        const updatedUser = { ...user, avatar: data.avatar };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        onUserUpdate(updatedUser);
        setShowAvatarPicker(false);
      }
    } catch (error) {
      console.error('Error updating avatar:', error);
    }
  };

  return (
    <>
      <div className="text-center pb-3 sm:pb-4">
        <div 
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 mx-auto mb-2 sm:mb-3 flex items-center justify-center cursor-pointer active:scale-95 hover:bg-primary/20 transition-all relative group"
          onClick={() => setShowAvatarPicker(!showAvatarPicker)}
        >
          {user?.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('/')) ? (
            <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-3xl sm:text-4xl">{user?.avatar || '👤'}</span>
          )}
          <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Icon name="Camera" size={20} className="text-white sm:w-6 sm:h-6" />
          </div>
        </div>
        {showAvatarPicker && (
          <Card className="p-4 mb-4">
            <div className="space-y-3">
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                {avatarEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      handleUpdateAvatar(emoji);
                      setShowAvatarPicker(false);
                    }}
                    className="text-2xl sm:text-3xl active:scale-110 hover:scale-125 transition-transform cursor-pointer p-2 rounded hover:bg-accent"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <Separator />
              <div className="flex gap-2">
                <Input
                  placeholder="URL изображения"
                  value={customAvatarUrl}
                  onChange={(e) => setCustomAvatarUrl(e.target.value)}
                />
                <Button
                  size="sm"
                  onClick={() => {
                    if (customAvatarUrl) {
                      handleUpdateAvatar(customAvatarUrl);
                      setShowAvatarPicker(false);
                      setCustomAvatarUrl('');
                    }
                  }}
                >
                  OK
                </Button>
              </div>
            </div>
          </Card>
        )}
        <h3 className="text-lg sm:text-xl font-semibold break-words px-2">{user?.full_name || 'Пользователь'}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">{user?.phone}</p>
        <div className="mt-1">
          {!showEmailEdit ? (
            <button onClick={() => { setShowEmailEdit(true); setEmailInput(user?.email || ''); setEmailMsg(''); }} className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 mx-auto">
              <Icon name="Mail" size={12} />
              {user?.email ? user.email : <span className="underline">Добавить email для восстановления пароля</span>}
              <Icon name="Pencil" size={11} />
            </button>
          ) : (
            <div className="flex flex-col gap-1 px-2 mt-1">
              <div className="flex gap-1">
                <Input type="email" placeholder="example@mail.ru" value={emailInput} onChange={e => setEmailInput(e.target.value)} className="h-7 text-xs" disabled={emailLoading} />
                <Button size="sm" className="h-7 px-2 text-xs" onClick={handleSaveEmail} disabled={emailLoading}>OK</Button>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setShowEmailEdit(false)}>✕</Button>
              </div>
              {emailMsg && <p className="text-xs text-muted-foreground">{emailMsg}</p>}
            </div>
          )}
        </div>
        <Badge variant={user?.is_admin ? 'default' : 'secondary'} className="mt-2">
          {user?.is_admin ? (
            <span className="flex items-center gap-1">
              <span className="text-yellow-400">👑</span> 
              Администратор
            </span>
          ) : (
            'Пользователь'
          )}
        </Badge>
      </div>
      
      <Separator />
      
      <div className="bg-muted p-3 sm:p-4 rounded-lg space-y-1.5 sm:space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs sm:text-sm text-muted-foreground">Баланс:</span>
          <span className="text-base sm:text-lg font-bold">{user?.balance?.toFixed(2) || '0.00'}₽</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs sm:text-sm text-muted-foreground">Кэшбэк:</span>
          <span className="text-base sm:text-lg font-semibold text-green-600">{user?.cashback ? user.cashback.toFixed(0) : '0'}₽</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Кэшбэк {siteSettings?.balance_payment_cashback_percent || 5}% начисляется при оплате заказа балансом
        </p>
        
        <Button 
          className="w-full mt-3" 
          variant="default"
          onClick={() => setShowTopUpDialog(true)}
        >
          <Icon name="Wallet" size={16} className="mr-2" />
          Пополнить баланс
        </Button>
      </div>
      
      {user?.is_admin && (
        <>
          <Button className="w-full text-sm sm:text-base" variant="default" onClick={onShowAdminPanel}>
            <Icon name="Settings" size={16} className="mr-2 sm:w-[18px] sm:h-[18px]" />
            Панель администратора
          </Button>
          <Separator />
        </>
      )}

      <SBPTopUpDialog
        key={`sbp-dialog-${user?.id}`}
        open={showTopUpDialog}
        onOpenChange={setShowTopUpDialog}
        userId={user?.id || 0}
        userEmail={user?.email}
      />
    </>
  );
};

export default ProfileHeader;