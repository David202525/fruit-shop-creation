import { useState, useEffect } from 'react';
import { useAdminData } from './useAdminData';
import { useAdminHandlers } from './useAdminHandlers';
import AdminPanelHeader from './AdminPanelHeader';
import AdminPanelTabs from './AdminPanelTabs';
import ProductDialog from './ProductDialog';
import CategoryDialog from './CategoryDialog';
import AdminPinDialog from './AdminPinDialog';
import AdminOnlineStatus from '@/components/AdminOnlineStatus';
import AdminTeamChat from '@/components/AdminTeamChat';
import { Product, Category } from './types';

interface AdminPanelProps {
  user: any;
  onClose: () => void;
  onSettingsUpdate?: () => void;
}

const AdminPanel = ({ user, onClose, onSettingsUpdate }: AdminPanelProps) => {
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(true);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    const verified = localStorage.getItem('admin_pin_verified');
    const expiry = localStorage.getItem('admin_pin_expiry');
    
    if (verified === 'true' && expiry) {
      const expiryTime = parseInt(expiry, 10);
      if (Date.now() < expiryTime) {
        setIsPinVerified(true);
        setShowPinDialog(false);
      }
    }
  }, []);

  const {
    products,
    categories,
    users,
    orders,
    siteSettings,
    loadProducts,
    loadCategories,
    loadSettings,
    loadUsers,
    loadOrders,
    API_PRODUCTS,
    API_CATEGORIES,
    API_SETTINGS,
    API_AUTH,
    API_ORDERS
  } = useAdminData();

  const {
    handleSaveProduct,
    handleSaveCategory,
    handleDeleteCategory,
    handleAddBalance,
    handleAddCashback,
    handleToggleAdmin,
    handleIssueLoyaltyCard,
    handleUpdateOrderStatus,
    handleSaveSettings,
    handleDeleteOrder,
    handleUpdateItemStock,
    handleUpdateItemAvailability,
    handleDeleteProduct,
    handleUpdatePermissions,
    handleToggleStock
  } = useAdminHandlers({
    user,
    API_PRODUCTS,
    API_CATEGORIES,
    API_AUTH,
    API_ORDERS,
    API_SETTINGS,
    siteSettings,
    loadProducts,
    loadCategories,
    loadUsers,
    loadOrders,
    loadSettings,
    onSettingsUpdate,
    editingProduct,
    editingCategory,
    setShowProductDialog,
    setEditingProduct,
    setShowCategoryDialog,
    setEditingCategory
  });

  const openProductDialog = (product?: Product) => {
    setEditingProduct(product || null);
    setShowProductDialog(true);
  };

  const currentUser = users.find(u => u.id === user.id);

  const handlePinSuccess = () => {
    setIsPinVerified(true);
    setShowPinDialog(false);
  };

  const handlePinCancel = () => {
    onClose();
  };

  if (!isPinVerified) {
    return (
      <AdminPinDialog
        open={showPinDialog}
        onSuccess={handlePinSuccess}
        onCancel={handlePinCancel}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <AdminPanelHeader onClose={onClose} />

        <div className="mb-6">
          <AdminOnlineStatus />
        </div>

        <AdminPanelTabs
          products={products}
          categories={categories}
          users={users}
          orders={orders}
          siteSettings={siteSettings}
          userId={user.id}
          currentUser={currentUser!}
          onAddProduct={() => openProductDialog()}
          onEditProduct={openProductDialog}
          onDeleteProduct={handleDeleteProduct}
          onToggleStock={handleToggleStock}
          onAddCategory={() => setShowCategoryDialog(true)}
          onEditCategory={(category) => {
            setEditingCategory(category);
            setShowCategoryDialog(true);
          }}
          onDeleteCategory={handleDeleteCategory}
          onAddBalance={handleAddBalance}
          onAddCashback={handleAddCashback}
          onToggleAdmin={handleToggleAdmin}
          onIssueLoyaltyCard={handleIssueLoyaltyCard}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onSaveSettings={handleSaveSettings}
          onDeleteOrder={handleDeleteOrder}
          onUpdateItemStock={handleUpdateItemStock}
          onUpdateItemAvailability={handleUpdateItemAvailability}
          onRefreshUsers={loadUsers}
          onUpdatePermissions={handleUpdatePermissions}
        />
      </div>

      <ProductDialog 
        open={showProductDialog}
        onOpenChange={setShowProductDialog}
        editingProduct={editingProduct}
        categories={categories}
        onSubmit={handleSaveProduct}
      />

      <CategoryDialog 
        open={showCategoryDialog}
        onOpenChange={setShowCategoryDialog}
        editingCategory={editingCategory}
        onSubmit={handleSaveCategory}
        onCancel={() => {
          setShowCategoryDialog(false);
          setEditingCategory(null);
        }}
      />

      <AdminTeamChat />
    </div>
  );
};

export default AdminPanel;