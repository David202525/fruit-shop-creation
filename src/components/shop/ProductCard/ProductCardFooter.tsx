import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Product } from './types';

interface ProductCardFooterProps {
  product: Product;
  hideMainPrice: boolean;
  onAddToCartClick: (e: React.MouseEvent) => void;
}

const ProductCardFooter = ({ 
  product, 
  hideMainPrice, 
  onAddToCartClick 
}: ProductCardFooterProps) => {
  return (
    <CardFooter className="flex gap-2 pt-3 sm:pt-4 px-3 sm:px-6">
      {!hideMainPrice && (
        <Button 
          className="flex-1 w-full min-h-[44px] text-sm sm:text-base" 
          onClick={onAddToCartClick}
          disabled={product.stock !== null && product.stock <= 0}
        >
          <Icon name="ShoppingCart" size={16} className="mr-1.5 sm:mr-2 flex-shrink-0" />
          {product.stock !== null && product.stock <= 0 ? 'Нет в наличии' : 'В корзину'}
        </Button>
      )}
    </CardFooter>
  );
};

export default ProductCardFooter;