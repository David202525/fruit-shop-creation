import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { User } from '@/types/shop';

interface PaymentMethodsProps {
  user: User | null;
  selectedCity: string;
  isCashPaymentAvailable: boolean;
  preorderEnabled: boolean;
  finalPrice: number;
  totalPrice: number;
  deliveryType: string;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  deliveryAddress: string;
  selectedZoneId: number | null;
  deliveryCity: string;
  onCheckout: (paymentMethod: string, deliveryType: string, deliveryZoneId?: number, city?: string, address?: string) => void | Promise<void>;
}

export const PaymentMethods = ({
  user,
  selectedCity,
  isCashPaymentAvailable,
  preorderEnabled,
  finalPrice,
  totalPrice,
  deliveryType,
  deliveryEnabled,
  pickupEnabled,
  deliveryAddress,
  selectedZoneId,
  deliveryCity,
  onCheckout
}: PaymentMethodsProps) => {
  const [loadingMethod, setLoadingMethod] = useState<string | null>(null);

  const handleClick = async (method: string) => {
    if (loadingMethod) return;
    setLoadingMethod(method);
    try {
      await onCheckout(method, deliveryType, selectedZoneId || undefined, deliveryCity, deliveryAddress);
    } finally {
      // Сбросим состояние через 800мс чтобы успел произойти редирект на платёжный шлюз
      setTimeout(() => setLoadingMethod(null), 800);
    }
  };
  if (!selectedCity) {
    return (
      <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
        <p className="text-sm text-yellow-900 dark:text-yellow-100">
          Сначала выберите город доставки
        </p>
      </div>
    );
  }

  const isDisabled = !pickupEnabled && !deliveryEnabled || (deliveryType === 'delivery' && !deliveryAddress.trim());

  return (
    <div className="space-y-2">
      {user && (
        <Button
          onClick={() => handleClick('balance')}
          variant="outline"
          className="w-full justify-start h-auto py-3 sm:py-4 min-h-[52px] border-2 group hover:bg-gradient-to-r hover:from-green-600 hover:to-green-500 hover:border-green-600 hover:text-white hover:shadow-lg transition-all duration-300"
          disabled={isDisabled || !!loadingMethod}
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-100 group-hover:bg-white/20 flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0 transition-colors duration-300">
            {loadingMethod === 'balance' ? (
              <Icon name="Loader2" size={18} className="text-blue-600 group-hover:text-white animate-spin" />
            ) : (
              <Icon name="Wallet" size={18} className="text-blue-600 group-hover:text-white" />
            )}
          </div>
          <div className="text-left flex-1 min-w-0">
            <div className="font-semibold text-sm sm:text-base group-hover:text-white">
              {loadingMethod === 'balance' ? 'Оформляем заказ...' : 'Балансом сайта'}
            </div>
            <div className="text-xs text-foreground/70 group-hover:text-white/90 mt-0.5 break-words">
              {preorderEnabled
                ? `Предоплата: ${(totalPrice * 0.5).toFixed(2)} ₽ (баланс: ${user.balance} ₽)`
                : `Ваш баланс: ${user.balance} ₽`}
            </div>
          </div>
        </Button>
      )}
      
      <Button
        onClick={() => handleClick('card')}
        variant="outline"
        className="w-full justify-start h-auto py-3 sm:py-4 min-h-[52px] border-2 group hover:bg-gradient-to-r hover:from-green-600 hover:to-green-500 hover:border-green-600 hover:text-white hover:shadow-lg transition-all duration-300"
        disabled={isDisabled || !!loadingMethod}
      >
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-green-100 group-hover:bg-white/20 flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0 transition-colors duration-300">
          {loadingMethod === 'card' ? (
            <Icon name="Loader2" size={18} className="text-green-600 group-hover:text-white animate-spin" />
          ) : (
            <Icon name="CreditCard" size={18} className="text-green-600 group-hover:text-white" />
          )}
        </div>
        <div className="text-left flex-1 min-w-0">
          <div className="font-semibold text-sm sm:text-base group-hover:text-white">
            {loadingMethod === 'card' ? 'Готовим оплату...' : 'Банковская карта'}
          </div>
          <div className="text-xs text-foreground/70 group-hover:text-white/90 mt-0.5 break-words">
            {loadingMethod === 'card'
              ? 'Перенаправляем на Альфабанк, не закрывайте страницу'
              : preorderEnabled
                ? `Предоплата: ${(totalPrice * 0.5).toFixed(2)} ₽`
                : 'Оплата через Альфабанк'}
          </div>
        </div>
      </Button>

      {isCashPaymentAvailable && (
        <Button
          onClick={() => handleClick('cash')}
          variant="outline"
          className="w-full justify-start h-auto py-3 sm:py-4 min-h-[52px] border-2 group hover:bg-gradient-to-r hover:from-green-600 hover:to-green-500 hover:border-green-600 hover:text-white hover:shadow-lg transition-all duration-300"
          disabled={isDisabled || !!loadingMethod}
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-amber-100 group-hover:bg-white/20 flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0 transition-colors duration-300">
            <Icon name="Banknote" size={18} className="text-amber-600 group-hover:text-white" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <div className="font-semibold text-sm sm:text-base group-hover:text-white">Наличными</div>
            <div className="text-xs text-foreground/70 group-hover:text-white/90 mt-0.5 break-words">
              {preorderEnabled
                ? `Предоплата ${(totalPrice * 0.5).toFixed(2)} ₽ картой, вторая часть после обработки`
                : 'Оплата курьеру или в пункте выдачи'}
            </div>
          </div>
        </Button>
      )}

      <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t">
        <div className="bg-muted/30 rounded-lg p-3 text-center space-y-1">
          <p className="text-xs font-semibold text-foreground">ИП Бояринцев Вадим Вячеславович</p>
          <p className="text-xs text-muted-foreground">ИНН: 222261894107</p>
        </div>
      </div>
    </div>
  );
};