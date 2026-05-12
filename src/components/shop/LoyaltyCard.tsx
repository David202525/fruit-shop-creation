import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { logUserAction } from '@/utils/userLogger';

const API_LOYALTY = 'https://functions.poehali.dev/87c6f94e-2ca8-4eb7-a7de-a98cec1dd03c';

interface LoyaltyCardProps {
  userId: number;
  userBalance: number;
  onBalanceUpdate: () => void;
}

interface LoyaltyCardData {
  id: number;
  card_number: string;
  qr_code: string;
  activated_at: string;
  expires_at?: string;
}

const LoyaltyCard = ({ userId, userBalance, onBalanceUpdate }: LoyaltyCardProps) => {
  const { toast } = useToast();
  const [card, setCard] = useState<LoyaltyCardData | null>(null);
  const [cardPrice, setCardPrice] = useState<number>(500);
  const [unlockAmount, setUnlockAmount] = useState<number>(5000);
  const [cashbackPercent, setCashbackPercent] = useState<number>(5);
  const [totalSpent, setTotalSpent] = useState<number>(0);
  const [canUnlock, setCanUnlock] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  const loadCard = async () => {
    try {
      const response = await fetch(API_LOYALTY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'loyalty_get', user_id: userId })
      });
      const data = await response.json();
      setCard(data.card);
      setCardPrice(data.card_price || 500);
      setUnlockAmount(data.unlock_amount || 5000);
      setCashbackPercent(data.cashback_percent || 5);
      setTotalSpent(data.total_spent || 0);
      setCanUnlock(data.can_unlock || false);
    } catch (error) {
      console.error('Failed to load loyalty card:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCard();
  }, [userId]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadCard();
    }, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  const handlePurchase = async (unlockFree = false) => {
    if (!unlockFree && userBalance < cardPrice) {
      toast({
        title: 'Недостаточно средств',
        description: `На балансе ${userBalance.toFixed(2)}₽, требуется ${cardPrice}₽`,
        variant: 'destructive'
      });
      return;
    }

    setIsPurchasing(true);
    try {
      const response = await fetch(API_LOYALTY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'loyalty_purchase', user_id: userId, unlock_free: unlockFree })
      });

      const data = await response.json();

      if (data.success) {
        await logUserAction(
          userId,
          'loyalty_card_purchase',
          unlockFree ? 'Разблокировка карты лояльности за сумму покупок' : `Покупка карты лояльности за ${cardPrice}₽`,
          'loyalty_card',
          data.card.id,
          { unlock_free: unlockFree, price: unlockFree ? 0 : cardPrice }
        );
        setCard(data.card);
        onBalanceUpdate();
        toast({
          title: unlockFree ? 'Карта разблокирована!' : 'Карта куплена!',
          description: unlockFree 
            ? 'Карта лояльности разблокирована за сумму покупок'
            : 'Виртуальная карта лояльности активирована'
        });
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось купить карту',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось купить карту',
        variant: 'destructive'
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-48 bg-muted rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!card) {
    return (
      <Card className="w-full border-2 border-dashed">
        <CardContent className="p-6 space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Icon name="CreditCard" size={32} className="text-primary" />
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Карта лояльности</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Кэшбэк {cashbackPercent}% с каждой покупки
              </p>
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2 text-left">
                  <Icon name="Info" size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    <strong>Условия начисления кэшбэка:</strong> кэшбэк начисляется только при оплате заказа с баланса сайта. При других способах оплаты кэшбэк не начисляется.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Купить сейчас</span>
                <span className="text-2xl font-bold text-primary">{cardPrice}₽</span>
              </div>
              <Button 
                onClick={() => handlePurchase(false)} 
                disabled={isPurchasing || userBalance < cardPrice}
                className="w-full"
              >
                {isPurchasing ? (
                  <>Покупка...</>
                ) : (
                  <>
                    <Icon name="ShoppingBag" size={18} className="mr-2" />
                    Купить карту
                  </>
                )}
              </Button>
              {userBalance < cardPrice && (
                <p className="text-xs text-destructive text-center">
                  Недостаточно средств на балансе
                </p>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">или</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Разблокировать за покупки</span>
                <span className="text-lg font-bold text-green-600">{unlockAmount}₽</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Прогресс</span>
                  <span>{totalSpent.toFixed(0)} / {unlockAmount}₽</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${Math.min((totalSpent / unlockAmount) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <Button 
                onClick={() => handlePurchase(true)} 
                disabled={isPurchasing || !canUnlock}
                variant={canUnlock ? "default" : "outline"}
                className="w-full"
              >
                {canUnlock ? (
                  <>
                    <Icon name="Gift" size={18} className="mr-2" />
                    Получить бесплатно
                  </>
                ) : (
                  <>
                    <Icon name="Lock" size={18} className="mr-2" />
                    Заблокирована
                  </>
                )}
              </Button>
              {!canUnlock && (
                <p className="text-xs text-center text-muted-foreground">
                  Осталось купить на {(unlockAmount - totalSpent).toFixed(0)}₽
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative">
      <div className="relative bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-2xl overflow-hidden transition-all duration-300 hover:shadow-3xl hover:scale-[1.02]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdjJoLTYweiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuMDUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjYSkiLz48L3N2Zz4=')] opacity-30"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-yellow-300/20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6 sm:mb-8 gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs opacity-90 uppercase tracking-wider font-semibold">Карта лояльности</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-base sm:text-2xl font-bold tracking-wide break-all">{card.card_number}</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(card.card_number);
                    toast({
                      title: 'Скопировано!',
                      description: 'Номер карты скопирован в буфер обмена'
                    });
                  }}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-1.5 sm:p-2 transition-all flex-shrink-0"
                  title="Скопировать номер карты"
                >
                  <Icon name="Copy" size={16} className="sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-1.5 sm:p-2 flex-shrink-0">
              <Icon name="Sparkles" size={24} className="text-yellow-300 sm:w-7 sm:h-7" />
            </div>
          </div>
          
          <div 
            className="bg-white/20 backdrop-blur-md rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center justify-center mb-4 sm:mb-6 shadow-lg cursor-pointer hover:bg-white/30 transition-all"
            onClick={() => setShowQRModal(true)}
          >
            <div className="bg-white p-2 sm:p-3 rounded-lg shadow-inner">
              <QRCodeSVG 
                value={card.qr_code} 
                size={window.innerWidth < 640 ? 100 : 120}
                level="H"
                includeMargin={false}
              />
            </div>
          </div>
          <p className="text-center text-xs opacity-80 -mt-3 mb-4">Нажмите для увеличения</p>

          <div className="space-y-2 sm:space-y-3">
            <div className="flex justify-between items-end gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs opacity-90 font-medium">Активирована</p>
                <p className="text-xs sm:text-sm font-bold">
                  {card.activated_at 
                    ? new Date(card.activated_at).toLocaleDateString('ru-RU')
                    : 'Дата не указана'
                  }
                </p>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 bg-white/20 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full flex-shrink-0">
                <Icon name="CheckCircle2" size={16} className="text-green-300 sm:w-[18px] sm:h-[18px]" />
                <span className="text-xs sm:text-sm font-bold">Активна</span>
              </div>
            </div>
            {card.expires_at && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 flex items-center gap-2">
                <Icon name="Calendar" size={14} className="text-yellow-300 flex-shrink-0 sm:w-4 sm:h-4" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs opacity-90">Действительна до</p>
                  <p className="text-xs sm:text-sm font-bold">
                    {new Date(card.expires_at).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/30 dark:via-green-950/20 dark:to-teal-950/30 rounded-lg sm:rounded-xl border-2 border-emerald-200 dark:border-emerald-800 shadow-md">
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <div className="bg-emerald-500 p-1 sm:p-1.5 rounded-lg flex-shrink-0">
            <Icon name="Percent" size={14} className="text-white sm:w-4 sm:h-4" />
          </div>
          <p className="text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-100">
            Кэшбэк {cashbackPercent}% от покупки
          </p>
        </div>
        <div className="pl-7 sm:pl-8">
          <div className="p-2 sm:p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Icon name="Info" size={14} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] sm:text-xs text-blue-800 dark:text-blue-200">
                <strong>Условия начисления:</strong> кэшбэк начисляется только при оплате заказа с баланса сайта. При других способах оплаты кэшбэк не начисляется.
              </p>
            </div>
          </div>
        </div>
        <p className="text-[11px] sm:text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
          Предъявите QR-код при покупке от 100₽ и получайте кэшбэк на счет
        </p>
      </div>

      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">QR-код карты лояльности</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 p-4">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <QRCodeSVG 
                value={card.qr_code} 
                size={280}
                level="H"
                includeMargin={false}
              />
            </div>
            <div className="text-center space-y-1">
              <p className="font-bold text-lg">{card.card_number}</p>
              <p className="text-sm text-muted-foreground">Предъявите QR-код на кассе</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoyaltyCard;