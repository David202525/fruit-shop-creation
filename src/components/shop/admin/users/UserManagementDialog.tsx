import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import BalanceTab from './BalanceTab';
import CashbackTab from './CashbackTab';
import LoyaltyTab from './LoyaltyTab';
import TransactionHistoryTab from './TransactionHistoryTab';
import BanUserTab from '../BanUserTab';
import ProfileTab from './ProfileTab';

interface User {
  id: number;
  phone: string;
  full_name: string;
  is_admin: boolean;
  balance?: number;
  cashback?: number;
  created_at: string;
  email?: string;
}

interface Transaction {
  id: number;
  user_id: number;
  type: string;
  amount: number;
  description: string;
  created_at: string;
}

interface LoyaltyCard {
  id: number;
  card_number: string;
  qr_code: string;
  is_active: boolean;
  purchased_at: string;
}

interface UserManagementDialogProps {
  selectedUser: User | null;
  operationType: string;
  amount: string;
  description: string;
  cashbackAmount: string;
  cashbackDescription: string;
  transactions: Transaction[];
  loadingTransactions: boolean;
  loyaltyCard: LoyaltyCard | null;
  loadingLoyalty: boolean;
  onClose: () => void;
  onOperationTypeChange: (type: string) => void;
  onAmountChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCashbackAmountChange: (value: string) => void;
  onCashbackDescriptionChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onAddCashback: () => void;
  onSubtractCashback: () => void;
  onRefreshTransactions: () => void;
  onRevokeLoyaltyCard: () => void;
  onIssueLoyaltyCard: () => void;
  onUpdateUser: () => void;
}

const UserManagementDialog = ({
  selectedUser,
  operationType,
  amount,
  description,
  cashbackAmount,
  cashbackDescription,
  transactions,
  loadingTransactions,
  loyaltyCard,
  loadingLoyalty,
  onClose,
  onOperationTypeChange,
  onAmountChange,
  onDescriptionChange,
  onCashbackAmountChange,
  onCashbackDescriptionChange,
  onSubmit,
  onAddCashback,
  onSubtractCashback,
  onRefreshTransactions,
  onRevokeLoyaltyCard,
  onIssueLoyaltyCard,
  onUpdateUser
}: UserManagementDialogProps) => {
  return (
    <Dialog open={!!selectedUser} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Управление пользователем</DialogTitle>
          <DialogDescription>
            {selectedUser?.full_name} ({selectedUser?.phone})
          </DialogDescription>
        </DialogHeader>

        <Tabs value={operationType} onValueChange={onOperationTypeChange}>
          <TabsList className="grid w-full grid-cols-6 h-auto">
            <TabsTrigger value="profile" className="flex flex-col items-center gap-1 py-2 text-xs">
              <Icon name="User" size={16} />
              <span className="hidden sm:inline">Профиль</span>
            </TabsTrigger>
            <TabsTrigger value="balance" className="flex flex-col items-center gap-1 py-2 text-xs">
              <Icon name="Wallet" size={16} />
              <span className="hidden sm:inline">Баланс</span>
            </TabsTrigger>
            <TabsTrigger value="cashback" className="flex flex-col items-center gap-1 py-2 text-xs">
              <Icon name="Gift" size={16} />
              <span className="hidden sm:inline">Кэшбэк</span>
            </TabsTrigger>
            <TabsTrigger value="loyalty" className="flex flex-col items-center gap-1 py-2 text-xs">
              <Icon name="CreditCard" size={16} />
              <span className="hidden sm:inline">Карта</span>
            </TabsTrigger>
            <TabsTrigger value="ban" className="flex flex-col items-center gap-1 py-2 text-xs">
              <Icon name="Ban" size={16} />
              <span className="hidden sm:inline">Бан</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex flex-col items-center gap-1 py-2 text-xs">
              <Icon name="Clock" size={16} />
              <span className="hidden sm:inline">История</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileTab
              selectedUser={selectedUser}
              onCancel={onClose}
              onUpdate={onUpdateUser}
            />
          </TabsContent>

          <TabsContent value="balance">
            <BalanceTab
              selectedUser={selectedUser}
              amount={amount}
              description={description}
              onAmountChange={onAmountChange}
              onDescriptionChange={onDescriptionChange}
              onSubmit={onSubmit}
              onCancel={onClose}
            />
          </TabsContent>

          <TabsContent value="cashback">
            <div className="text-sm text-muted-foreground mb-4">
              Используйте вкладку "Карта" для управления кэшбэком
            </div>
          </TabsContent>

          <TabsContent value="loyalty">
            <LoyaltyTab
              loadingLoyalty={loadingLoyalty}
              loyaltyCard={loyaltyCard}
              selectedUser={selectedUser}
              cashbackAmount={cashbackAmount}
              cashbackDescription={cashbackDescription}
              onCashbackAmountChange={onCashbackAmountChange}
              onCashbackDescriptionChange={onCashbackDescriptionChange}
              onAddCashback={onAddCashback}
              onSubtractCashback={onSubtractCashback}
              onRevokeLoyaltyCard={onRevokeLoyaltyCard}
              onIssueLoyaltyCard={onIssueLoyaltyCard}
            />
          </TabsContent>

          <TabsContent value="ban">
            <BanUserTab userId={selectedUser?.id || 0} userName={selectedUser?.full_name || ''} />
          </TabsContent>

          <TabsContent value="history">
            <TransactionHistoryTab
              transactions={transactions}
              loadingTransactions={loadingTransactions}
              onRefresh={onRefreshTransactions}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default UserManagementDialog;