import { useToast } from '@/hooks/use-toast';
import { Product, Category } from './types';
import { logAdminAction } from '@/utils/adminLogger';

interface UseAdminHandlersProps {
  user: any;
  API_PRODUCTS: string;
  API_CATEGORIES: string;
  API_AUTH: string;
  API_ORDERS: string;
  API_SETTINGS: string;
  siteSettings: any;
  loadProducts: () => void;
  loadCategories: () => void;
  loadUsers: () => void;
  loadOrders: () => void;
  loadSettings: () => void;
  onSettingsUpdate?: () => void;
  editingProduct: Product | null;
  editingCategory: Category | null;
  setShowProductDialog: (show: boolean) => void;
  setEditingProduct: (product: Product | null) => void;
  setShowCategoryDialog: (show: boolean) => void;
  setEditingCategory: (category: Category | null) => void;
}

export const useAdminHandlers = (props: UseAdminHandlersProps) => {
  const { toast } = useToast();

  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>, images: any[], variants: any[], showStock: boolean, hideMainPrice: boolean = false, isPopular: boolean = false) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const primaryImage = images.find(img => img.is_primary);
    const stockValue = formData.get('stock') as string;
    const expectedDate = formData.get('expected_date') as string;
    
    const productData = {
      id: props.editingProduct?.id,
      name: formData.get('name') as string,
      slug: (formData.get('name') as string).toLowerCase().replace(/\s+/g, '-'),
      description: formData.get('description') as string,
      price: parseFloat(formData.get('price') as string),
      image_url: primaryImage?.image_url || images[0]?.image_url || '',
      category_id: parseInt(formData.get('category_id') as string),
      stock: stockValue && stockValue.trim() !== '' ? parseInt(stockValue) : null,
      expected_date: expectedDate && expectedDate.trim() !== '' ? expectedDate : null,
      show_stock: showStock,
      hide_main_price: hideMainPrice,
      is_popular: isPopular,
      images: images,
      variants: variants
    };

    try {
      const response = await fetch(props.API_PRODUCTS, {
        method: props.editingProduct ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: props.editingProduct ? 'Товар обновлён' : 'Товар добавлен',
          description: productData.name
        });
        props.setShowProductDialog(false);
        props.setEditingProduct(null);
        props.loadProducts();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить товар',
        variant: 'destructive'
      });
    }
  };

  const handleSaveCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const categoryData = {
      id: props.editingCategory?.id,
      name: formData.get('name') as string,
      slug: (formData.get('name') as string).toLowerCase().replace(/\s+/g, '-').replace(/[а-яА-ЯёЁ]/g, (char) => {
        const translit: Record<string, string> = {
          'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z',
          'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r',
          'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
          'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
        };
        return translit[char.toLowerCase()] || char;
      }),
      description: formData.get('description') as string
    };

    try {
      const response = await fetch(props.API_CATEGORIES, {
        method: props.editingCategory ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData)
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: props.editingCategory ? 'Категория обновлена' : 'Категория добавлена',
          description: categoryData.name
        });
        props.setShowCategoryDialog(false);
        props.setEditingCategory(null);
        props.loadCategories();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить категорию',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteCategory = async (category: any) => {
    try {
      const response = await fetch(`${props.API_CATEGORIES}?id=${category.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Категория удалена',
          description: category.name
        });
        props.loadCategories();
      } else if (data.error && data.error.includes('products')) {
        const confirmDelete = confirm(`В категории "${category.name}" есть товары. Удалить категорию и все товары в ней?`);
        if (confirmDelete) {
          toast({
            title: 'Ошибка',
            description: 'Сначала переместите товары в другую категорию или удалите их',
            variant: 'destructive'
          });
        }
      } else {
        throw new Error(data.error || 'Failed to delete category');
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось удалить категорию',
        variant: 'destructive'
      });
    }
  };

  const handleAddBalance = async (userId: number, amount: number, description: string) => {
    try {
      const response = await fetch(props.API_AUTH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_balance',
          user_id: userId,
          amount,
          type: 'deposit',
          description: description || 'Пополнение баланса администратором'
        })
      });

      const data = await response.json();

      if (data.success) {
        await logAdminAction(
          props.user.id,
          amount > 0 ? 'balance_add' : 'balance_subtract',
          `${amount > 0 ? 'Пополнение' : 'Списание'} баланса: ${Math.abs(amount)}₽. ${description}`,
          userId,
          'balance',
          userId,
          { amount, description }
        );
        toast({
          title: 'Баланс пополнен',
          description: `Начислено ${amount}₽`
        });
        props.loadUsers();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось начислить баланс',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось начислить баланс',
        variant: 'destructive'
      });
    }
  };

  const handleAddCashback = async (userId: number, amount: number, description: string) => {
    try {
      const isDeduct = amount < 0;
      const response = await fetch(props.API_AUTH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_cashback',
          user_id: userId,
          amount,
          type: isDeduct ? 'cashback_deduct' : 'cashback_deposit',
          description: description || (isDeduct ? 'Списание кэшбэка администратором' : 'Начисление кэшбэка администратором')
        })
      });

      const data = await response.json();

      if (data.success) {
        await logAdminAction(
          props.user.id,
          isDeduct ? 'loyalty_subtract' : 'loyalty_add',
          `${isDeduct ? 'Списание' : 'Начисление'} баллов лояльности: ${Math.abs(amount)} баллов. ${description}`,
          userId,
          'loyalty',
          userId,
          { amount, description }
        );
        toast({
          title: isDeduct ? 'Кэшбэк списан' : 'Кэшбэк начислен',
          description: `${isDeduct ? 'Списано' : 'Начислено'} ${Math.abs(amount)}₽`
        });
        props.loadUsers();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || `Не удалось ${isDeduct ? 'списать' : 'начислить'} кэшбэк`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обработать операцию',
        variant: 'destructive'
      });
    }
  };

  const handleToggleAdmin = async (userId: number, isAdmin: boolean) => {
    try {
      const response = await fetch(props.API_AUTH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_admin',
          user_id: userId,
          is_admin: isAdmin
        })
      });

      const data = await response.json();

      if (data.success) {
        await logAdminAction(
          props.user.id,
          isAdmin ? 'admin_grant' : 'admin_revoke',
          `${isAdmin ? 'Назначение администратором' : 'Снятие прав администратора'}`,
          userId,
          'admin',
          userId,
          { is_admin: isAdmin }
        );
        toast({
          title: 'Права изменены',
          description: isAdmin ? 'Пользователь теперь администратор' : 'Права администратора удалены'
        });
        props.loadUsers();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось изменить права',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось изменить права',
        variant: 'destructive'
      });
    }
  };

  const handleIssueLoyaltyCard = async (userId: number) => {
    try {
      const response = await fetch('https://functions.poehali.dev/ed127250-fe9d-4c7e-9a93-fb8b7fdc038a', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: userId,
          admin_issue: true 
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Карта выдана',
          description: 'Карта лояльности успешно выдана администратором'
        });
        props.loadUsers();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось выдать карту',
          variant: 'destructive'
        });
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось выдать карту лояльности',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, status: string, rejectionReason?: string, customDeliveryPrice?: number | null, trackingNumber?: string) => {
    try {
      const response = await fetch(props.API_ORDERS, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          order_id: orderId, 
          status,
          rejection_reason: rejectionReason,
          custom_delivery_price: customDeliveryPrice,
          tracking_number: trackingNumber ?? undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        await logAdminAction(
          props.user.id,
          'order_update',
          `Обновление статуса заказа #${orderId}: ${status}${rejectionReason ? `. Причина: ${rejectionReason}` : ''}${customDeliveryPrice != null ? `. Цена доставки: ${customDeliveryPrice}₽` : ''}${trackingNumber ? `. Трек: ${trackingNumber}` : ''}`,
          undefined,
          'order',
          orderId,
          { status, rejection_reason: rejectionReason, custom_delivery_price: customDeliveryPrice, tracking_number: trackingNumber }
        );
        toast({
          title: 'Статус обновлён',
          description: `Заказ #${orderId} теперь: ${status}${trackingNumber ? `. Трек: ${trackingNumber}` : ''}`
        });
        props.loadOrders();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить статус',
        variant: 'destructive'
      });
    }
  };



  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const getFormValue = (key: string) => {
      if (formData.has(key)) {
        return formData.get(key);
      }
      return props.siteSettings?.[key];
    };
    
    const getCheckboxValue = (key: string) => {
      return formData.get(key) === 'on';
    };
    
    const getNumberValue = (key: string, defaultValue: number) => {
      if (formData.has(key)) {
        return parseFloat(formData.get(key) as string);
      }
      return props.siteSettings?.[key] ?? defaultValue;
    };
    
    const settingsData = {
      site_name: getFormValue('site_name') || '',
      logo_url: getFormValue('logo_url') || '',
      site_description: getFormValue('site_description') || '',
      phone: getFormValue('phone') || '',
      email: getFormValue('email') || '',
      address: getFormValue('address') || '',
      work_hours: getFormValue('work_hours') || '',
      admin_pin: getFormValue('admin_pin') || '0000',
      loyalty_card_price: getNumberValue('loyalty_card_price', 500),
      loyalty_unlock_amount: getNumberValue('loyalty_unlock_amount', 5000),
      loyalty_cashback_percent: getNumberValue('loyalty_cashback_percent', 5),
      balance_payment_cashback_percent: getNumberValue('balance_payment_cashback_percent', 5),
      holiday_theme: getFormValue('holiday_theme') || 'none',
      is_maintenance_mode: formData.get('is_maintenance_mode') === 'true',
      maintenance_reason: getFormValue('maintenance_reason') || 'Сайт временно закрыт на техническое обслуживание',
      auto_maintenance_enabled: formData.get('auto_maintenance_enabled') === 'true',
      maintenance_start_time: getFormValue('maintenance_start_time') || null,
      maintenance_end_time: getFormValue('maintenance_end_time') || null,
      delivery_enabled: getCheckboxValue('delivery_enabled'),
      pickup_enabled: getCheckboxValue('pickup_enabled'),
      preorder_enabled: getCheckboxValue('preorder_enabled'),
      preorder_message: getFormValue('preorder_message') || '',
      preorder_start_date: getFormValue('preorder_start_date') || null,
      preorder_end_date: getFormValue('preorder_end_date') || null,
      delivery_price: getNumberValue('delivery_price', 0),
      free_delivery_min: getNumberValue('free_delivery_min', 3000),
      courier_delivery_price: getNumberValue('courier_delivery_price', 300),
      price_list_url: getFormValue('price_list_url') || '',
      promotions: getFormValue('promotions') || '',
      additional_info: getFormValue('additional_info') || '',
      about_title: getFormValue('about_title') || '',
      about_text: getFormValue('about_text') || '',
      care_title: getFormValue('care_title') || '',
      care_watering_title: getFormValue('care_watering_title') || '',
      care_watering_text: getFormValue('care_watering_text') || '',
      care_lighting_title: getFormValue('care_lighting_title') || '',
      care_lighting_text: getFormValue('care_lighting_text') || '',
      care_pruning_title: getFormValue('care_pruning_title') || '',
      care_pruning_text: getFormValue('care_pruning_text') || '',
      delivery_title: getFormValue('delivery_title') || '',
      delivery_courier_title: getFormValue('delivery_courier_title') || '',
      delivery_courier_text: getFormValue('delivery_courier_text') || '',
      delivery_transport_title: getFormValue('delivery_transport_title') || '',
      delivery_transport_text: getFormValue('delivery_transport_text') || '',
      delivery_pickup_title: getFormValue('delivery_pickup_title') || '',
      delivery_pickup_text: getFormValue('delivery_pickup_text') || '',
      payment_title: getFormValue('payment_title') || '',
      payment_methods: formData.has('payment_methods') 
        ? (formData.get('payment_methods') as string).split('\n').filter(m => m.trim()) 
        : (props.siteSettings?.payment_methods || []),
      alfabank_login: getFormValue('alfabank_login') || '',
      alfabank_password: getFormValue('alfabank_password') || '',
      show_online_counter: getCheckboxValue('show_online_counter'),
      online_boost: getNumberValue('online_boost', 0)
    };
    
    console.log('Saving settings:', {
      delivery_enabled: settingsData.delivery_enabled,
      pickup_enabled: settingsData.pickup_enabled,
      preorder_enabled: settingsData.preorder_enabled,
      is_maintenance_mode: settingsData.is_maintenance_mode,
      auto_maintenance_enabled: settingsData.auto_maintenance_enabled,
      maintenance_start_time: settingsData.maintenance_start_time,
      maintenance_end_time: settingsData.maintenance_end_time
    });

    try {
      const response = await fetch(props.API_SETTINGS, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData)
      });

      const data = await response.json();

      if (data.success) {
        await logAdminAction(
          props.user.id,
          'settings_update',
          'Обновление настроек сайта',
          undefined,
          'settings',
          1,
          settingsData
        );
        toast({
          title: 'Настройки сохранены',
          description: 'Изменения применены на сайте'
        });
        await props.loadSettings();
        if (props.onSettingsUpdate) {
          props.onSettingsUpdate();
        }
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить настройки',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm('Удалить заказ? Это действие нельзя отменить.')) return;
    
    try {
      const response = await fetch(props.API_ORDERS, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Заказ удалён',
          description: `Заказ #${orderId} был удалён`
        });
        props.loadOrders();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить заказ',
        variant: 'destructive'
      });
    }
  };



  const handleUpdateItemStock = async (orderId: number, itemId: number, isOutOfStock: boolean) => {
    try {
      const response = await fetch(props.API_ORDERS, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          item_id: itemId,
          is_out_of_stock: isOutOfStock
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: isOutOfStock ? 'Товар отмечен как отсутствующий' : 'Товар отмечен как доступный',
          description: `Статус наличия обновлён в заказе #${orderId}`
        });
        props.loadOrders();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить наличие товара',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateItemAvailability = async (itemId: number, availableQuantity: number, availablePrice?: number) => {
    try {
      const response = await fetch(props.API_ORDERS, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          item_id: itemId,
          available_quantity: availableQuantity,
          available_price: availablePrice
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Доступность обновлена',
          description: `Установлено: ${availableQuantity} шт.${availablePrice ? ` по ${availablePrice}₽` : ''}`
        });
        props.loadOrders();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить доступность товара',
        variant: 'destructive'
      });
    }
  };

  const handleToggleStock = async (product: Product, inStock: boolean) => {
    try {
      const updatedProduct = {
        ...product,
        stock: inStock ? null : 0
      };

      const response = await fetch(props.API_PRODUCTS, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct)
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: inStock ? 'Товар в наличии' : 'Нет в наличии',
          description: inStock
            ? `"${product.name}" отмечен как доступный`
            : `"${product.name}" отмечен как недоступный`
        });
        props.loadProducts();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось обновить наличие',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить наличие товара',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('Удалить товар? Это действие нельзя отменить.')) return;
    
    try {
      const response = await fetch(props.API_PRODUCTS, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Товар удалён',
          description: 'Товар успешно удалён из каталога'
        });
        props.loadProducts();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось удалить товар',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить товар',
        variant: 'destructive'
      });
    }
  };

  const handleUpdatePermissions = async (userId: number, permissions: string[], isSuperAdmin: boolean) => {
    try {
      const response = await fetch(props.API_AUTH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_permissions',
          user_id: userId,
          permissions,
          is_super_admin: isSuperAdmin
        })
      });

      const data = await response.json();

      if (data.success) {
        await logAdminAction(
          props.user.id,
          'permissions_update',
          `Обновление прав доступа${isSuperAdmin ? ' (назначен супер-администратор)' : ''}`,
          userId,
          'permissions',
          userId,
          { permissions, is_super_admin: isSuperAdmin }
        );
        toast({
          title: 'Права обновлены',
          description: 'Права доступа успешно изменены'
        });
        props.loadUsers();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось обновить права',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить права доступа',
        variant: 'destructive'
      });
    }
  };

  return {
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
  };
};