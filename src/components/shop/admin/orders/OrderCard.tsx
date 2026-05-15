import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { formatDateTime } from '@/lib/dateUtils';

interface OrderCardProps {
  order: any;
  statusLabels: Record<string, string>;
  getStatusBadgeVariant: (status: string) => string;
  onViewDetails: (order: any) => void;
  onEditStatus: (order: any) => void;
  onDelete: (orderId: number) => void;
}

export const OrderCard = ({
  order,
  statusLabels,
  getStatusBadgeVariant,
  onViewDetails,
  onEditStatus,
  onDelete
}: OrderCardProps) => {
  return (
    <div className="p-3 sm:p-4 border rounded-lg space-y-3">
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm sm:text-base">Заказ #{order.id}</div>
            <div className="text-xs sm:text-sm text-muted-foreground truncate">
              {order.user_name}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {order.user_phone}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {formatDateTime(order.created_at)}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <Badge variant={getStatusBadgeVariant(order.status)} className="text-xs whitespace-nowrap">
              {statusLabels[order.status] || order.status}
            </Badge>
            <div className={`font-bold text-sm sm:text-base whitespace-nowrap ${order.is_preorder ? 'line-through text-muted-foreground' : ''}`}>
              {Array.isArray(order.items) && order.items.length > 0 ? 
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
                : parseFloat(order.total_amount || '0').toFixed(2)
              }₽
            </div>
            {order.is_fully_paid ? (
              <div className="text-green-700 dark:text-green-300 font-semibold text-xs flex items-center gap-1">
                <Icon name="CheckCircle" size={12} />
                Полностью
              </div>
            ) : order.is_preorder && order.amount_paid ? (
              <div className="text-blue-700 dark:text-blue-300 font-bold text-xs whitespace-nowrap">
                Оплачено: {parseFloat(order.amount_paid).toFixed(2)}₽
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {order.is_preorder && order.delivery_zone_id === 1 && (
        <div className="p-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-2 border-orange-300 dark:border-orange-700 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="MapPin" size={18} className="text-orange-600 dark:text-orange-400" />
            <div className="font-bold text-orange-900 dark:text-orange-100">Заказ из Барнаула (предзаказ)</div>
          </div>
          <div className="space-y-1.5 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-orange-700 dark:text-orange-300">Предоплата (50%):</span>
              <span className="font-bold text-orange-900 dark:text-orange-100">{parseFloat(order.amount_paid || '0').toFixed(2)}₽</span>
            </div>
            {order.delivery_paid ? (
              <>
                <div className="flex justify-between">
                  <span className="text-orange-700 dark:text-orange-300">Доставка:</span>
                  <span className="font-bold text-green-700 dark:text-green-300">{order.custom_delivery_price}₽ ✓</span>
                </div>
                {!order.second_payment_paid ? (
                  <div className="flex justify-between">
                    <span className="text-orange-700 dark:text-orange-300">Осталось доплатить:</span>
                    <span className="font-bold text-orange-900 dark:text-orange-100">
                      {(parseFloat(order.total_amount) - parseFloat(order.amount_paid || '0')).toFixed(2)}₽
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 justify-center py-1 px-2 bg-green-100 dark:bg-green-950/40 rounded">
                    <Icon name="CheckCircle2" size={14} className="text-green-700 dark:text-green-300" />
                    <span className="text-green-700 dark:text-green-300 font-semibold text-xs">Заказ оплачен полностью</span>
                  </div>
                )}
              </>
            ) : order.custom_delivery_price ? (
              <div className="flex justify-between">
                <span className="text-orange-700 dark:text-orange-300">Ожидает оплаты доставки:</span>
                <span className="font-bold text-red-600 dark:text-red-400">{order.custom_delivery_price}₽</span>
              </div>
            ) : (
              <div className="text-orange-700 dark:text-orange-300 italic">
                Ожидает установки цены доставки
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
        <div>
          <div className="font-medium">Способ оплаты:</div>
          <div className="text-muted-foreground">
            {order.payment_method === 'balance' ? 'Баланс' : 
             order.payment_method === 'card' ? 'Карта' : 
             order.payment_method === 'sber_qr' ? 'СберБанк QR' :
             'При получении'}
          </div>
        </div>
        <div>
          <div className="font-medium">Доставка:</div>
          <div className="text-muted-foreground">
            {order.delivery_type === 'delivery' ? '🚚 Доставка' : '🏪 Самовывоз'}
            {order.delivery_zone_id && (
              <span className="ml-1 text-xs text-primary">
                (Зона #{order.delivery_zone_id})
              </span>
            )}
            {order.custom_delivery_price && (
              <span className={`ml-1 text-xs font-bold ${order.delivery_paid ? 'text-green-600 dark:text-green-400' : 'text-primary'}`}>
                {order.custom_delivery_price}₽ {order.delivery_paid && '✓'}
              </span>
            )}
          </div>
        </div>
        <div className="sm:col-span-2">
          <div className="font-medium">Адрес:</div>
          <div className="text-muted-foreground break-words">{order.delivery_address}</div>
        </div>
      </div>

      {order.rejection_reason && (
        <div className="text-sm bg-destructive/10 p-2 rounded">
          <div className="font-medium text-destructive">Причина отказа:</div>
          <div className="text-muted-foreground">{order.rejection_reason}</div>
        </div>
      )}

      {order.status === 'cancelled' && order.cancellation_reason && (
        <div className="text-sm bg-orange-50 dark:bg-orange-950/20 p-2 rounded border border-orange-200 dark:border-orange-800">
          <div className="font-medium text-orange-700 dark:text-orange-300">
            Отменён {order.cancelled_by === 'admin' ? '(администратором)' : '(пользователем)'}:
          </div>
          <div className="text-muted-foreground">{order.cancellation_reason}</div>
        </div>
      )}

      {order.items && order.items.some((i: any) => i.is_out_of_stock) && (
        <div className="text-sm bg-amber-50 dark:bg-amber-950/20 p-2 rounded border border-amber-200 dark:border-amber-800">
          <div className="font-medium text-amber-700 dark:text-amber-300">
            ⚠️ Товары недоступны в нужном количестве
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => onViewDetails(order)}
          variant="outline"
          size="sm"
          className="min-h-[36px] flex-1 sm:flex-none"
        >
          <Icon name="Eye" size={16} className="mr-1 flex-shrink-0" />
          Детали
        </Button>
        <Button
          onClick={() => onEditStatus(order)}
          variant="outline"
          size="sm"
          className="min-h-[36px] flex-1 sm:flex-none"
        >
          <Icon name="Edit" size={16} className="mr-1 flex-shrink-0" />
          <span className="hidden xs:inline">Изменить </span>статус
        </Button>
        <Button
          onClick={() => onDelete(order.id)}
          variant="destructive"
          size="sm"
          className="min-h-[36px] flex-1 sm:flex-none"
        >
          <Icon name="Trash2" size={16} className="mr-1 flex-shrink-0" />
          Удалить
        </Button>
      </div>
    </div>
  );
};