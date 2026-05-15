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

interface SecondPaymentDialogProps {
  order: {
    id: number;
    second_payment_amount: number;
  } | null;
  userId: number;
  userBalance: number;
  userEmail?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const SecondPaymentDialog = ({ order, userId, userBalance, userEmail, onClose, onSuccess }: SecondPaymentDialogProps) => {
  const [paymentMethod, setPaymentMethod] = useState<'balance' | 'alfabank'>('balance');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!order) return null;

  const paymentAmount = order.second_payment_amount;
  const hasEnoughBalance = userBalance >= paymentAmount;

  const handlePayment = async () => {
    if (paymentMethod === 'balance' && !hasEnoughBalance) {
      toast.error(`На балансе ${userBalance.toFixed(2)}₽, а нужно ${paymentAmount}₽`);
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
            payment_type: 'second_payment'
          })
        });

        const data = await response.json();

        if (data.success) {
          await logUserAction(
            userId,
            'second_payment',
            `Оплата второй части заказа #${order.id} - ${paymentAmount}₽`,
            'order',
            order.id,
            { payment_method: 'balance', amount: paymentAmount }
          );
          toast.success('Оплата завершена!');
          onSuccess();
          onClose();
        } else {
          toast.error(data.error || 'Не удалось оплатить');
        }
      } else {
        const response = await fetch(API_ALFABANK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: paymentAmount,
            user_id: userId,
            email: userEmail,
            description: `Доплата за заказ #${order.id} (50%)`,
            return_url: `${window.location.origin}/payment/success?order_id=${order.id}&second_payment=true`,
            order_id: order.id,
            is_second_payment: true
          })
        });

        const data = await response.json();

        if (data.payment_url) {
          await logUserAction(
            userId,
            'second_payment_initiated',
            `Инициирована доплата за заказ #${order.id} через Альфабанк`,
            'order',
            order.id,
            { payment_method: 'alfabank', amount: paymentAmount }
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
          <DialogTitle>Доплата за заказ</DialogTitle>
          <DialogDescription>
            Заказ #{order.id} — оставшиеся 50%
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-300 dark:border-orange-700 rounded-lg p-4 text-center">
            <div className="text-sm text-muted-foreground mb-1">К оплате</div>
            <div className="text-3xl font-bold text-orange-600">{paymentAmount}₽</div>
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
              className="flex-1 bg-orange-600 hover:bg-orange-700"
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
                  Оплатить {paymentAmount}₽
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SecondPaymentDialog;