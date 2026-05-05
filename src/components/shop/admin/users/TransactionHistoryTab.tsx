import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { formatDateTime } from '@/lib/dateUtils';

interface Transaction {
  id: number;
  user_id: number;
  type: string;
  amount: number;
  description: string;
  created_at: string;
  alfa_order_id?: string | null;
}

interface TransactionHistoryTabProps {
  transactions: Transaction[];
  loadingTransactions: boolean;
  onRefresh: () => void;
}

const TransactionHistoryTab = ({
  transactions,
  loadingTransactions,
  onRefresh,
}: TransactionHistoryTabProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [refundTx, setRefundTx] = useState<Transaction | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'ArrowDownToLine';
      case 'withdraw':
        return 'ArrowUpFromLine';
      case 'cashback_deposit':
      case 'cashback_earned':
        return 'Gift';
      case 'cashback_used':
        return 'Wallet';
      case 'cashback_exchange':
        return 'ArrowLeftRight';
      case 'order_payment':
        return 'ShoppingCart';
      case 'refund':
        return 'Undo2';
      default:
        return 'CircleDot';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'cashback_deposit':
      case 'cashback_earned':
      case 'cashback_used':
      case 'cashback_exchange':
        return 'text-green-600';
      case 'withdraw':
      case 'order_payment':
      case 'refund':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const isRefundable = (tx: Transaction) =>
    tx.type === 'deposit' && !!tx.alfa_order_id;

  const openRefund = (tx: Transaction) => {
    setRefundTx(tx);
    setRefundAmount(Number(tx.amount).toFixed(2));
  };

  const closeRefund = () => {
    setRefundTx(null);
    setRefundAmount('');
    setSubmitting(false);
  };

  const submitRefund = async () => {
    if (!refundTx || !user) return;
    const amt = parseFloat(refundAmount);
    if (isNaN(amt) || amt <= 0) {
      toast({
        title: 'Ошибка',
        description: 'Укажите сумму возврата больше 0',
        variant: 'destructive',
      });
      return;
    }
    if (amt > Number(refundTx.amount)) {
      toast({
        title: 'Ошибка',
        description: `Сумма больше пополнения (${refundTx.amount}₽)`,
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        'https://functions.poehali.dev/7a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transaction_id: refundTx.id,
            amount: amt,
            admin_id: user.id,
          }),
        }
      );
      const data = await response.json();
      if (response.ok && data.success) {
        toast({
          title: 'Возврат выполнен',
          description: data.message || `Возвращено ${amt}₽`,
        });
        closeRefund();
        onRefresh();
      } else {
        toast({
          title: 'Не удалось выполнить возврат',
          description: data.error || 'Неизвестная ошибка',
          variant: 'destructive',
        });
        setSubmitting(false);
      }
    } catch (e) {
      toast({
        title: 'Ошибка сети',
        description: String(e),
        variant: 'destructive',
      });
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">История операций</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={onRefresh}
          disabled={loadingTransactions}
        >
          <Icon name="RefreshCw" size={16} className="mr-2" />
          Обновить
        </Button>
      </div>

      {transactions.length === 0 && !loadingTransactions ? (
        <p className="text-center text-muted-foreground py-8">
          История операций пуста
        </p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto relative">
          {loadingTransactions && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
              <Icon
                name="Loader2"
                size={24}
                className="animate-spin text-muted-foreground"
              />
            </div>
          )}
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 border rounded-lg gap-2"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  name={getTransactionIcon(transaction.type)}
                  size={20}
                  className={getTransactionColor(transaction.type)}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {transaction.description || 'Операция'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(transaction.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <p
                    className={`text-sm font-semibold ${getTransactionColor(transaction.type)}`}
                  >
                    {transaction.type.includes('deposit') ||
                    transaction.type === 'cashback_used'
                      ? '+'
                      : '-'}
                    {Number(transaction.amount).toFixed(2)}₽
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {transaction.type.replace('_', ' ')}
                  </p>
                </div>
                {isRefundable(transaction) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openRefund(transaction)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Icon name="Undo2" size={14} className="mr-1" />
                    Возврат
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!refundTx} onOpenChange={(o) => !o && closeRefund()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Возврат через Альфа-Банк</DialogTitle>
            <DialogDescription>
              Деньги вернутся клиенту, баланс на сайте уменьшится на ту же сумму.
            </DialogDescription>
          </DialogHeader>
          {refundTx && (
            <div className="space-y-3">
              <div className="text-sm bg-muted p-3 rounded-lg">
                <p>
                  <span className="text-muted-foreground">Пополнение:</span>{' '}
                  <span className="font-semibold">
                    {Number(refundTx.amount).toFixed(2)}₽
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Дата:</span>{' '}
                  {formatDateTime(refundTx.created_at)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Сумма возврата (₽)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={refundTx.amount}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  disabled={submitting}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Можно вернуть полную или частичную сумму
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeRefund}
              disabled={submitting}
            >
              Отмена
            </Button>
            <Button
              onClick={submitRefund}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {submitting && (
                <Icon
                  name="Loader2"
                  size={16}
                  className="mr-2 animate-spin"
                />
              )}
              Вернуть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransactionHistoryTab;
