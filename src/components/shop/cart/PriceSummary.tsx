import { Separator } from '@/components/ui/separator';

interface PriceSummaryProps {
  totalPrice: number;
  deliveryType: string;
  deliveryFee: number;
  finalPrice: number;
  preorderEnabled: boolean;
}

export const PriceSummary = ({
  totalPrice,
  deliveryType,
  deliveryFee,
  finalPrice,
  preorderEnabled
}: PriceSummaryProps) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">Товары:</span>
        <span>{totalPrice} ₽</span>
      </div>
      {deliveryType === 'delivery' && deliveryFee > 0 && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Доставка:</span>
          <span>{deliveryFee} ₽</span>
        </div>
      )}
      <Separator />
      {preorderEnabled ? (
        <>
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Итого:</span>
            <span className="line-through">{finalPrice} ₽</span>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-300 dark:border-blue-700 rounded p-2">
            <div className="flex flex-wrap justify-between items-center gap-1">
              <span className="text-blue-900 dark:text-blue-100 font-bold text-sm sm:text-base">К оплате (предоплата 50%):</span>
              <span className="text-blue-900 dark:text-blue-100 font-bold text-sm sm:text-base whitespace-nowrap">{(totalPrice * 0.5).toFixed(2)} ₽</span>
            </div>
            <p className="text-[10px] text-blue-700 dark:text-blue-300 mt-1">Вторая часть заказа и доставка — после обработки</p>
          </div>
        </>
      ) : (
        <div className="flex justify-between items-center font-bold text-base sm:text-lg">
          <span>Итого:</span>
          <span className="whitespace-nowrap">{finalPrice} ₽</span>
        </div>
      )}
    </div>
  );
};