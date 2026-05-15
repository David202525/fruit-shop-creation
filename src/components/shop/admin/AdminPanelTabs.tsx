import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import ProductsTab from './ProductsTab';
import CategoriesTab from './CategoriesTab';
import UsersTab from './UsersTab';
import OrdersTab from './OrdersTab';
import SettingsTab from './SettingsTab';
import LoyaltyScannerTab from './LoyaltyScannerTab';
import PagesTab from './PagesTab';
import CodesTab from './CodesTab';
import DeliveryZonesTab from './DeliveryZonesTab';
import PlantsInventoryTab from './PlantsInventoryTab';
import PermissionsTab from './PermissionsTab';
import GalleryTab from './GalleryTab';
import LogsTab from './LogsTab';
import SupportChatTab from './SupportChatTab';
import OrdersStatsCard from './OrdersStatsCard';
import CourierManagement from './CourierManagement';
import StatisticsTab from './StatisticsTab';
import ReferralStatsTab from './ReferralStatsTab';
import HolidaySettingsTab from './HolidaySettingsTab';
import { Product, Category, User } from './types';

interface AdminPanelTabsProps {
  products: Product[];
  categories: Category[];
  users: User[];
  orders: any[];
  siteSettings: any;
  userId: number;
  currentUser: User;
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: number) => void;
  onAddCategory: () => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (category: Category) => void;
  onAddBalance: (userId: number, amount: number, description: string) => void;
  onAddCashback: (userId: number, amount: number, description: string) => void;
  onToggleAdmin: (userId: number, isAdmin: boolean) => void;
  onIssueLoyaltyCard: (userId: number) => Promise<void>;
  onUpdateOrderStatus: (orderId: number, status: string, rejectionReason?: string, customDeliveryPrice?: number | null, trackingNumber?: string) => void;
  onSaveSettings: (e: React.FormEvent<HTMLFormElement>) => void;
  onDeleteOrder: (orderId: number) => void;
  onUpdateItemStock?: (orderId: number, itemId: number, isOutOfStock: boolean) => void;
  onUpdateItemAvailability?: (itemId: number, availableQuantity: number, availablePrice?: number) => void;
  onRefreshUsers?: () => void;
  onUpdatePermissions: (userId: number, permissions: string[], isSuperAdmin: boolean) => void;
}

const AdminPanelTabs = ({
  products,
  categories,
  users,
  orders,
  siteSettings,
  userId,
  currentUser,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onAddBalance,
  onAddCashback,
  onToggleAdmin,
  onIssueLoyaltyCard,
  onUpdateOrderStatus,
  onReplyToTicket,
  onUpdateTicketStatus,
  onLoadTicket,
  onSaveSettings,
  onDeleteOrder,
  onDeleteTicket,
  onUpdateItemStock,
  onUpdateItemAvailability,
  onRefreshUsers,
  onUpdatePermissions
}: AdminPanelTabsProps) => {
  const isSuperAdmin = currentUser?.is_super_admin || false;
  const userPermissions = currentUser?.admin_permissions || [];

  const hasPermission = (permission: string) => {
    return isSuperAdmin || userPermissions.includes(permission);
  };

  const visibleTabsCount = [
    hasPermission('products'),
    hasPermission('categories'),
    hasPermission('plants'),
    hasPermission('users'),
    hasPermission('orders'),
    hasPermission('delivery-zones'),
    hasPermission('loyalty'),
    hasPermission('gallery'),
    hasPermission('pages'),
    hasPermission('codes'),
    hasPermission('settings'),
    hasPermission('support'),
    hasPermission('couriers'),
    isSuperAdmin,
    isSuperAdmin,
    isSuperAdmin,
    isSuperAdmin
  ].filter(Boolean).length;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('admin_active_tab') || 'products';
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    localStorage.setItem('admin_active_tab', value);
    setIsSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile menu button */}
      <Button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg"
        size="icon"
      >
        <Icon name={isSidebarOpen ? "X" : "Menu"} size={24} />
      </Button>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex gap-0 lg:gap-4 relative w-full">
        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <TabsList className={`
          flex flex-col w-64 h-fit gap-1 p-2 
          fixed lg:sticky top-0 lg:top-4 left-0 bottom-0 lg:bottom-auto
          bg-background z-50 lg:z-auto
          border-r border-border shadow-xl lg:shadow-none
          transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          overflow-y-auto
        `}>
        {hasPermission('products') && (
          <TabsTrigger 
            value="products" 
            className="flex items-center justify-start gap-3 px-4 py-2.5 w-full"
          >
            <Icon name="Package" size={18} className="shrink-0" />
            <span className="text-sm font-medium">Товары</span>
          </TabsTrigger>
        )}
        {hasPermission('categories') && (
          <TabsTrigger 
            value="categories" 
            className="flex items-center justify-start gap-3 px-4 py-2.5 w-full"
          >
            <Icon name="FolderTree" size={18} className="shrink-0" />
            <span className="text-sm font-medium">Категории</span>
          </TabsTrigger>
        )}
        {hasPermission('plants') && (
          <TabsTrigger 
            value="plants" 
            className="flex items-center justify-start gap-3 px-4 py-2.5 w-full"
          >
            <Icon name="Sprout" size={18} className="shrink-0" />
            <span className="text-sm font-medium">Растения</span>
          </TabsTrigger>
        )}
        {hasPermission('users') && (
          <TabsTrigger 
            value="users" 
            className="flex items-center justify-start gap-3 px-4 py-2.5 w-full"
          >
            <Icon name="Users" size={18} className="shrink-0" />
            <span className="text-sm font-medium">Пользователи</span>
          </TabsTrigger>
        )}
        {hasPermission('orders') && (
          <TabsTrigger 
            value="orders" 
            className="flex items-center justify-start gap-3 px-4 py-2.5 w-full"
          >
            <Icon name="ShoppingCart" size={18} className="shrink-0" />
            <span className="text-sm font-medium">Заказы</span>
          </TabsTrigger>
        )}
        {isSuperAdmin && (
          <TabsTrigger 
            value="referrals" 
            className="flex items-center justify-start gap-3 px-4 py-2.5 w-full"
          >
            <Icon name="UserPlus" size={18} className="shrink-0" />
            <span className="text-sm font-medium">Рефералы</span>
          </TabsTrigger>
        )}
        {hasPermission('delivery-zones') && (
          <TabsTrigger 
            value="delivery-zones" 
            className="flex items-center justify-start gap-3 px-4 py-2.5 w-full"
          >
            <Icon name="MapPin" size={18} className="shrink-0" />
            <span className="text-sm font-medium">Зоны</span>
          </TabsTrigger>
        )}
        {hasPermission('loyalty') && (
          <TabsTrigger 
            value="loyalty" 
            className="flex items-center justify-start gap-3 px-4 py-2.5 w-full"
          >
            <Icon name="ScanLine" size={18} className="shrink-0" />
            <span className="text-sm font-medium">QR-Сканер</span>
          </TabsTrigger>
        )}
        {hasPermission('gallery') && (
          <TabsTrigger 
            value="gallery" 
            className="flex items-center justify-start gap-3 px-4 py-2.5 w-full"
          >
            <Icon name="Image" size={18} className="shrink-0" />
            <span className="text-sm font-medium">Галерея</span>
          </TabsTrigger>
        )}
        {hasPermission('pages') && (
          <TabsTrigger 
            value="pages" 
            className="flex items-center justify-start gap-3 px-4 py-2.5 w-full"
          >
            <Icon name="FileText" size={18} className="shrink-0" />
            <span className="text-sm font-medium">Страницы</span>
          </TabsTrigger>
        )}
        {hasPermission('codes') && (
          <TabsTrigger 
            value="codes" 
            className="flex items-center justify-start gap-3 px-4 py-2.5 w-full"
          >
            <Icon name="KeyRound" size={18} className="shrink-0" />
            <span className="text-sm font-medium">Коды</span>
          </TabsTrigger>
        )}
        {hasPermission('settings') && (
          <TabsTrigger 
            value="settings" 
            className="flex items-center justify-start gap-3 px-4 py-2.5 w-full"
          >
            <Icon name="Settings" size={18} className="shrink-0" />
            <span className="text-sm font-medium">Настройки</span>
          </TabsTrigger>
        )}
        {isSuperAdmin && (
          <TabsTrigger 
            value="permissions" 
            className="flex items-center justify-start gap-3 px-4 py-2.5 w-full"
          >
            <Icon name="Shield" size={18} className="shrink-0" />
            <span className="text-sm font-medium">Права</span>
          </TabsTrigger>
        )}
        {isSuperAdmin && (
          <TabsTrigger 
            value="logs" 
            className="flex items-center justify-start gap-3 px-4 py-2.5 w-full"
          >
            <Icon name="ScrollText" size={18} className="shrink-0" />
            <span className="text-sm font-medium">Логи</span>
          </TabsTrigger>
        )}
        {hasPermission('support') && (
          <TabsTrigger 
            value="support-chat" 
            className="flex items-center justify-start gap-3 px-4 py-2.5 w-full"
          >
            <Icon name="MessageCircle" size={18} className="shrink-0" />
            <span className="text-sm font-medium">Поддержка</span>
          </TabsTrigger>
        )}
        {(isSuperAdmin || currentUser?.is_courier) && (
          <TabsTrigger 
            value="couriers" 
            className="flex items-center justify-start gap-3 px-4 py-2.5 w-full"
          >
            <Icon name="Truck" size={18} className="shrink-0" />
            <span className="text-sm font-medium">Курьеры</span>
          </TabsTrigger>
        )}
        {isSuperAdmin && (
          <TabsTrigger 
            value="statistics" 
            className="flex items-center justify-start gap-3 px-4 py-2.5 w-full"
          >
            <Icon name="BarChart3" size={18} className="shrink-0" />
            <span className="text-sm font-medium">Статистика</span>
          </TabsTrigger>
        )}
        {isSuperAdmin && (
          <TabsTrigger 
            value="holidays" 
            className="flex items-center justify-start gap-3 px-4 py-2.5 w-full"
          >
            <Icon name="Calendar" size={18} className="shrink-0" />
            <span className="text-sm font-medium">Праздники</span>
          </TabsTrigger>
        )}
      </TabsList>

      <div className="flex-1 min-w-0 w-full lg:w-auto pb-20 lg:pb-0">
      {hasPermission('products') && (
        <TabsContent value="products" className="mt-0">
          <ProductsTab 
            products={products}
            onAddProduct={onAddProduct}
            onEditProduct={onEditProduct}
            onDeleteProduct={onDeleteProduct}
          />
        </TabsContent>
      )}

      {hasPermission('categories') && (
        <TabsContent value="categories" className="mt-0">
          <CategoriesTab 
            categories={categories}
            onAddCategory={onAddCategory}
            onEditCategory={onEditCategory}
            onDeleteCategory={onDeleteCategory}
          />
        </TabsContent>
      )}

      {hasPermission('users') && (
        <TabsContent value="users" className="mt-0">
          <UsersTab 
            users={users} 
            onAddBalance={onAddBalance} 
            onAddCashback={onAddCashback}
            onToggleAdmin={onToggleAdmin}
            onIssueLoyaltyCard={onIssueLoyaltyCard}
            onRefreshUsers={onRefreshUsers}
          />
        </TabsContent>
      )}

      {hasPermission('plants') && (
        <TabsContent value="plants" className="mt-0">
          <PlantsInventoryTab />
        </TabsContent>
      )}

      {hasPermission('orders') && (
        <TabsContent value="orders" className="mt-0">
          <OrdersTab 
            orders={orders} 
            onUpdateStatus={onUpdateOrderStatus} 
            onDeleteOrder={onDeleteOrder}
            onUpdateItemStock={onUpdateItemStock}
            onUpdateItemAvailability={onUpdateItemAvailability}
          />
        </TabsContent>
      )}

      {hasPermission('loyalty') && (
        <TabsContent value="loyalty" className="mt-0">
          <LoyaltyScannerTab />
        </TabsContent>
      )}

      {hasPermission('gallery') && (
        <TabsContent value="gallery" className="mt-0">
          <GalleryTab />
        </TabsContent>
      )}

      {hasPermission('pages') && (
        <TabsContent value="pages" className="mt-0">
          <PagesTab 
            siteSettings={siteSettings}
            onSaveSettings={onSaveSettings}
          />
        </TabsContent>
      )}

      {hasPermission('delivery-zones') && (
        <TabsContent value="delivery-zones" className="mt-0">
          <DeliveryZonesTab />
        </TabsContent>
      )}

      {hasPermission('codes') && (
        <TabsContent value="codes" className="mt-0">
          <CodesTab userId={userId} />
        </TabsContent>
      )}

      {hasPermission('settings') && (
        <TabsContent value="settings" className="mt-0">
          <SettingsTab 
            siteSettings={siteSettings}
            onSaveSettings={onSaveSettings}
          />
        </TabsContent>
      )}

      {isSuperAdmin && (
        <TabsContent value="permissions" className="mt-0">
          <PermissionsTab
            users={users}
            currentUserId={userId}
            onUpdatePermissions={onUpdatePermissions}
          />
        </TabsContent>
      )}

      {isSuperAdmin && (
        <TabsContent value="logs" className="mt-0">
          <LogsTab />
        </TabsContent>
      )}

      {hasPermission('support') && (
        <TabsContent value="support-chat" className="mt-0">
          <SupportChatTab 
            userId={userId}
            userName={currentUser?.full_name || 'Администратор'}
            isSuperAdmin={isSuperAdmin}
          />
        </TabsContent>
      )}

      {(isSuperAdmin || currentUser?.is_courier) && (
        <TabsContent value="couriers" className="mt-0">
          <CourierManagement />
        </TabsContent>
      )}

      {isSuperAdmin && (
        <TabsContent value="statistics" className="mt-0">
          <StatisticsTab />
        </TabsContent>
      )}

      {isSuperAdmin && (
        <TabsContent value="referrals" className="mt-0">
          <ReferralStatsTab />
        </TabsContent>
      )}

      {isSuperAdmin && (
        <TabsContent value="holidays" className="mt-0">
          <HolidaySettingsTab />
        </TabsContent>
      )}
      </div>
    </Tabs>
    </>
  );
};

export default AdminPanelTabs;