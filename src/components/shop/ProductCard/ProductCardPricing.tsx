import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Product, ProductVariant } from './types';

interface ProductCardPricingProps {
  product: Product;
  hideMainPrice: boolean;
  showStock: boolean;
  hasVariants: boolean;
  onAddVariantToCart: (e: React.MouseEvent, variant: ProductVariant) => void;
}

const ProductCardPricing = ({ 
  product, 
  hideMainPrice, 
  showStock, 
  hasVariants,
  onAddVariantToCart 
}: ProductCardPricingProps) => {
  return (
    <div className="mt-3 sm:mt-4">
      {hideMainPrice ? (
        <div className="space-y-2">
          <div className="flex flex-col gap-2">
            {product.variants!.map((variant, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 border rounded-lg hover:border-primary transition-colors">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {variant.size}
                  </Badge>
                  <span className="text-base sm:text-lg font-bold text-primary">{variant.price} ₽</span>
                </div>
                <Button 
                  size="sm"
                  variant="ghost"
                  onClick={(e) => onAddVariantToCart(e, variant)}
                  className="h-10 w-full sm:w-auto"
                >
                  <Icon name="ShoppingCart" size={16} className="mr-1" />
                  В корзину
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-lg sm:text-xl md:text-2xl font-bold text-primary">{product.price} ₽</span>
          {showStock && product.stock !== null && product.stock > 0 && (
            <span className="text-xs sm:text-sm text-muted-foreground">
              В наличии: {product.stock} шт.
            </span>
          )}
        </div>
      )}
      {hasVariants && !hideMainPrice && (
        <div className="mt-2 sm:mt-3 space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Доступные варианты:</p>
          <div className="flex flex-wrap gap-1.5">
            {product.variants!.map((variant, idx) => (
              <Badge 
                key={idx}
                variant="secondary" 
                className="text-xs px-2 py-1 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={(e) => onAddVariantToCart(e, variant)}
              >
                {variant.size} - {variant.price} ₽
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCardPricing;