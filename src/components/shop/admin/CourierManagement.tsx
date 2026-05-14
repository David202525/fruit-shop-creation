import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Courier {
  id: number;
  full_name: string;
  phone: string;
  is_courier: boolean;
  created_at: string;
  total_deliveries: number;
  total_earned: number;
  paid_out: number;
  pending: number;
}

interface User {
  id: number;
  full_name: string;
  phone: string;
  is_courier: boolean;
}

export default function CourierManagement() {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchPhone, setSearchPhone] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadCouriers();
  }, []);

  const loadCouriers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'admin_get_couriers' })
      });
      
      const data = await res.json();
      if (data.success) {
        setCouriers(data.couriers);
      }
    } catch (error) {
      console.error('Failed to load couriers:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить список курьеров',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      const res = await fetch('/api/auth?action=get_all_users');
      const data = await res.json();

      if (data.users) {
        setAllUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить пользователей',
        variant: 'destructive'
      });
    }
  };

  const toggleCourierStatus = async (userId: number, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'admin_toggle_courier',
          user_id: userId,
          is_courier: !currentStatus
        })
      });
      
      const data = await res.json();
      if (data.success) {
        toast({
          title: 'Успешно',
          description: currentStatus ? 'Права курьера отозваны' : 'Права курьера назначены'
        });
        loadCouriers();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось изменить статус',
        variant: 'destructive'
      });
    }
  };

  const payoutCourier = async (courierId: number, courierName: string) => {
    if (!confirm(`Выплатить все накопленные средства курьеру ${courierName}?`)) {
      return;
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'admin_payout_courier',
          courier_id: courierId
        })
      });
      
      const data = await res.json();
      if (data.success) {
        toast({
          title: 'Выплата выполнена',
          description: `Выплачено: ${data.amount}₽`
        });
        loadCouriers();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось выполнить выплату',
        variant: 'destructive'
      });
    }
  };

  const handleAddCourier = () => {
    setShowAddDialog(true);
    loadAllUsers();
  };

  const filteredUsers = allUsers.filter(user => {
    if (!user || user.is_courier) return false;
    
    const searchLower = searchPhone.toLowerCase();
    const phoneMatch = user.phone?.toLowerCase().includes(searchLower);
    const nameMatch = user.full_name?.toLowerCase().includes(searchLower);
    
    return phoneMatch || nameMatch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Управление курьерами</h2>
          <p className="text-muted-foreground">Назначение прав и выплаты</p>
        </div>
        <Button onClick={handleAddCourier}>
          <Icon name="UserPlus" size={18} className="mr-2" />
          Добавить курьера
        </Button>
      </div>

      {couriers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Icon name="Users" size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-muted-foreground">Нет курьеров в системе</p>
            <Button onClick={handleAddCourier} className="mt-4">
              Добавить первого курьера
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {couriers.map((courier) => (
            <Card key={courier.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="User" size={20} />
                      {courier.full_name || courier.phone}
                    </CardTitle>
                    <CardDescription>{courier.phone}</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={courier.is_courier}
                      onCheckedChange={() => toggleCourierStatus(courier.id, courier.is_courier)}
                    />
                    <Badge variant={courier.is_courier ? 'default' : 'secondary'}>
                      {courier.is_courier ? 'Активен' : 'Неактивен'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Доставок</p>
                    <p className="text-2xl font-bold">{courier.total_deliveries}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Заработано</p>
                    <p className="text-2xl font-bold text-green-600">{courier.total_earned}₽</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">К выплате</p>
                    <p className="text-2xl font-bold text-orange-600">{courier.pending}₽</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Выплачено</p>
                    <p className="text-2xl font-bold text-gray-600">{courier.paid_out}₽</p>
                  </div>
                </div>

                {courier.pending > 0 && (
                  <Button 
                    onClick={() => payoutCourier(courier.id, courier.full_name || courier.phone)}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Icon name="Banknote" size={18} className="mr-2" />
                    Выплатить {courier.pending}₽
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Добавить курьера</DialogTitle>
            <DialogDescription>
              Выберите пользователя из списка для назначения прав курьера
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Input
                placeholder="Поиск по телефону или имени..."
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Найдено: {filteredUsers.length} пользователей
              </p>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {allUsers.length === 0 ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Загрузка...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Пользователи не найдены
                </p>
              ) : (
                filteredUsers.map((user) => (
                  <Card key={user.id} className="cursor-pointer hover:bg-accent">
                    <CardContent className="py-3" onClick={async () => {
                      await toggleCourierStatus(user.id, false);
                      setShowAddDialog(false);
                      setSearchPhone('');
                    }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{user.full_name || 'Без имени'}</p>
                          <p className="text-sm text-muted-foreground">{user.phone}</p>
                        </div>
                        <Icon name="UserPlus" size={20} className="text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}