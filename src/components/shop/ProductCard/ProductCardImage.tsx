import React from 'react';
import Icon from '@/components/ui/icon';
import { Product, ProductImage } from './types';

interface ProductCardImageProps {
  product: Product;
  primaryImage: string;
  hasMultipleImages: boolean;
  onViewDetails: (product: Product) => void;
  userId?: number;
  isAuthenticated: boolean;
  onLogAction: (userId: number, action: string, description: string, entityType: string, entityId: number, metadata: any) => Promise<void>;
}

const ProductCardImage = ({ 
  product, 
  primaryImage, 
  hasMultipleImages, 
  onViewDetails, 
  userId, 
  isAuthenticated,
  onLogAction 
}: ProductCardImageProps) => {
  const primaryImageObj = product.images?.find(img => img.is_primary);
  const objectFit = (primaryImageObj?.object_fit as React.CSSProperties['objectFit']) || 'cover';

  return (
    <div className="relative group cursor-pointer aspect-[4/3] w-full overflow-hidden" onClick={async () => {
      onViewDetails(product);
      if (userId && isAuthenticated) {
        await onLogAction(
          userId,
          'view_product',
          `Просмотр товара: ${product.name}`,
          'product',
          product.id,
          { product_name: product.name, price: product.price, category: product.category_name }
        );
      }
    }}>
      {primaryImage && primaryImage.trim() !== '' ? (
        <>
          <img 
            src={primaryImage} 
            alt={product.name} 
            className="w-full h-full max-w-full"
            style={{ objectFit }}
          />
          {hasMultipleImages && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="text-white text-center">
                <Icon name="Images" size={28} className="mx-auto mb-1 sm:mb-2 sm:size-8" />
                <p className="text-xs sm:text-sm font-medium">Ещё {product.images!.length - 1} фото</p>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-full bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
          <div className="text-center text-gray-400 dark:text-gray-500">
            <Icon name="ImageOff" size={36} className="mx-auto mb-1 sm:mb-2 sm:size-12" />
            <p className="text-xs sm:text-sm font-medium">Картинка ещё не добавлена</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCardImage;