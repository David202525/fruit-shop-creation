import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface Transaction {
  id: number;
  user_id: number;
  type: string;
  amount: number;
  description: string;
  created_at: string;
}

interface TransactionsTabProps {
  userId: number;
}

const TransactionsTab = ({ userId }: TransactionsTabProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, [userId]);

  const loadTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
      const response = await fetch(`${API_BASE}/auth?action=balance&user_id=${userId}`);
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return 'ArrowDownToLine';
      case 'withdraw': return 'ArrowUpFromLine';
      case 'cashback_deposit': 
      case 'cashback_earned': return 'Gift';
      case 'cashback_used': return 'Wallet';
      case 'cashback_exchange': return 'ArrowLeftRight';
      case 'cashback_cancelled': return 'XCircle';
      case 'purchase':
      case 'order_payment': return 'ShoppingCart';
      default: return 'CircleDot';
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
      case 'purchase':
      case 'cashback_cancelled':
        return 'text-red-600';
      default: 
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-2 sm:space-y-3 mt-4 sm:mt-6">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-sm sm:text-base">История операций</h3>
        <Button 
          size="sm" 
          variant="outline"
          onClick={loadTransactions}
          disabled={loadingTransactions}
          className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
        >
          <Icon name="RefreshCw" size={14} className="mr-1 sm:mr-2 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Обновить</span>
        </Button>
      </div>
      
      {loadingTransactions ? (
        <p className="text-center text-muted-foreground py-4 text-sm">Загрузка...</p>
      ) : transactions.length === 0 ? (
        <p className="text-xs sm:text-sm text-muted-foreground">История операций пуста</p>
      ) : (
        <div className="space-y-1.5 sm:space-y-2 max-h-96 overflow-y-auto">
          {transactions.slice(0, 20).map(transaction => (
            <div key={transaction.id} className="flex items-center justify-between p-2 sm:p-3 border rounded-lg gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <Icon 
                  name={getTransactionIcon(transaction.type)} 
                  size={18} 
                  className={`${getTransactionColor(transaction.type)} flex-shrink-0 sm:w-5 sm:h-5`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium truncate">{transaction.description || 'Операция'}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {new Date(transaction.created_at).toLocaleString('ru-RU', { 
                      day: '2-digit', 
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-xs sm:text-sm font-semibold whitespace-nowrap ${getTransactionColor(transaction.type)}`}>
                  {(transaction.type.includes('deposit') || transaction.type === 'cashback_used') ? '+' : '-'}
                  {Number(transaction.amount).toFixed(2)}₽
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground capitalize hidden sm:block">
                  {transaction.type === 'deposit' && 'Пополнение'}
                  {transaction.type === 'withdraw' && 'Списание'}
                  {transaction.type === 'cashback_deposit' && 'Кэшбэк'}
                  {transaction.type === 'cashback_earned' && 'Кэшбэк'}
                  {transaction.type === 'cashback_used' && 'Использование кэшбэка'}
                  {transaction.type === 'order_payment' && 'Оплата заказа'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionsTab;