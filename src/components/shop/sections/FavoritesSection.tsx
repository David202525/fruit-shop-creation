import { useState } from 'react';
import ProductCard from '../ProductCard';
import ProductGalleryDialog from '../ProductGalleryDialog';
import Icon from '@/components/ui/icon';

interface ProductImage {
  id?: number;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  image_url: string;
  category_name: string;
  stock: number;
  images?: ProductImage[];
}

interface Favorite {
  id: number;
  product_id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  slug: string;
  stock: number;
  show_stock?: boolean;
  expected_date?: string;
}

interface FavoritesSectionProps {
  favorites: Favorite[];
  onAddToCart: (product: Product) => void;
  favoriteIds: Set<number>;
  onToggleFavorite: (productId: number) => void;
  siteSettings?: any;
  onClose?: () => void;
  isAuthenticated?: boolean;
  userId?: number;
  onShowAuth?: () => void;
}

const FavoritesSection = ({ favorites, onAddToCart, favoriteIds, onToggleFavorite, siteSettings, onClose, isAuthenticated, userId, onShowAuth }: FavoritesSectionProps) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsGalleryOpen(true);
  };

  const convertToProduct = (fav: Favorite): Product => ({
    id: fav.product_id,
    name: fav.name,
    slug: fav.slug,
    description: fav.description,
    price: fav.price,
    image_url: fav.image_url,
    category_name: '',
    stock: fav.stock,
    show_stock: fav.show_stock,
    expected_date: fav.expected_date
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <Icon name="Heart" size={24} className="text-red-500 sm:size-8 flex-shrink-0" />
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold">Избранное</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
            aria-label="Вернуться на главную"
          >
            <Icon name="X" size={24} />
          </button>
        )}
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-20">
          <Icon name="Heart" size={64} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Избранное пусто</h3>
          <p className="text-muted-foreground">
            Добавляйте товары в избранное, нажимая на ❤️ на карточках товаров
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {favorites.map(fav => {
            const product = convertToProduct(fav);
            return (
              <ProductCard 
                key={fav.id} 
                product={product} 
                onAddToCart={onAddToCart}
                onViewDetails={handleViewDetails}
                isFavorite={favoriteIds.has(fav.product_id)}
                onToggleFavorite={onToggleFavorite}
                siteSettings={siteSettings}
                isAuthenticated={isAuthenticated}
                userId={userId}
                onShowAuth={onShowAuth}
              />
            );
          })}
        </div>
      )}

      <ProductGalleryDialog
        product={selectedProduct}
        open={isGalleryOpen}
        onOpenChange={setIsGalleryOpen}
        onAddToCart={onAddToCart}
        isAuthenticated={isAuthenticated}
        onShowAuth={onShowAuth}
      />

      <div className="mt-12 pt-6 border-t text-center space-y-1">
        <p className="text-xs text-muted-foreground font-medium">Самозанятый Бояринцев Вадим Вячеславович</p>
        <p className="text-xs text-muted-foreground">ИНН: 222261894107</p>
      </div>
    </div>
  );
};

export default FavoritesSection;