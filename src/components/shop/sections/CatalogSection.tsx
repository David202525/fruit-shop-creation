import { useState } from 'react';
import ProductCard from '../ProductCard';
import ProductGalleryDialog from '../ProductGalleryDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/hooks/useAuth';

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

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
}

interface CatalogSectionProps {
  products: Product[];
  categories?: Category[];
  onAddToCart: (product: Product) => void;
  favoriteIds?: Set<number>;
  onToggleFavorite?: (productId: number) => void;
  siteSettings?: any;
  isAuthenticated?: boolean;
  userId?: number;
  onShowAuth?: () => void;
}

const CatalogSection = ({ products, categories = [], onAddToCart, favoriteIds, onToggleFavorite, siteSettings, isAuthenticated = false, userId, onShowAuth }: CatalogSectionProps) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const { user } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [showPumpkin, setShowPumpkin] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('default');

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsGalleryOpen(true);
  };

  const categoryFilters = [
    { id: 'all', name: 'Все растения' },
    ...categories.map(cat => ({ id: cat.name, name: cat.name }))
  ];

  let filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => p.category_name === activeCategory);

  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.category_name.toLowerCase().includes(query)
    );
  }

  switch (sortBy) {
    case 'price-asc':
      filteredProducts = [...filteredProducts].sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      filteredProducts = [...filteredProducts].sort((a, b) => b.price - a.price);
      break;
    case 'name-asc':
      filteredProducts = [...filteredProducts].sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'name-desc':
      filteredProducts = [...filteredProducts].sort((a, b) => b.name.localeCompare(a.name));
      break;
    default:
      break;
  }


  return (
    <div>
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold mb-6 sm:mb-8">Каталог растений</h2>
      
      {/* Debug info - только для админов */}
      {user?.is_admin && (
        <div className="mb-4 p-4 bg-muted rounded-lg">
          <p className="text-sm">Всего товаров: {products.length}</p>
          <p className="text-sm">Отфильтровано: {filteredProducts.length}</p>
          <p className="text-sm">Активная категория: {activeCategory}</p>
          <p className="text-sm">Поиск: {searchQuery || 'нет'}</p>
        </div>
      )}
      
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Icon name="Search" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Поиск товаров..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 py-4 sm:py-6 text-sm sm:text-base md:text-lg rounded-full shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon name="X" size={20} />
              </button>
            )}
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-[240px] py-4 sm:py-6 rounded-full text-sm sm:text-base">
              <div className="flex items-center gap-2">
                <Icon name="ArrowUpDown" size={18} />
                <SelectValue placeholder="Сортировка" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">По умолчанию</SelectItem>
              <SelectItem value="price-asc">Цена: по возрастанию</SelectItem>
              <SelectItem value="price-desc">Цена: по убыванию</SelectItem>
              <SelectItem value="name-asc">Название: А-Я</SelectItem>
              <SelectItem value="name-desc">Название: Я-А</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
        {categoryFilters.map(category => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`px-3 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm rounded-full font-medium transition-all flex items-center gap-1.5 sm:gap-2 min-h-[36px] sm:min-h-[40px] ${
              activeCategory === category.id
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {siteSettings?.logo_url && (
              <img 
                src={siteSettings.logo_url} 
                alt="Лого"
                className="h-5 w-5 rounded-full object-cover"
              />
            )}
            {category.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {filteredProducts.map(product => (
          <ProductCard 
            key={product.id} 
            product={product} 
            onAddToCart={onAddToCart}
            onViewDetails={handleViewDetails}
            isFavorite={favoriteIds?.has(product.id)}
            onToggleFavorite={onToggleFavorite}
            siteSettings={siteSettings}
            isAuthenticated={isAuthenticated}
            userId={userId}
            onShowAuth={onShowAuth}
          />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Icon name="SearchX" size={64} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-xl font-medium text-muted-foreground mb-2">
            {searchQuery ? 'Ничего не найдено' : 'В этой категории пока нет товаров'}
          </p>
          {searchQuery && (
            <p className="text-sm text-muted-foreground">
              Попробуйте изменить запрос или <button onClick={() => setSearchQuery('')} className="text-primary hover:underline">очистить поиск</button>
            </p>
          )}
        </div>
      )}

      <ProductGalleryDialog
        product={selectedProduct}
        open={isGalleryOpen}
        onOpenChange={setIsGalleryOpen}
        onAddToCart={onAddToCart}
      />
    </div>
  );
};

export default CatalogSection;