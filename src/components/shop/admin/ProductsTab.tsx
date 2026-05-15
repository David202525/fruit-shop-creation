import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  image_url: string;
  category_id: number;
  category_name: string;
  stock: number;
  is_active: boolean;
  expected_date?: string;
}

interface ProductsTabProps {
  products: Product[];
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: number) => void;
  onToggleStock?: (product: Product, inStock: boolean) => void;
}

const getStockBadge = (stock: number | null | undefined) => {
  if (stock === null || stock === undefined) {
    return { label: 'Всегда в наличии', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: 'Infinity' as const };
  }
  if (stock <= 0) {
    return { label: 'Нет в наличии', color: 'bg-red-100 text-red-700 border-red-200', icon: 'XCircle' as const };
  }
  return { label: `В наличии: ${stock} шт.`, color: 'bg-green-100 text-green-700 border-green-200', icon: 'CheckCircle' as const };
};

const isOutOfStock = (stock: number | null | undefined) =>
  stock !== null && stock !== undefined && stock <= 0;

const ProductsTab = ({ products, onAddProduct, onEditProduct, onDeleteProduct, onToggleStock }: ProductsTabProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map(p => p.id));
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Удалить выбранные товары (${selectedIds.length} шт.)? Это действие нельзя отменить.`)) {
      return;
    }
    for (const id of selectedIds) {
      await onDeleteProduct(id);
    }
    setSelectedIds([]);
  };

  const allSelected = filteredProducts.length > 0 && selectedIds.length === filteredProducts.length;

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-xl sm:text-2xl font-semibold">Управление товарами</h2>
        <Button onClick={onAddProduct} className="w-full sm:w-auto" size="default">
          <Icon name="Plus" size={16} className="sm:mr-2" />
          <span className="hidden sm:inline">Добавить товар</span>
          <span className="sm:hidden">Добавить</span>
        </Button>
      </div>

      <div className="relative">
        <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input 
          placeholder="Поиск товаров по названию, категории, описанию..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredProducts.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-muted/50 rounded-lg border">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
              className="w-5 h-5 cursor-pointer accent-red-600"
            />
            <span className="text-sm font-medium">
              {selectedIds.length > 0 ? `Выбрано: ${selectedIds.length}` : 'Выбрать все'}
            </span>
          </label>
          {selectedIds.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              style={{ backgroundColor: '#dc2626', color: 'white' }}
              className="w-full sm:w-auto hover:opacity-90"
            >
              <Icon name="Trash2" size={16} className="mr-2" />
              Удалить выбранные ({selectedIds.length})
            </Button>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:gap-4">
        {filteredProducts.length === 0 && searchQuery ? (
          <div className="text-center py-8 text-muted-foreground">
            <Icon name="SearchX" size={48} className="mx-auto mb-2 opacity-50" />
            <p>Товары не найдены</p>
          </div>
        ) : (
          filteredProducts.map(product => (
            <Card key={product.id} className={selectedIds.includes(product.id) ? 'ring-2 ring-red-500' : ''}>
              <CardHeader className="p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(product.id)}
                    onChange={() => toggleSelect(product.id)}
                    className="w-5 h-5 cursor-pointer accent-red-600 mt-1 flex-shrink-0"
                  />
                  <img 
                    src={product.image_url} 
                    alt={product.name} 
                    className="w-full sm:w-20 h-32 sm:h-20 object-cover rounded flex-shrink-0" 
                  />
                  <div className="flex-1 min-w-0 w-full">
                    <CardTitle className="text-base sm:text-lg">{product.name}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm mt-1">{product.category_name}</CardDescription>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">{product.price} ₽</Badge>
                      {(() => {
                        const badge = getStockBadge(product.stock);
                        return (
                          <span className={cn(
                            'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border',
                            badge.color
                          )}>
                            <Icon name={badge.icon} size={12} />
                            {badge.label}
                          </span>
                        );
                      })()}
                      {product.expected_date && isOutOfStock(product.stock) && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                          <Icon name="CalendarClock" size={12} />
                          Ожидается: {new Date(product.expected_date).toLocaleDateString('ru-RU')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    {onToggleStock && (
                      isOutOfStock(product.stock) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onToggleStock(product, true)}
                          className="w-full sm:w-auto border-green-400 text-green-700 hover:bg-green-50 hover:border-green-500"
                        >
                          <Icon name="CheckCircle" size={16} className="mr-2 text-green-600" />
                          <span>В наличии</span>
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onToggleStock(product, false)}
                          className="w-full sm:w-auto border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                        >
                          <Icon name="XCircle" size={16} className="mr-2 text-red-500" />
                          <span>Нет в наличии</span>
                        </Button>
                      )
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onEditProduct(product)}
                      className="w-full sm:w-auto"
                    >
                      <Icon name="Pencil" size={16} className="mr-2" />
                      <span>Изменить</span>
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => {
                        if (window.confirm('Удалить товар? Это действие нельзя отменить.')) {
                          onDeleteProduct(product.id);
                        }
                      }}
                      style={{ backgroundColor: '#dc2626', color: 'white' }}
                      className="w-full sm:w-auto hover:opacity-90"
                    >
                      <Icon name="Trash2" size={16} className="mr-2" />
                      <span>Удалить товар</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductsTab;