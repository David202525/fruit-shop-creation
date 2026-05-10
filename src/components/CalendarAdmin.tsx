import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import type { HolidayKey } from '@/utils/holidaySettings';

interface Prize {
  id: string;
  name: string;
  description: string;
  type: 'free_delivery' | 'cashback' | 'discount' | 'gift';
  value?: number;
  requiresLoyaltyCard?: boolean;
  icon: string;
}

interface CalendarAdminProps {
  holiday: HolidayKey;
  onClose: () => void;
}

const CalendarAdmin = ({ holiday, onClose }: CalendarAdminProps) => {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const iconOptions = [
    'Gift', 'Truck', 'Percent', 'BadgePercent', 'Star', 'Heart', 
    'Sparkles', 'Award', 'Crown', 'Gem', 'Package', 'ShoppingBag'
  ];

  const prizeTypes = [
    { value: 'free_delivery', label: 'Бесплатная доставка' },
    { value: 'cashback', label: 'Кэшбек' },
    { value: 'discount', label: 'Скидка' },
    { value: 'gift', label: 'Подарок' }
  ];

  useEffect(() => {
    loadPrizes();
  }, [holiday]);

  const loadPrizes = () => {
    const saved = localStorage.getItem(`prizes_${holiday}`);
    if (saved) {
      setPrizes(JSON.parse(saved));
    } else {
      const defaultPrizes = getDefaultPrizes();
      setPrizes(defaultPrizes);
      savePrizes(defaultPrizes);
    }
  };

  const getDefaultPrizes = (): Prize[] => {
    return [
      {
        id: Date.now().toString(),
        name: 'Бесплатная доставка',
        description: 'Бесплатная доставка на следующий заказ',
        type: 'free_delivery',
        icon: 'Truck'
      },
      {
        id: (Date.now() + 1).toString(),
        name: 'Кэшбек 10%',
        description: 'Получите 10% кэшбэка на карту лояльности',
        type: 'cashback',
        value: 10,
        requiresLoyaltyCard: true,
        icon: 'Percent'
      },
      {
        id: (Date.now() + 2).toString(),
        name: 'Скидка 20%',
        description: 'Скидка 20% на следующую покупку',
        type: 'discount',
        value: 20,
        icon: 'BadgePercent'
      }
    ];
  };

  const savePrizes = (updatedPrizes: Prize[]) => {
    localStorage.setItem(`prizes_${holiday}`, JSON.stringify(updatedPrizes));
    setPrizes(updatedPrizes);
  };

  const addPrize = () => {
    const newPrize: Prize = {
      id: Date.now().toString(),
      name: '',
      description: '',
      type: 'gift',
      icon: 'Gift'
    };
    setEditingPrize(newPrize);
    setIsAdding(true);
  };

  const savePrize = () => {
    if (!editingPrize || !editingPrize.name.trim()) return;

    if (isAdding) {
      savePrizes([...prizes, editingPrize]);
    } else {
      savePrizes(prizes.map(p => p.id === editingPrize.id ? editingPrize : p));
    }

    setEditingPrize(null);
    setIsAdding(false);
  };

  const deletePrize = (id: string) => {
    if (confirm('Удалить этот приз?')) {
      savePrizes(prizes.filter(p => p.id !== id));
    }
  };

  const resetCalendar = () => {
    if (confirm('Сбросить календарь? Все открытые дни будут закрыты.')) {
      localStorage.removeItem(`calendar_${holiday}`);
      alert('Календарь сброшен!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-start bg-black/50 backdrop-blur-sm p-4 pl-8">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-t-2xl text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <Icon name="X" size={24} />
          </button>
          
          <div className="flex items-center gap-3">
            <Icon name="Settings" size={32} />
            <div>
              <h2 className="text-2xl font-bold">Управление призами календаря</h2>
              <p className="text-white/80 text-sm">
                {holiday === 'feb23' ? '23 Февраля' : '8 Марта'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex gap-3 mb-6">
            <button
              onClick={addPrize}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Icon name="Plus" size={20} />
              Добавить приз
            </button>
            
            <button
              onClick={resetCalendar}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Icon name="RotateCcw" size={20} />
              Сбросить календарь
            </button>
          </div>

          <div className="space-y-3">
            {prizes.map((prize) => (
              <div key={prize.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                    <Icon name={prize.icon as any} size={24} className="text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-lg">{prize.name}</h3>
                        <p className="text-sm text-gray-600">{prize.description}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingPrize(prize);
                            setIsAdding(false);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Icon name="Pencil" size={18} />
                        </button>
                        <button
                          onClick={() => deletePrize(prize.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Icon name="Trash2" size={18} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-2">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                        {prizeTypes.find(t => t.value === prize.type)?.label}
                      </span>
                      {prize.value && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          {prize.value}%
                        </span>
                      )}
                      {prize.requiresLoyaltyCard && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                          Требуется карта
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {editingPrize && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">
              {isAdding ? 'Добавить приз' : 'Редактировать приз'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Название</label>
                <input
                  type="text"
                  value={editingPrize.name}
                  onChange={(e) => setEditingPrize({ ...editingPrize, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="Например: Бесплатная доставка"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Описание</label>
                <textarea
                  value={editingPrize.description}
                  onChange={(e) => setEditingPrize({ ...editingPrize, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  rows={2}
                  placeholder="Подробное описание приза"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Тип приза</label>
                <select
                  value={editingPrize.type}
                  onChange={(e) => setEditingPrize({ ...editingPrize, type: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  {prizeTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {(editingPrize.type === 'cashback' || editingPrize.type === 'discount') && (
                <div>
                  <label className="block text-sm font-medium mb-2">Значение (%)</label>
                  <input
                    type="number"
                    value={editingPrize.value || 0}
                    onChange={(e) => setEditingPrize({ ...editingPrize, value: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    min="1"
                    max="100"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Иконка</label>
                <div className="grid grid-cols-6 gap-2">
                  {iconOptions.map(iconName => (
                    <button
                      key={iconName}
                      onClick={() => setEditingPrize({ ...editingPrize, icon: iconName })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        editingPrize.icon === iconName
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon name={iconName as any} size={20} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requiresCard"
                  checked={editingPrize.requiresLoyaltyCard || false}
                  onChange={(e) => setEditingPrize({ ...editingPrize, requiresLoyaltyCard: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="requiresCard" className="text-sm">
                  Требуется карта лояльности
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setEditingPrize(null);
                  setIsAdding(false);
                }}
                className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={savePrize}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarAdmin;