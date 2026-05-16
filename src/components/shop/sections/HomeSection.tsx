import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import ProductCard from '../ProductCard';
import NewYearBanner from '../NewYearBanner';

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  image_url: string;
  category_name: string;
  stock: number;
  is_popular?: boolean;
}

interface HomeSectionProps {
  products: Product[];
  onNavigate: (section: string) => void;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  favoriteIds?: Set<number>;
  onToggleFavorite?: (productId: number) => void;
  siteSettings?: Record<string, unknown>;
  isAuthenticated?: boolean;
  userId?: number;
  onShowAuth?: () => void;
}

const features = [
  { icon: 'Truck', title: 'Быстрая доставка', desc: 'По всей России за 2–7 дней', color: 'text-blue-500', bg: 'bg-blue-50' },
  { icon: 'ShieldCheck', title: 'Гарантия качества', desc: 'Свежие саженцы с питомника', color: 'text-green-500', bg: 'bg-green-50' },
  { icon: 'Leaf', title: 'Живые растения', desc: 'Выращены с заботой о природе', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { icon: 'HeartHandshake', title: 'Поддержка 24/7', desc: 'Ответим на любой вопрос', color: 'text-rose-500', bg: 'bg-rose-50' },
];

const HomeSection = ({ products, onNavigate, onAddToCart, onViewDetails, favoriteIds, onToggleFavorite, siteSettings, isAuthenticated, userId, onShowAuth }: HomeSectionProps) => {

  const showNewYearBanner = siteSettings?.holiday_theme === 'new_year';
  const holidayTheme = siteSettings?.holiday_theme || 'none';
  
  const sortedProducts = [...products].sort((a, b) => {
    if (a.is_popular && !b.is_popular) return -1;
    if (!a.is_popular && b.is_popular) return 1;
    return 0;
  });
  
  const isPreorderActive = () => {
    if (!siteSettings?.preorder_enabled) return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (siteSettings.preorder_start_date) {
      const startDate = new Date(siteSettings.preorder_start_date);
      startDate.setHours(0, 0, 0, 0);
      if (now < startDate) return false;
    }
    if (siteSettings.preorder_end_date) {
      const endDate = new Date(siteSettings.preorder_end_date);
      endDate.setHours(23, 59, 59, 999);
      if (now > endDate) return false;
    }
    return true;
  };
  
  const getHeroContent = () => {
    switch (holidayTheme) {
      case 'new_year':
        return {
          badge: '🎄 Праздничная акция',
          title: 'Новогодняя\nраспродажа!',
          subtitle: 'Успейте купить растения со скидкой до конца года',
          gradient: 'from-red-600 via-green-700 to-emerald-800',
          glowColor: 'rgba(220,38,38,0.3)',
          icon: 'Gift' as const,
          particles: ['❄️', '🎄', '⛄', '✨', '🎁'],
        };
      case 'halloween':
        return {
          badge: '🎃 Хэллоуин',
          title: 'Жуткие скидки\nна Хэллоуин!',
          subtitle: 'Создайте свой мистический сад с нашими растениями',
          gradient: 'from-orange-700 via-purple-800 to-gray-900',
          glowColor: 'rgba(249,115,22,0.3)',
          icon: 'Ghost' as const,
          particles: ['🎃', '👻', '🕷️', '🦇', '🕸️'],
        };
      case 'summer':
        return {
          badge: '☀️ Летний сезон',
          title: 'Яркое лето\nв вашем саду!',
          subtitle: 'Яркие растения для вашего солнечного сада',
          gradient: 'from-yellow-500 via-orange-500 to-pink-600',
          glowColor: 'rgba(234,179,8,0.3)',
          icon: 'Sun' as const,
          particles: ['🌸', '🌺', '🌻', '☀️', '🦋'],
        };
      default:
        return {
          badge: '🌿 Питомник растений',
          title: 'Ваш сад мечты\nначинается здесь',
          subtitle: 'Плодовые и декоративные культуры высокого качества с доставкой по всей России',
          gradient: 'from-green-700 via-emerald-700 to-teal-800',
          glowColor: 'rgba(16,185,129,0.25)',
          icon: 'Sparkles' as const,
          particles: ['🌿', '🌱', '🍃', '🌸', '🌺'],
        };
    }
  };
  
  const heroContent = getHeroContent();
  
  return (
    <div className="space-y-12 md:space-y-20">
      {showNewYearBanner && <NewYearBanner />}
      
      {/* Уведомление о предзаказе */}
      {isPreorderActive() && (
        <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-500">
          <div className="relative p-6 md:p-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                  <Icon name="Calendar" size={32} className="text-white" />
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-2xl md:text-3xl font-bold">Режим предзаказа активен! 🌱</h3>
                <p className="text-blue-100 text-base md:text-lg leading-relaxed">
                  {siteSettings?.preorder_message || 'Предзаказ на весну 2026. Доставка с марта по май 2026 года.'}
                </p>
                {(siteSettings?.preorder_start_date || siteSettings?.preorder_end_date) && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {siteSettings?.preorder_start_date && (
                      <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur px-3 py-1.5 rounded-lg text-sm font-medium">
                        <Icon name="CalendarCheck" size={14} />
                        С {new Date(siteSettings.preorder_start_date).toLocaleDateString('ru-RU')}
                      </span>
                    )}
                    {siteSettings?.preorder_end_date && (
                      <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur px-3 py-1.5 rounded-lg text-sm font-medium">
                        <Icon name="CalendarClock" size={14} />
                        До {new Date(siteSettings.preorder_end_date).toLocaleDateString('ru-RU')}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <Button 
                onClick={() => onNavigate('catalog')} 
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50 font-bold shadow-lg hover:shadow-xl transition-all flex-shrink-0"
              >
                Оформить предзаказ
                <Icon name="ArrowRight" size={18} className="ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Hero секция */}
      <section className="relative overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 min-h-[320px] md:min-h-[400px] flex items-center">
        {/* Фоновый градиент */}
        <div className={`absolute inset-0 bg-gradient-to-br ${heroContent.gradient}`} />
        
        {/* Glow эффект */}
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-60 pointer-events-none"
          style={{ background: heroContent.glowColor }}
        />
        <div
          className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full blur-3xl opacity-40 pointer-events-none"
          style={{ background: heroContent.glowColor }}
        />

        {/* Плавающие частицы */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          {heroContent.particles.map((p, i) => (
            <span
              key={i}
              className="absolute text-2xl md:text-3xl opacity-20"
              style={{
                left: `${10 + i * 18}%`,
                top: `${15 + (i % 3) * 25}%`,
                animation: `float ${3 + i * 0.5}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.4}s`,
              }}
            >
              {p}
            </span>
          ))}
        </div>

        {/* Контент */}
        <div className="relative z-10 w-full px-6 sm:px-10 md:px-14 py-10 md:py-14">
          <div className="max-w-2xl">
            {/* Бейдж */}
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <span>{heroContent.badge}</span>
            </div>

            {/* Заголовок */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white leading-tight mb-5 whitespace-pre-line drop-shadow-lg">
              {heroContent.title}
            </h2>

            {/* Подзаголовок */}
            <p className="text-base md:text-lg text-white/80 max-w-lg mb-8 leading-relaxed">
              {heroContent.subtitle}
            </p>

            {/* CTA кнопки */}
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={() => onNavigate('catalog')}
                className="bg-white text-gray-900 hover:bg-white/90 font-bold shadow-xl hover:shadow-2xl transition-all text-base"
              >
                <Icon name={heroContent.icon} size={20} className="mr-2" />
                Перейти в каталог
              </Button>
              <Button
                size="lg"
                onClick={() => onNavigate('about')}
                className="bg-white/20 border border-white/50 text-white hover:bg-white/30 backdrop-blur-sm font-semibold text-base shadow-lg"
              >
                О нас
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Преимущества */}
      <section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex flex-col items-center text-center gap-3 p-4 sm:p-5 rounded-2xl border border-border/60 bg-card hover:shadow-md transition-shadow"
            >
              <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center`}>
                <Icon name={f.icon} size={24} className={f.color} />
              </div>
              <div>
                <p className="font-semibold text-sm sm:text-base text-foreground">{f.title}</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Популярные товары */}
      <section>
        <div className="flex items-end justify-between mb-6 sm:mb-8">
          <div>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-primary">Популярные товары</h3>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">Выбор наших покупателей</p>
          </div>
          <Button variant="ghost" onClick={() => onNavigate('catalog')} className="text-primary hidden sm:flex gap-1 items-center font-medium">
            Все товары
            <Icon name="ArrowRight" size={16} />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {sortedProducts.slice(0, 6).map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onAddToCart={onAddToCart}
              onViewDetails={onViewDetails}
              isFavorite={favoriteIds?.has(product.id)}
              onToggleFavorite={onToggleFavorite}
              siteSettings={siteSettings}
              isAuthenticated={isAuthenticated}
              userId={userId}
              onShowAuth={onShowAuth}
            />
          ))}
        </div>

        <div className="mt-6 flex justify-center sm:hidden">
          <Button variant="outline" onClick={() => onNavigate('catalog')} className="gap-2 font-medium">
            Весь каталог
            <Icon name="ArrowRight" size={16} />
          </Button>
        </div>
      </section>

      {/* Статистика */}
      <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-3xl p-8 md:p-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: products.length > 0 ? `${products.length}` : '...', label: 'видов растений' },
            { value: '10 лет', label: 'опыт питомника' },
            { value: '15 000+', label: 'довольных клиентов' },
            { value: '98%', label: 'приживаемость' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl md:text-4xl font-display font-bold text-primary">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CSS для анимации float */}
      <style>{`
        @keyframes float {
          from { transform: translateY(0px) rotate(0deg); }
          to { transform: translateY(-16px) rotate(6deg); }
        }
      `}</style>
    </div>
  );
};

export default HomeSection;