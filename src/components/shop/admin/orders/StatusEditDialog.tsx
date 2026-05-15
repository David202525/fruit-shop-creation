import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface StatusEditDialogProps {
  order: { id: number; user_name: string; user_phone: string; delivery_address?: string; delivery_zone_id?: number; custom_delivery_price?: number; delivery_price_set_by_admin?: boolean; delivery_paid?: boolean; tracking_number?: string };
  newStatus: string;
  rejectionReason: string;
  customDeliveryPrice: string;
  trackingNumber: string;
  statusLabels: Record<string, string>;
  onStatusChange: (status: string) => void;
  onRejectionReasonChange: (reason: string) => void;
  onCustomDeliveryPriceChange: (price: string) => void;
  onTrackingNumberChange: (tracking: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export const StatusEditDialog = ({
  order,
  newStatus,
  rejectionReason,
  customDeliveryPrice,
  trackingNumber,
  statusLabels,
  onStatusChange,
  onRejectionReasonChange,
  onCustomDeliveryPriceChange,
  onTrackingNumberChange,
  onSave,
  onClose
}: StatusEditDialogProps) => {
  if (!order) return null;

  const isNonBarnaul = order.delivery_address && 
    !order.delivery_address.toLowerCase().includes('барнаул');

  return (
    <Dialog open={!!order} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-full sm:max-w-md p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg leading-snug">Изменить статус заказа #{order.id}</DialogTitle>
          <DialogDescription className="break-words">
            Клиент: {order.user_name} ({order.user_phone})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Новый статус</Label>
            <Select value={newStatus} onValueChange={onStatusChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {newStatus === 'rejected' && (
            <div>
              <Label>Причина отказа</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => onRejectionReasonChange(e.target.value)}
                placeholder="Укажите причину отказа..."
                rows={3}
              />
            </div>
          )}

          {isNonBarnaul && !order.delivery_zone_id && (
            <div className="space-y-2">
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded border border-amber-200 dark:border-amber-800">
                <Icon name="AlertCircle" size={18} className="text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="flex-1 text-sm">
                  <div className="font-medium text-amber-700 dark:text-amber-300">
                    Доставка за пределы Барнаула
                  </div>
                  <div className="text-muted-foreground mt-1">
                    Адрес: {order.delivery_address}
                  </div>
                  <div className="text-muted-foreground mt-1">
                    Укажите стоимость доставки, чтобы клиент мог её оплатить
                  </div>
                </div>
              </div>
              
              <div>
                <Label>Стоимость доставки (₽)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Введите стоимость доставки"
                  value={customDeliveryPrice}
                  onChange={(e) => onCustomDeliveryPriceChange(e.target.value)}
                />
                {order.custom_delivery_price && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Текущая цена: {order.custom_delivery_price}₽
                    {order.delivery_price_set_by_admin && !order.delivery_paid && (
                      <span className="text-amber-600 dark:text-amber-400"> (ожидает оплаты)</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <Label>Трек-номер отправления</Label>
            <Input
              placeholder="Например: RA123456789RU"
              value={trackingNumber}
              onChange={(e) => onTrackingNumberChange(e.target.value)}
            />
            {order.tracking_number && (
              <p className="text-xs text-muted-foreground mt-1">
                Текущий: {order.tracking_number}
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto min-h-[44px]">
              Отмена
            </Button>
            <Button onClick={onSave} className="w-full sm:w-auto min-h-[44px]">
              Сохранить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};