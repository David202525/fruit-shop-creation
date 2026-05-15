import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';

interface CitySelectorProps {
  selectedCity: string;
  isOpen: boolean;
  searchQuery: string;
  filteredCities: string[];
  onOpenChange: (open: boolean) => void;
  onSearchChange: (query: string) => void;
  onCitySelect: (city: string) => void;
}

export const CitySelector = ({
  selectedCity,
  isOpen,
  searchQuery,
  filteredCities,
  onOpenChange,
  onSearchChange,
  onCitySelect
}: CitySelectorProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Выберите город</Label>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(true)}
          className="w-full justify-start min-h-[44px] text-sm sm:text-base"
        >
          <Icon name="MapPin" size={16} className="mr-2 flex-shrink-0" />
          <span className="truncate">{selectedCity || 'Выберите город доставки'}</span>
        </Button>
        {selectedCity && (
          <p className="text-xs text-muted-foreground">
            {selectedCity === 'Барнаул' ? '✓ Доступна оплата наличными' : 'Доступна только онлайн-оплата'}
          </p>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="w-full max-w-full sm:max-w-md h-full sm:h-auto sm:max-h-[85vh] flex flex-col m-0 sm:m-auto rounded-none sm:rounded-lg p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Выберите город</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 flex-1 min-h-0">
            <Input
              placeholder="Поиск города..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="min-h-[44px]"
              autoFocus
            />
            <ScrollArea className="flex-1 border rounded-md min-h-0 h-[50vh] sm:h-[400px]">
              <div className="p-2 space-y-1">
                {filteredCities.length > 0 ? (
                  filteredCities.map((city) => (
                    <Button
                      key={city}
                      variant="ghost"
                      className="w-full justify-start min-h-[44px] text-sm sm:text-base"
                      onClick={() => onCitySelect(city)}
                    >
                      {city}
                    </Button>
                  ))
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    Город не найден
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};