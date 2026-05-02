import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useState } from 'react';

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
}

const ProductsTab = ({ products, onAddProduct, onEditProduct, onDeleteProduct }: ProductsTabProps) => {
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
                      <Badge variant="outline" className="text-xs">Склад: {product.stock}</Badge>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
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
