import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
}

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
  show_stock?: boolean;
  expected_date?: string;
}

interface ProductBasicFieldsProps {
  editingProduct: Product | null;
  categories: Category[];
  showStock: boolean;
  onShowStockChange: (checked: boolean) => void;
  variantsCount: number;
  hideMainPrice: boolean;
  onHideMainPriceChange: (checked: boolean) => void;
  isPopular: boolean;
  onIsPopularChange: (checked: boolean) => void;
}

const ProductBasicFields = ({ editingProduct, categories, showStock, onShowStockChange, variantsCount, hideMainPrice, onHideMainPriceChange, isPopular, onIsPopularChange }: ProductBasicFieldsProps) => {
  // Derive initial in-stock state: null/undefined = always in stock (true), >0 = in stock (true), <=0 = out of stock (false)
  const deriveInStock = (stock: number | null | undefined) => {
    if (stock === null || stock === undefined) return true;
    return stock > 0;
  };

  const [inStock, setInStock] = useState(() => deriveInStock(editingProduct?.stock));
  const [stockValue, setStockValue] = useState(() => {
    const s = editingProduct?.stock;
    if (s === null || s === undefined || s <= 0) return '';
    return String(s);
  });

  // Re-sync when editingProduct changes (dialog opens for a different product)
  useEffect(() => {
    setInStock(deriveInStock(editingProduct?.stock));
    const s = editingProduct?.stock;
    if (s === null || s === undefined || s <= 0) {
      setStockValue('');
    } else {
      setStockValue(String(s));
    }
  }, [editingProduct?.id, editingProduct?.stock]);

  const handleInStockToggle = (checked: boolean) => {
    setInStock(checked);
    if (!checked) {
      setStockValue('0');
    } else {
      setStockValue('');
    }
  };

  return (
    <>
      <div>
        <Label htmlFor="product-name" className="text-sm">Название товара *</Label>
        <Input 
          id="product-name" 
          name="name" 
          defaultValue={editingProduct?.name} 
          required 
          placeholder="Например: Яблоня Антоновка"
          className="mt-1 text-sm"
        />
      </div>
      <div>
        <Label htmlFor="product-description" className="text-sm">Описание</Label>
        <Textarea 
          id="product-description" 
          name="description" 
          defaultValue={editingProduct?.description}
          placeholder="Подробное описание товара"
          rows={3}
          className="mt-1 text-sm resize-none"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <Label htmlFor="product-price" className="text-sm">Цена (₽) *</Label>
          <Input 
            id="product-price" 
            name="price" 
            type="number" 
            step="0.01"
            defaultValue={editingProduct?.price} 
            required
            className="mt-1 text-sm"
          />
        </div>

        {/* Stock section */}
        <div className="space-y-2">
          {/* Toggle row */}
          <div className={cn(
            'flex items-center justify-between px-3 py-2 rounded-lg border transition-colors',
            inStock
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          )}>
            <div className="flex items-center gap-2">
              <Icon
                name={inStock ? 'CheckCircle' : 'XCircle'}
                size={16}
                className={inStock ? 'text-green-600' : 'text-red-500'}
              />
              <span className={cn(
                'text-sm font-medium',
                inStock ? 'text-green-700' : 'text-red-700'
              )}>
                {inStock ? 'Товар в наличии' : 'Нет в наличии'}
              </span>
            </div>
            <Switch
              checked={inStock}
              onCheckedChange={handleInStockToggle}
              className={cn(
                inStock
                  ? 'data-[state=checked]:bg-green-600'
                  : 'data-[state=unchecked]:bg-red-400'
              )}
            />
          </div>

          {/* Hidden field always submits the current stock value */}
          <input type="hidden" name="stock" value={inStock ? stockValue : '0'} />

          {/* Quantity field — only shown when in stock */}
          {inStock && (
            <div>
              <Label htmlFor="product-stock" className="text-sm text-muted-foreground">
                Количество на складе
              </Label>
              <Input
                id="product-stock"
                type="number"
                min="0"
                value={stockValue}
                onChange={(e) => setStockValue(e.target.value)}
                placeholder="Пусто — всегда в наличии"
                className="mt-1 text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Оставьте пустым, чтобы товар был всегда в наличии
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Expected arrival date — shown when out of stock */}
      {!inStock && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Icon name="CalendarClock" size={15} className="text-amber-600 flex-shrink-0" />
            <Label htmlFor="expected-date" className="text-sm font-medium text-amber-800">
              Ожидаемая дата поступления
            </Label>
          </div>
          <Input
            id="expected-date"
            name="expected_date"
            type="date"
            defaultValue={editingProduct?.expected_date || ''}
            className="mt-1 text-sm bg-white border-amber-200 focus-visible:ring-amber-400"
          />
          <p className="text-xs text-amber-700">
            Отображается на карточке товара, когда товара нет в наличии
          </p>
        </div>
      )}

      {/* Keep expected_date field in DOM (hidden) when in stock so it submits empty */}
      {inStock && (
        <input type="hidden" name="expected_date" value="" />
      )}

      <div>
        <Label htmlFor="product-category" className="text-sm">Категория *</Label>
        <Select name="category_id" defaultValue={editingProduct?.category_id?.toString()} required>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Выберите категорию" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id.toString()}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="show-stock"
            checked={showStock}
            onChange={(e) => onShowStockChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="show-stock" className="text-sm cursor-pointer">
            Показывать количество на складе покупателям
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is-popular"
            checked={isPopular}
            onChange={(e) => onIsPopularChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="is-popular" className="text-sm cursor-pointer">
            Популярный товар (отображается с меткой)
          </Label>
        </div>
        
        {variantsCount >= 2 && (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="hide-main-price"
              checked={hideMainPrice}
              onChange={(e) => onHideMainPriceChange(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="hide-main-price" className="text-sm cursor-pointer">
              Скрыть основную цену (показывать только цены вариантов)
            </Label>
          </div>
        )}
      </div>
    </>
  );
};

export default ProductBasicFields;
