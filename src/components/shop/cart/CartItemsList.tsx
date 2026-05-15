import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { CartItem } from '@/types/shop';

interface CartItemsListProps {
  cart: CartItem[];
  updateCartQuantity: (productId: number, quantity: number, size?: string) => void;
}

export const CartItemsList = ({ cart, updateCartQuantity }: CartItemsListProps) => {
  return (
    <>
      {cart.map((item, index) => (
        <div key={`${item.product.id}-${(item.product as any).selectedSize || ''}-${index}`} className="flex gap-3 items-start">
          <img
            src={item.product.image_url}
            alt={item.product.name}
            className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm sm:text-base leading-snug line-clamp-2">{item.product.name}</h4>
            {(item.product as any).selectedSize && (
              <p className="text-xs text-primary font-medium mt-0.5">Размер: {(item.product as any).selectedSize}</p>
            )}
            <p className="text-sm font-semibold text-foreground mt-0.5">{item.product.price} ₽</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              size="icon"
              variant="outline"
              className="w-10 h-10 min-w-[40px] min-h-[40px]"
              onClick={() => updateCartQuantity(item.product.id, item.quantity - 1, (item.product as any).selectedSize)}
            >
              <Icon name="Minus" size={14} />
            </Button>
            <span className="w-8 text-center font-semibold text-sm select-none">{item.quantity}</span>
            <Button
              size="icon"
              variant="outline"
              className="w-10 h-10 min-w-[40px] min-h-[40px]"
              onClick={() => updateCartQuantity(item.product.id, item.quantity + 1, (item.product as any).selectedSize)}
            >
              <Icon name="Plus" size={14} />
            </Button>
          </div>
        </div>
      ))}
    </>
  );
};