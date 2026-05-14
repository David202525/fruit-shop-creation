import { lazy, Suspense } from 'react';
import HomeSection from '@/components/shop/sections/HomeSection';
import CatalogSection from '@/components/shop/sections/CatalogSection';
import FavoritesSection from '@/components/shop/sections/FavoritesSection';
import AboutSection from '@/components/shop/sections/AboutSection';
import DeliverySection from '@/components/shop/sections/DeliverySection';
import CareSection from '@/components/shop/sections/CareSection';
import ContactsSection from '@/components/shop/sections/ContactsSection';
import GallerySection from '@/components/shop/sections/GallerySection';
import { Product } from '@/types/shop';

const CourierPage = lazy(() => import('@/pages/CourierPage'));

interface MainContentProps {
  isLoading: boolean;
  currentSection: string;
  products: Product[];
  categories?: { id: number; name: string; slug: string }[];
  favorites: Product[];
  favoriteIds: Set<number>;
  siteSettings: Record<string, unknown>;
  isAuthenticated: boolean;
  userId?: number;
  onSectionChange: (section: string) => void;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  onToggleFavorite: (productId: number) => void;
  onShowAuth: () => void;
}

const MainContent = ({
  isLoading,
  currentSection,
  products,
  categories,
  favorites,
  favoriteIds,
  siteSettings,
  isAuthenticated,
  userId,
  onSectionChange,
  onAddToCart,
  onViewDetails,
  onToggleFavorite,
  onShowAuth
}: MainContentProps) => {

  
  if (currentSection === 'courier') {
    return (
      <Suspense fallback={
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }>
        <CourierPage />
      </Suspense>
    );
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {currentSection === 'home' && (
        <HomeSection
          products={products}
          onNavigate={onSectionChange}
          onAddToCart={onAddToCart}
          onViewDetails={onViewDetails}
          favoriteIds={favoriteIds}
          onToggleFavorite={onToggleFavorite}
          siteSettings={siteSettings}
          isAuthenticated={isAuthenticated}
          userId={userId}
          onShowAuth={onShowAuth}
        />
      )}

      {currentSection === 'catalog' && (
        <CatalogSection
          products={products}
          categories={categories}
          onAddToCart={onAddToCart}
          favoriteIds={favoriteIds}
          onToggleFavorite={onToggleFavorite}
          siteSettings={siteSettings}
          isAuthenticated={isAuthenticated}
          userId={userId}
          onShowAuth={onShowAuth}
        />
      )}

      {currentSection === 'favorites' && (
        <FavoritesSection
          favorites={favorites}
          onAddToCart={onAddToCart}
          favoriteIds={favoriteIds}
          onToggleFavorite={onToggleFavorite}
          siteSettings={siteSettings}
          onClose={() => onSectionChange('catalog')}
          isAuthenticated={isAuthenticated}
          userId={userId}
          onShowAuth={onShowAuth}
        />
      )}

      {currentSection === 'about' && <AboutSection siteSettings={siteSettings} />}

      {currentSection === 'delivery' && <DeliverySection siteSettings={siteSettings} />}

      {currentSection === 'care' && <CareSection siteSettings={siteSettings} />}

      {currentSection === 'contacts' && <ContactsSection settings={siteSettings} />}

      {currentSection === 'gallery' && <GallerySection />}
    </>
  );
};

export default MainContent;