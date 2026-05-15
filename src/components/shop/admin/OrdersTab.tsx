import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { OrderCard } from './orders/OrderCard';
import { OrderDetailsDialog } from './orders/OrderDetailsDialog';
import { StatusEditDialog } from './orders/StatusEditDialog';

interface OrdersTabProps {
  orders: Record<string, unknown>[];
  onUpdateStatus: (orderId: number, status: string, rejectionReason?: string, customDeliveryPrice?: number | null, trackingNumber?: string) => void;
  onDeleteOrder: (orderId: number) => void;
  onUpdateItemStock?: (orderId: number, itemId: number, isOutOfStock: boolean) => void;
  onUpdateItemAvailability?: (itemId: number, availableQuantity: number, availablePrice?: number) => void;
}

const statusLabels: Record<string, string> = {
  'pending': '⏳ Ожидает',
  'processing': '📦 В обработке',
  'delivered': '✅ Доставлен',
  'rejected': '❌ Отклонён',
  'cancelled': '🚫 Отменён'
};

const OrdersTab = ({ orders, onUpdateStatus, onDeleteOrder, onUpdateItemStock, onUpdateItemAvailability }: OrdersTabProps) => {
  const [editingOrder, setEditingOrder] = useState<Record<string, unknown> | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Record<string, unknown> | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [itemAvailability, setItemAvailability] = useState<Record<number, { quantity: number; price: string }>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [customDeliveryPrice, setCustomDeliveryPrice] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState<string>('');

  const filteredOrders = orders.filter(order =>
    order.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.user_phone?.includes(searchQuery) ||
    order.id.toString().includes(searchQuery) ||
    order.delivery_address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openStatusDialog = (order: Record<string, unknown>) => {
    setEditingOrder(order);
    setNewStatus(order.status as string);
    setRejectionReason((order.rejection_reason as string) || '');
    setCustomDeliveryPrice(order.custom_delivery_price ? String(order.custom_delivery_price) : '');
    setTrackingNumber((order.tracking_number as string) || '');
  };

  const handleSaveStatus = () => {
    if (editingOrder) {
      const deliveryPrice = customDeliveryPrice.trim() ? parseFloat(customDeliveryPrice) : null;
      onUpdateStatus(
        editingOrder.id as number,
        newStatus, 
        newStatus === 'rejected' ? rejectionReason : undefined,
        deliveryPrice,
        trackingNumber.trim() || undefined
      );
      setEditingOrder(null);
      setRejectionReason('');
      setCustomDeliveryPrice('');
      setTrackingNumber('');
    }
  };

  const getStatusBadgeVariant = (status: string): string => {
    switch (status) {
      case 'completed': return 'default';
      case 'rejected': return 'destructive';
      case 'cancelled': return 'destructive';
      case 'shipped': return 'secondary';
      default: return 'outline';
    }
  };

  const handleItemAvailabilityChange = (itemId: number, field: 'quantity' | 'price', value: string) => {
    setItemAvailability(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }));
  };

  return (
    <>
      <Card>
        <CardHeader className="px-3 sm:px-6 py-4 sm:py-6">
          <CardTitle>Заказы</CardTitle>
          <CardDescription>Все заказы пользователей</CardDescription>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="relative mb-4 w-full">
            <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input 
              placeholder="Поиск по номеру, имени, телефону..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <div className="space-y-3 sm:space-y-4">
            {filteredOrders.length === 0 && searchQuery ? (
              <div className="text-center py-8 text-muted-foreground">
                <Icon name="SearchX" size={48} className="mx-auto mb-2 opacity-50" />
                <p>Заказы не найдены</p>
              </div>
            ) : (
              filteredOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  statusLabels={statusLabels}
                  getStatusBadgeVariant={getStatusBadgeVariant}
                  onViewDetails={setViewingOrder}
                  onEditStatus={openStatusDialog}
                  onDelete={onDeleteOrder}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <OrderDetailsDialog
        order={viewingOrder}
        statusLabels={statusLabels}
        getStatusBadgeVariant={getStatusBadgeVariant}
        itemAvailability={itemAvailability}
        onClose={() => setViewingOrder(null)}
        onUpdateItemStock={onUpdateItemStock}
        onUpdateItemAvailability={onUpdateItemAvailability}
        onItemAvailabilityChange={handleItemAvailabilityChange}
      />

      <StatusEditDialog
        order={editingOrder as { id: number; user_name: string; user_phone: string; delivery_address?: string; delivery_zone_id?: number; custom_delivery_price?: number; delivery_price_set_by_admin?: boolean; delivery_paid?: boolean; tracking_number?: string }}
        newStatus={newStatus}
        rejectionReason={rejectionReason}
        customDeliveryPrice={customDeliveryPrice}
        trackingNumber={trackingNumber}
        statusLabels={statusLabels}
        onStatusChange={setNewStatus}
        onRejectionReasonChange={setRejectionReason}
        onCustomDeliveryPriceChange={setCustomDeliveryPrice}
        onTrackingNumberChange={setTrackingNumber}
        onSave={handleSaveStatus}
        onClose={() => {
          setEditingOrder(null);
          setRejectionReason('');
          setCustomDeliveryPrice('');
          setTrackingNumber('');
        }}
      />
    </>
  );
};

export default OrdersTab;