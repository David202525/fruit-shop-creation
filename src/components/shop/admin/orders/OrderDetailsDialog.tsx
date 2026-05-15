import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { formatDateTime } from '@/lib/dateUtils';

interface OrderDetailsDialogProps {
  order: any;
  statusLabels: Record<string, string>;
  getStatusBadgeVariant: (status: string) => string;
  itemAvailability: Record<number, { quantity: number; price: string }>;
  onClose: () => void;
  onUpdateItemStock?: (orderId: number, itemId: number, isOutOfStock: boolean) => void;
  onUpdateItemAvailability?: (itemId: number, availableQuantity: number, availablePrice?: number) => void;
  onItemAvailabilityChange: (itemId: number, field: 'quantity' | 'price', value: string) => void;
}

export const OrderDetailsDialog = ({
  order,
  statusLabels,
  getStatusBadgeVariant,
  itemAvailability,
  onClose,
  onUpdateItemStock,
  onUpdateItemAvailability,
  onItemAvailabilityChange
}: OrderDetailsDialogProps) => {
  if (!order) return null;

  const handleToggleOutOfStock = (itemId: number, currentStatus: boolean) => {
    if (onUpdateItemStock) {
      onUpdateItemStock(order.id, itemId, !currentStatus);
    }
  };

  const handleSaveAvailability = (itemId: number, originalPrice: string) => {
    const availability = itemAvailability[itemId];
    if (!availability || !onUpdateItemAvailability) return;

    const quantity = parseInt(availability.quantity.toString());
    const price = availability.price.trim() 
      ? parseFloat(availability.price)
      : parseFloat(originalPrice);

    if (quantity > 0) {
      onUpdateItemAvailability(itemId, quantity, price);
    }
  };

  return (
    <Dialog open={!!order} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center justify-between gap-2 pr-6">
            <span>Заказ #{order.id}</span>
            <Badge variant={getStatusBadgeVariant(order.status)} className="whitespace-nowrap">
              {statusLabels[order.status] || order.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <div>
              <div className="font-medium text-muted-foreground">Клиент</div>
              <div className="break-words">{order.user_name}</div>
            </div>
            <div>
              <div className="font-medium text-muted-foreground">Телефон</div>
              <div className="break-all">{order.user_phone}</div>
            </div>
            <div>
              <div className="font-medium text-muted-foreground">Способ оплаты</div>
              <div>
                {order.payment_method === 'balance' ? 'Баланс' : 
                 order.payment_method === 'card' ? 'Карта' : 
                 order.payment_method === 'sber_qr' ? 'СберБанк QR' :
                 'При получении'}
              </div>
            </div>
            <div>
              <div className="font-medium text-muted-foreground">Доставка</div>
              <div className="flex flex-wrap items-center gap-1">
                <span>{order.delivery_type === 'delivery' ? '🚚 Доставка' : '🏪 Самовывоз'}</span>
                {order.delivery_zone_id && (
                  <span className="text-xs text-primary">
                    (Зона #{order.delivery_zone_id})
                  </span>
                )}
                {order.custom_delivery_price && (
                  <span className={`text-xs font-bold ${order.delivery_paid ? 'text-green-600 dark:text-green-400' : 'text-primary'}`}>
                    {order.custom_delivery_price}₽ {order.delivery_paid && '✓ Оплачена'}
                  </span>
                )}
              </div>
            </div>
            <div className="sm:col-span-2">
              <div className="font-medium text-muted-foreground">Адрес</div>
              <div className="break-words">{order.delivery_address}</div>
            </div>
            <div>
              <div className="font-medium text-muted-foreground">Дата создания</div>
              <div>{formatDateTime(order.created_at)}</div>
            </div>
          </div>

          {order.rejection_reason && (
            <div className="bg-destructive/10 p-3 rounded">
              <div className="font-medium text-destructive">Причина отказа:</div>
              <div>{order.rejection_reason}</div>
            </div>
          )}

          {order.status === 'cancelled' && order.cancellation_reason && (
            <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded border border-orange-200 dark:border-orange-800">
              <div className="font-medium text-orange-700 dark:text-orange-300">
                Отменён {order.cancelled_by === 'admin' ? '(администратором)' : '(пользователем)'}:
              </div>
              <div>{order.cancellation_reason}</div>
            </div>
          )}

          <div>
            <div className="font-medium mb-2">Товары:</div>
            <div className="space-y-2">
              {order.items && order.items.length > 0 ? (
                order.items
                  .filter((item: any) => item.product_name)
                  .map((item: any, idx: number) => (
                    <div key={idx} className="p-3 border rounded space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <div className="font-medium">{item.product_name}</div>
                          {item.is_out_of_stock && (
                            <Badge variant="destructive" className="mt-1">
                              <Icon name="AlertCircle" size={12} className="mr-1" />
                              Недоступен
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <div className={item.is_out_of_stock ? 'line-through text-muted-foreground' : ''}>
                            {item.quantity} × {parseFloat(item.price).toFixed(2)}₽
                          </div>
                          <div className={`font-bold ${item.is_out_of_stock ? 'line-through text-muted-foreground' : ''}`}>
                            {(parseFloat(item.price) * parseInt(item.quantity)).toFixed(2)}₽
                          </div>
                        </div>
                      </div>

                      {item.is_out_of_stock && (
                        <div className="space-y-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded">
                          <div className="text-xs font-medium text-amber-700 dark:text-amber-300">
                            Укажите доступное количество:
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <div className="flex-1">
                              <Input
                                type="number"
                                placeholder="Количество"
                                min="0"
                                value={itemAvailability[item.id]?.quantity ?? ''}
                                onChange={(e) => onItemAvailabilityChange(item.id, 'quantity', e.target.value)}
                                className="h-9 text-sm w-full"
                              />
                            </div>
                            <div className="flex-1">
                              <Input
                                type="number"
                                placeholder={`Цена (${parseFloat(item.price).toFixed(2)}₽)`}
                                step="0.01"
                                value={itemAvailability[item.id]?.price ?? ''}
                                onChange={(e) => onItemAvailabilityChange(item.id, 'price', e.target.value)}
                                className="h-9 text-sm w-full"
                              />
                            </div>
                            <Button
                              size="sm"
                              className="w-full sm:w-auto min-h-[36px]"
                              onClick={() => handleSaveAvailability(item.id, item.price)}
                              disabled={!itemAvailability[item.id]?.quantity}
                            >
                              Сохранить
                            </Button>
                          </div>
                          {item.available_quantity > 0 && (
                            <div className="text-xs text-green-600 dark:text-green-400">
                              ✓ Доступно: {item.available_quantity} шт. по {parseFloat(item.available_price || item.price).toFixed(2)}₽
                            </div>
                          )}
                        </div>
                      )}

                      {onUpdateItemStock && (
                        <Button
                          size="sm"
                          variant={item.is_out_of_stock ? "default" : "destructive"}
                          onClick={() => handleToggleOutOfStock(item.id, item.is_out_of_stock)}
                        >
                          <Icon 
                            name={item.is_out_of_stock ? "Check" : "X"} 
                            size={14} 
                            className="mr-1" 
                          />
                          {item.is_out_of_stock ? 'Вернуть' : 'Нет в наличии'}
                        </Button>
                      )}
                    </div>
                  ))
              ) : (
                <div className="text-muted-foreground text-center py-4">Товары не указаны</div>
              )}
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t">
            <div className={`flex justify-between items-center gap-2 ${order.is_preorder ? 'text-sm text-muted-foreground' : 'font-bold text-base sm:text-lg'}`}>
              <span>Итого:</span>
              <span className={`whitespace-nowrap ${order.is_preorder ? 'line-through' : ''}`}>
                {order.items ? 
                  order.items
                    .filter((i: any) => i.product_name)
                    .reduce((sum: number, i: any) => {
                      if (i.is_out_of_stock) {
                        if (i.available_quantity > 0) {
                          const price = parseFloat(i.available_price) || parseFloat(i.price);
                          const qty = parseInt(i.available_quantity);
                          return sum + (price * qty);
                        }
                        return sum;
                      }
                      return sum + (parseFloat(i.price) * parseInt(i.quantity));
                    }, 0).toFixed(2)
                  : parseFloat(order.total_amount).toFixed(2)
                }₽
              </span>
            </div>
            {order.is_fully_paid ? (
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-300 dark:border-green-700 rounded p-3">
                <div className="flex items-center justify-center gap-2">
                  <Icon name="CheckCircle" size={16} className="text-green-700 dark:text-green-300 flex-shrink-0" />
                  <span className="text-green-900 dark:text-green-100 font-semibold text-sm">Заказ оплачен полностью</span>
                </div>
              </div>
            ) : order.is_preorder && order.amount_paid ? (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-300 dark:border-blue-700 rounded p-3">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <span className="text-blue-900 dark:text-blue-100 font-bold text-sm sm:text-base">Клиент оплатил (предоплата 50%):</span>
                  <span className="text-blue-900 dark:text-blue-100 font-bold text-sm sm:text-base whitespace-nowrap">{parseFloat(order.amount_paid).toFixed(2)}₽</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};