import { useState } from 'react';
import { Order } from '@/types/shop';
import OrderItem from './OrderItem';
import DeliveryPaymentDialog from './DeliveryPaymentDialog';
import SecondPaymentDialog from './SecondPaymentDialog';
import { logUserAction } from '@/utils/userLogger';
import { useToast } from '@/hooks/use-toast';

interface OrdersTabProps {
  orders: Order[];
  userId: number;
  userBalance: number;
  userEmail?: string;
  onOrderUpdate: () => void;
}

const OrdersTab = ({ orders, userId, userBalance, userEmail, onOrderUpdate }: OrdersTabProps) => {
  const { toast } = useToast();
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [payingDeliveryOrder, setPayingDeliveryOrder] = useState<Order | null>(null);
  const [payingSecondPaymentOrder, setPayingSecondPaymentOrder] = useState<Order | null>(null);

  const handleCancelOrder = async (orderId: number) => {
    setCancellingOrderId(orderId);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
      const response = await fetch(`${API_BASE}/orders`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          status: 'cancelled',
          rejection_reason: 'Отменён пользователем'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await logUserAction(
          userId,
          'order_cancel',
          `Отмена заказа #${orderId}`,
          'order',
          orderId
        );
        onOrderUpdate();
        toast({ title: 'Заказ отменён', description: `Заказ #${orderId} успешно отменён.` });
      } else {
        toast({ title: 'Ошибка', description: data.error || 'Не удалось отменить заказ', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({ title: 'Ошибка', description: 'Произошла ошибка при отмене заказа', variant: 'destructive' });
    } finally {
      setCancellingOrderId(null);
    }
  };

  return (
    <div className="space-y-2 sm:space-y-3 mt-4 sm:mt-6">
      <h3 className="font-semibold text-sm sm:text-base">История заказов</h3>
      {orders.length === 0 ? (
        <p className="text-xs sm:text-sm text-muted-foreground">Заказов пока нет</p>
      ) : (
        <div className="space-y-1.5 sm:space-y-2 max-h-[500px] sm:max-h-[600px] overflow-y-auto">
          {orders.map(order => (
            <OrderItem
              key={order.id}
              order={order}
              isExpanded={expandedOrderId === order.id}
              onToggle={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
              onCancel={handleCancelOrder}
              onPayDelivery={(ord) => setPayingDeliveryOrder(ord)}
              onPayRemaining={(ord) => setPayingSecondPaymentOrder(ord)}
              isCancelling={cancellingOrderId === order.id}
            />
          ))}
        </div>
      )}
      
      <DeliveryPaymentDialog
        order={payingDeliveryOrder}
        userId={userId}
        userBalance={userBalance}
        userEmail={userEmail}
        onClose={() => setPayingDeliveryOrder(null)}
        onSuccess={onOrderUpdate}
      />
      
      <SecondPaymentDialog
        order={payingSecondPaymentOrder}
        userId={userId}
        userBalance={userBalance}
        userEmail={userEmail}
        onClose={() => setPayingSecondPaymentOrder(null)}
        onSuccess={onOrderUpdate}
      />
    </div>
  );
};

export default OrdersTab;