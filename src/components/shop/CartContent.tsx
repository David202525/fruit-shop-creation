import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { CartItem, User } from '@/types/shop';
import { useState, useEffect } from 'react';
import { CartItemsList } from './cart/CartItemsList';
import { PreorderBanner } from './cart/PreorderBanner';
import { CitySelector } from './cart/CitySelector';
import { DeliveryOptions } from './cart/DeliveryOptions';
import { PriceSummary } from './cart/PriceSummary';
import { PaymentMethods } from './cart/PaymentMethods';

interface DeliveryZone {
  id: number;
  zone_name: string;
  delivery_price: string;
}

interface CartContentProps {
  cart: CartItem[];
  user: User | null;
  updateCartQuantity: (productId: number, quantity: number, size?: string) => void;
  getTotalPrice: () => number;
  handleCheckout: (paymentMethod: string, deliveryType: string, deliveryZoneId?: number, city?: string, address?: string, customerEmail?: string) => void;
  siteSettings?: Record<string, unknown>;
}

const russianCities = [
  'Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань',
  'Нижний Новгород', 'Челябинск', 'Самара', 'Омск', 'Ростов-на-Дону',
  'Уфа', 'Красноярск', 'Воронеж', 'Пермь', 'Волгоград',
  'Краснодар', 'Саратов', 'Тюмень', 'Тольятти', 'Ижевск',
  'Барнаул', 'Ульяновск', 'Иркутск', 'Хабаровск', 'Ярославль',
  'Владивосток', 'Махачкала', 'Томск', 'Оренбург', 'Кемерово',
  'Новокузнецк', 'Рязань', 'Набережные Челны', 'Астрахань', 'Пенза',
  'Липецк', 'Киров', 'Чебоксары', 'Тула', 'Калининград',
  'Курск', 'Улан-Удэ', 'Ставрополь', 'Магнитогорск', 'Сочи',
  'Белгород', 'Нижний Тагил', 'Владимир', 'Архангельск', 'Калуга',
  'Сургут', 'Севастополь', 'Симферополь', 'Тверь', 'Чита',
  'Смоленск', 'Курган', 'Орёл', 'Владикавказ', 'Грозный',
  'Мурманск', 'Тамбов', 'Петрозаводск', 'Нижневартовск', 'Йошкар-Ола',
  'Новороссийск', 'Кострома', 'Таганрог', 'Комсомольск-на-Амуре', 'Стерлитамак',
  'Братск', 'Нальчик', 'Дзержинск', 'Орск', 'Сыктывкар',
  'Нижнекамск', 'Ангарск', 'Шахты', 'Старый Оскол', 'Великий Новгород',
  'Благовещенск', 'Энгельс', 'Псков', 'Бийск', 'Прокопьевск',
  'Рыбинск', 'Балаково', 'Армавир', 'Северодвинск', 'Королёв',
  'Петропавловск-Камчатский', 'Мытищи', 'Люберцы', 'Южно-Сахалинск', 'Волжский',
  'Подольск', 'Саранск', 'Абакан', 'Вологда', 'Норильск',
  'Якутск', 'Черкесск', 'Каменск-Уральский', 'Красногорск', 'Химки',
  'Электросталь', 'Майкоп', 'Салават', 'Альметьевск', 'Пятигорск',
  'Назрань', 'Одинцово', 'Миасс', 'Березники', 'Рубцовск',
  'Уссурийск', 'Новочеркасск', 'Копейск', 'Находка', 'Домодедово',
  'Первоуральск', 'Серпухов', 'Новомосковск', 'Дербент', 'Щёлково',
  'Черкесск', 'Новочебоксарск', 'Каспийск', 'Сызрань', 'Обнинск'
];

const CartContent = ({ 
  cart, 
  user, 
  updateCartQuantity, 
  getTotalPrice, 
  handleCheckout,
  siteSettings 
}: CartContentProps) => {
  const [deliveryType, setDeliveryType] = useState('pickup');
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [isCityDialogOpen, setIsCityDialogOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  
  const deliveryEnabled = siteSettings?.delivery_enabled === true;
  const pickupEnabled = siteSettings?.pickup_enabled === true;
  const preorderSettings = siteSettings?.preorder_enabled || false;
  const preorderMessage = siteSettings?.preorder_message || 'Предзаказ на весну 2026. Доставка с марта по май 2026 года.';
  const preorderStartDate = siteSettings?.preorder_start_date;
  const preorderEndDate = siteSettings?.preorder_end_date;
  
  const isPreorderActive = () => {
    if (!preorderSettings) return false;
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    if (preorderStartDate) {
      const startDate = new Date(preorderStartDate);
      startDate.setHours(0, 0, 0, 0);
      if (now < startDate) return false;
    }
    
    if (preorderEndDate) {
      const endDate = new Date(preorderEndDate);
      endDate.setHours(23, 59, 59, 999);
      if (now > endDate) return false;
    }
    
    return true;
  };
  
  const preorderEnabled = isPreorderActive();
  const deliveryPrice = parseFloat(siteSettings?.delivery_price || 0);
  const courierDeliveryPrice = parseFloat(siteSettings?.courier_delivery_price || 0);
  const freeDeliveryMin = parseFloat(siteSettings?.free_delivery_min || 0);
  const pickupAddress = siteSettings?.address || '';
  
  useEffect(() => {
    if (pickupEnabled && !deliveryEnabled) {
      setDeliveryType('pickup');
    } else if (deliveryEnabled && !pickupEnabled) {
      setDeliveryType('delivery');
    } else if (pickupEnabled) {
      setDeliveryType('pickup');
    }
  }, [pickupEnabled, deliveryEnabled]);
  
  useEffect(() => {
    const loadZones = async () => {
      try {
        const response = await fetch('https://functions.poehali.dev/8c8e301f-2323-4f3b-85f0-14a3c210e670');
        const data = await response.json();
        setDeliveryZones(data.zones || []);
      } catch (error) {
        console.error('Failed to load delivery zones:', error);
      }
    };
    
    if (deliveryEnabled) {
      loadZones();
    }
  }, [deliveryEnabled]);
  
  const getZoneDeliveryPrice = () => {
    if (selectedCity === 'Барнаул') {
      if (!selectedZoneId) return deliveryPrice + courierDeliveryPrice;
      const zone = deliveryZones.find(z => z.id === selectedZoneId);
      return zone ? parseFloat(zone.delivery_price) : deliveryPrice + courierDeliveryPrice;
    }
    return 0;
  };
  
  const getFinalPrice = () => {
    const basePrice = getTotalPrice();
    if (deliveryType === 'delivery' && selectedCity === 'Барнаул') {
      const isFreeDelivery = freeDeliveryMin > 0 && basePrice >= freeDeliveryMin;
      const totalDeliveryFee = isFreeDelivery ? 0 : getZoneDeliveryPrice();
      return basePrice + totalDeliveryFee;
    }
    return basePrice;
  };
  
  const getDeliveryFee = () => {
    if (selectedCity !== 'Барнаул') return 0;
    const basePrice = getTotalPrice();
    const isFreeDelivery = freeDeliveryMin > 0 && basePrice >= freeDeliveryMin;
    return isFreeDelivery ? 0 : getZoneDeliveryPrice();
  };

  const filteredCities = russianCities.filter(city =>
    city.toLowerCase().includes(citySearchQuery.toLowerCase())
  );

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    setDeliveryCity(city);
    setIsCityDialogOpen(false);
    setCitySearchQuery('');
  };

  const isCashPaymentAvailable = selectedCity === 'Барнаул';

  return (
    <div className="mt-4 sm:mt-6 space-y-4">
      {!user ? (
        <div className="text-center py-8 space-y-4">
          <Icon name="ShoppingCart" size={48} className="mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Войдите, чтобы оформить заказ</p>
          <Button onClick={() => window.location.reload()} className="mx-auto min-h-[44px]">
            <Icon name="LogIn" size={18} className="mr-2" />
            Войти для покупки
          </Button>
        </div>
      ) : cart.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">Корзина пуста</p>
      ) : (
        <>
          <div className="space-y-3">
            <CartItemsList cart={cart} updateCartQuantity={updateCartQuantity} />
          </div>
          
          <Separator />
          
          {preorderEnabled && (
            <PreorderBanner
              preorderMessage={preorderMessage}
              preorderStartDate={preorderStartDate}
              preorderEndDate={preorderEndDate}
            />
          )}
          
          <div className="space-y-3 bg-muted/30 p-3 rounded-lg">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Icon name="MapPin" size={16} className="flex-shrink-0" />
              Город и способ получения
            </h4>
            
            <CitySelector
              selectedCity={selectedCity}
              isOpen={isCityDialogOpen}
              searchQuery={citySearchQuery}
              filteredCities={filteredCities}
              onOpenChange={setIsCityDialogOpen}
              onSearchChange={setCitySearchQuery}
              onCitySelect={handleCitySelect}
            />
            
            <DeliveryOptions
              deliveryType={deliveryType}
              deliveryEnabled={deliveryEnabled}
              pickupEnabled={pickupEnabled}
              pickupAddress={pickupAddress}
              selectedCity={selectedCity}
              deliveryZones={deliveryZones}
              selectedZoneId={selectedZoneId}
              deliveryAddress={deliveryAddress}
              getDeliveryFee={getDeliveryFee}
              onDeliveryTypeChange={setDeliveryType}
              onZoneChange={setSelectedZoneId}
              onAddressChange={setDeliveryAddress}
            />
          </div>

          <Separator />
          
          <PriceSummary
            totalPrice={getTotalPrice()}
            deliveryType={deliveryType}
            deliveryFee={getDeliveryFee()}
            finalPrice={getFinalPrice()}
            preorderEnabled={preorderEnabled}
          />
          
          {/* Email для уведомлений */}
          <div className="space-y-2 bg-muted/30 p-3 rounded-lg">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Icon name="Mail" size={16} className="flex-shrink-0" />
              Email для уведомлений о заказе
            </h4>
            <input
              type="email"
              placeholder="Введите ваш email (необязательно)"
              value={customerEmail}
              onChange={e => setCustomerEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground">Мы пришлём статус заказа на эту почту</p>
          </div>

          <div className="space-y-3 bg-muted/30 p-3 rounded-lg">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Icon name="CreditCard" size={16} className="flex-shrink-0" />
              Способ оплаты
            </h4>
            
            <PaymentMethods
              user={user}
              selectedCity={selectedCity}
              isCashPaymentAvailable={isCashPaymentAvailable}
              preorderEnabled={preorderEnabled}
              finalPrice={getFinalPrice()}
              totalPrice={getTotalPrice()}
              deliveryType={deliveryType}
              deliveryEnabled={deliveryEnabled}
              pickupEnabled={pickupEnabled}
              deliveryAddress={deliveryAddress}
              selectedZoneId={selectedZoneId}
              deliveryCity={deliveryCity}
              onCheckout={(pm, dt, zoneId, city, addr) => handleCheckout(pm, dt, zoneId, city, addr, customerEmail)}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default CartContent;