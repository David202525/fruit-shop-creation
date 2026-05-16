import { useToast } from '@/hooks/use-toast';
import { CartItem } from '@/types/shop';
import { logUserAction } from '@/utils/userLogger';

interface CheckoutParams {
  user: any;
  cart: CartItem[];
  getTotalPrice: () => number;
  clearCart: () => void;
  loadOrders: (user: any) => void;
  refreshUserBalance: (user: any, isRefreshingBalance: boolean, setIsRefreshingBalance: (value: boolean) => void, setUser: (user: any) => void) => void;
  isRefreshingBalance: boolean;
  setIsRefreshingBalance: (value: boolean) => void;
  setUser: (user: any) => void;
  setShowAuthDialog: (value: boolean) => void;
  siteSettings: any;
  API_ORDERS: string;
}

export const useCheckout = ({
  user,
  cart,
  getTotalPrice,
  clearCart,
  loadOrders,
  refreshUserBalance,
  isRefreshingBalance,
  setIsRefreshingBalance,
  setUser,
  setShowAuthDialog,
  siteSettings,
  API_ORDERS
}: CheckoutParams) => {
  const { toast } = useToast();

  const handleCheckout = async (
    paymentMethod: string,
    deliveryType: string = 'pickup',
    deliveryZoneId?: number,
    deliveryCity?: string,
    deliveryAddress?: string,
    customerEmail?: string
  ) => {
    if (!user) {
      toast({
        title: 'Требуется авторизация',
        description: 'Пожалуйста, войдите в аккаунт для оформления заказа',
        variant: 'destructive'
      });
      setShowAuthDialog(true);
      return;
    }

    if (cart.length === 0) {
      toast({
        title: 'Корзина пуста',
        description: 'Добавьте товары в корзину',
        variant: 'destructive'
      });
      return;
    }

    if (!deliveryCity?.trim()) {
      toast({
        title: 'Укажите город',
        description: 'Выберите город из списка',
        variant: 'destructive'
      });
      return;
    }

    if (paymentMethod === 'cash' && deliveryCity !== 'Барнаул') {
      toast({
        title: 'Оплата наличными недоступна',
        description: 'Оплата наличными доступна только для города Барнаул. Выберите другой способ оплаты.',
        variant: 'destructive'
      });
      return;
    }

    if (deliveryType === 'delivery' && !deliveryAddress?.trim()) {
      toast({
        title: 'Укажите адрес доставки',
        description: 'Для доставки необходимо указать адрес',
        variant: 'destructive'
      });
      return;
    }

    const basePrice = getTotalPrice();
    const isBarnaul = deliveryType === 'delivery' && deliveryCity === 'Барнаул';
    const isPreorder = siteSettings?.preorder_enabled === true;
    
    // Для Барнаула:
    // - Товары: 50% сейчас, 50% после обработки
    // - Доставка: 500₽ отдельным платежом
    let deliveryPrice = 0;
    if (isBarnaul && !isPreorder) {
      const freeDeliveryMin = parseFloat(siteSettings?.free_delivery_min || 0);
      const isFreeDelivery = freeDeliveryMin > 0 && basePrice >= freeDeliveryMin;
      if (!isFreeDelivery) {
        deliveryPrice = parseFloat(siteSettings?.delivery_price || 500);
      }
    }
    
    // Для Барнаула при предзаказе: доставка оплачивается отдельно (всегда 500₽)
    const fullTotalAmount = isPreorder && isBarnaul ? basePrice : basePrice + deliveryPrice;
    const totalAmount = isPreorder ? basePrice * 0.5 : fullTotalAmount;

    if (paymentMethod === 'balance') {
      if (!user.balance || user.balance < totalAmount) {
        toast({
          title: 'Недостаточно средств',
          description: isPreorder 
            ? `На балансе ${user.balance?.toFixed(2) || 0}₽, требуется ${totalAmount.toFixed(2)}₽ (50% предоплата)`
            : `На балансе ${user.balance?.toFixed(2) || 0}₽, требуется ${totalAmount.toFixed(2)}₽`,
          variant: 'destructive'
        });
        return;
      }
    }

    if (paymentMethod === 'card' || paymentMethod === 'alfabank') {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
        const response = await fetch(`${API_BASE}/alfabank-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: totalAmount,
            user_id: user.id,
            order_id: Date.now(),
            description: isPreorder 
              ? `Предзаказ (50% предоплата) - ${cart.length} товар${cart.length > 1 ? 'а' : ''}`
              : `Оплата заказа (${cart.length} товар${cart.length > 1 ? 'а' : ''})`,
            return_url: `${window.location.origin}/payment/success`
          })
        });

        const data = await response.json();

        if (data.success && data.payment_url) {
          const baseAddr = deliveryType === 'pickup'
            ? `Самовывоз: ${siteSettings?.address || 'Адрес не указан'}`
            : `Доставка: ${deliveryCity}, ${deliveryAddress}`;
          const fullDeliveryAddress = customerEmail ? `email:${customerEmail} | ${baseAddr}` : baseAddr;

          const orderResponse = await fetch(API_ORDERS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: user.id,
              items: cart.map(item => ({
                product_id: item.product.id,
                quantity: item.quantity,
                price: item.product.price
              })),
              payment_method: paymentMethod,
              delivery_address: fullDeliveryAddress,
              delivery_type: deliveryType,
              delivery_zone_id: deliveryZoneId,
              cashback_percent: siteSettings?.balance_payment_cashback_percent || 5,
              alfabank_order_id: data.order_id,
              is_preorder: isPreorder,
              total_amount: totalAmount,
              full_order_amount: fullTotalAmount
            })
          });

          const orderData = await orderResponse.json();

          if (orderData.success) {
            clearCart();
            window.location.href = data.payment_url;
          } else {
            toast({
              title: 'Ошибка',
              description: orderData.error || 'Не удалось оформить заказ',
              variant: 'destructive'
            });
          }
        } else {
          toast({
            title: 'Ошибка',
            description: data.error || data.message || 'Не удалось создать платёж',
            variant: 'destructive'
          });
        }
      } catch (error) {
        toast({
          title: 'Ошибка',
          description: 'Не удалось создать платёж',
          variant: 'destructive'
        });
      }
      return;
    }

    try {
      const baseAddr2 = deliveryType === 'pickup'
        ? `Самовывоз: ${siteSettings?.address || 'Адрес не указан'}`
        : `Доставка: ${deliveryCity}, ${deliveryAddress}`;
      const fullDeliveryAddress = customerEmail ? `email:${customerEmail} | ${baseAddr2}` : baseAddr2;

      const response = await fetch(API_ORDERS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          items: cart.map(item => ({
            product_id: item.product.id,
            quantity: item.quantity,
            price: item.product.price
          })),
          payment_method: paymentMethod,
          delivery_address: fullDeliveryAddress,
          delivery_type: deliveryType,
          delivery_zone_id: deliveryZoneId,
          cashback_percent: siteSettings?.balance_payment_cashback_percent || 5,
          is_preorder: isPreorder,
          total_amount: totalAmount,
          full_order_amount: fullTotalAmount
        })
      });

      const data = await response.json();

      if (data.success) {
        await logUserAction(
          user.id,
          'order_create',
          `Создание заказа #${data.order_id}`,
          'order',
          data.order_id,
          {
            payment_method: paymentMethod,
            delivery_type: deliveryType,
            total_amount: totalAmount,
            is_preorder: isPreorder,
            items_count: cart.length
          }
        );
        
        try {
          await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'send_telegram_order_notification',
              orderId: data.order_id,
              userName: user.name || 'Не указано',
              userPhone: user.phone || 'Не указано',
              totalPrice: totalAmount,
              paymentMethod: paymentMethod,
              deliveryType: deliveryType,
              items: cart.map(item => ({ name: item.product.name }))
            })
          });
        } catch (e) {
          console.error('Telegram notification failed:', e);
        }
        
        const orderMessage = isPreorder
          ? paymentMethod === 'balance'
            ? `Заказ #${data.order_id}. Оплачена предоплата 50% товаров (${totalAmount.toFixed(2)}₽). Доставка оплачивается отдельно. Кэшбэк ${siteSettings?.balance_payment_cashback_percent || 5}%!`
            : `Заказ #${data.order_id}. Предзаказ оформлен! Оплачена предоплата 50% товаров (${totalAmount.toFixed(2)}₽). Доставка оплачивается отдельно.`
          : paymentMethod === 'balance'
            ? `Заказ #${data.order_id}. Оплачено полностью ${totalAmount.toFixed(2)}₽. Начислен кэшбэк ${siteSettings?.balance_payment_cashback_percent || 5}%!`
            : `Заказ #${data.order_id}. Оплачено полностью ${totalAmount.toFixed(2)}₽`;
        
        toast({
          title: 'Заказ оформлен!',
          description: orderMessage
        });
        clearCart();
        loadOrders(user, true);

        if (paymentMethod === 'balance') {
          setTimeout(() => refreshUserBalance(user, isRefreshingBalance, setIsRefreshingBalance, setUser), 500);
        }
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось оформить заказ',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось оформить заказ',
        variant: 'destructive'
      });
    }
  };

  return { handleCheckout };
};