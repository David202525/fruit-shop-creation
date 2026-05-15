import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { logUserAction } from '@/utils/userLogger';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const API_ORDERS = `${API_BASE}/orders`;
const API_ALFABANK = `${API_BASE}/alfabank-payment`;

interface DeliveryPaymentDialogProps {
  order: {
    id: number;
    custom_delivery_price: number;
  } | null;
  userId: number;
  userBalance: number;
  userEmail?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const DeliveryPaymentDialog = ({ order, userId, userBalance, userEmail, onClose, onSuccess }: DeliveryPaymentDialogProps) => {
  const [paymentMethod, setPaymentMethod] = useState<'balance' | 'alfabank'>('balance');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!order) return null;

  const deliveryPrice = order.custom_delivery_price;
  const hasEnoughBalance = userBalance >= deliveryPrice;

  const handlePayment = async () => {
    if (paymentMethod === 'balance' && !hasEnoughBalance) {
      toast.error(`На балансе ${userBalance.toFixed(2)}₽, а нужно ${deliveryPrice}₽`);
      return;
    }

    setIsProcessing(true);
    try {
      if (paymentMethod === 'balance') {
        const response = await fetch(API_ORDERS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'complete_preorder_payment',
            order_id: order.id,
            user_id: userId,
            payment_method: 'balance',
            payment_type: 'delivery'
          })
        });

        const data = await response.json();

        if (data.success) {
          await logUserAction(
            userId,
            'delivery_payment',
            `Оплата доставки для заказа #${order.id} - ${deliveryPrice}₽`,
            'order',
            order.id,
            { payment_method: 'balance', amount: deliveryPrice }
          );
          toast.success('Оплата доставки завершена!');
          onSuccess();
          onClose();
        } else {
          toast.error(data.error || 'Не удалось оплатить доставку');
        }
      } else {
        const response = await fetch(API_ALFABANK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: deliveryPrice,
            user_id: userId,
            email: userEmail,
            description: `Оплата доставки для заказа #${order.id}`,
            return_url: `${window.location.origin}/payment/success?order_id=${order.id}&delivery_payment=true`,
            order_id: order.id,
            is_delivery_payment: true
          })
        });

        const data = await response.json();

        if (data.payment_url) {
          await logUserAction(
            userId,
            'delivery_payment_initiated',
            `Инициирована оплата доставки для заказа #${order.id} через Альфабанк`,
            'order',
            order.id,
            { payment_method: 'alfabank', amount: deliveryPrice }
          );
          window.location.href = data.payment_url;
        } else {
          toast.error('Не удалось создать платёж');
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Произошла ошибка при оплате');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={!!order} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Оплата доставки</DialogTitle>
          <DialogDescription>
            Заказ #{order.id}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-center">
            <div className="text-sm text-muted-foreground mb-1">Стоимость доставки</div>
            <div className="text-3xl font-bold text-primary">{deliveryPrice}₽</div>
          </div>

          <div className="space-y-3">
            <Label>Способ оплаты</Label>
            <RadioGroup value={paymentMethod} onValueChange={(val) => setPaymentMethod(val as 'balance' | 'alfabank')}>
              <div className={`flex items-center space-x-2 border rounded-lg p-3 cursor-pointer transition-colors ${paymentMethod === 'balance' ? 'border-primary bg-primary/5' : 'hover:bg-accent'} ${!hasEnoughBalance ? 'opacity-50' : ''}`}>
                <RadioGroupItem value="balance" id="balance" disabled={!hasEnoughBalance} />
                <Label htmlFor="balance" className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon name="Wallet" size={20} className="text-primary" />
                      <span className="font-medium">Баланс</span>
                    </div>
                    <span className={`text-sm ${hasEnoughBalance ? 'text-muted-foreground' : 'text-destructive'}`}>
                      {userBalance.toFixed(2)}₽
                    </span>
                  </div>
                  {!hasEnoughBalance && (
                    <p className="text-xs text-destructive mt-1">Недостаточно средств</p>
                  )}
                </Label>
              </div>

              <div className={`flex items-center space-x-2 border rounded-lg p-3 cursor-pointer transition-colors ${paymentMethod === 'alfabank' ? 'border-primary bg-primary/5' : 'hover:bg-accent'}`}>
                <RadioGroupItem value="alfabank" id="alfabank" />
                <Label htmlFor="alfabank" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Icon name="CreditCard" size={20} className="text-primary" />
                    <span className="font-medium">Банковская карта</span>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
              disabled={isProcessing}
            >
              Отмена
            </Button>
            <Button 
              onClick={handlePayment}
              className="flex-1"
              disabled={isProcessing || (paymentMethod === 'balance' && !hasEnoughBalance)}
            >
              {isProcessing ? (
                <>
                  <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                  Обработка...
                </>
              ) : (
                <>
                  <Icon name="CreditCard" size={16} className="mr-2" />
                  Оплатить {deliveryPrice}₽
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeliveryPaymentDialog;