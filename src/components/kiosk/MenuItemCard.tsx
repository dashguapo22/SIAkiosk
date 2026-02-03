import { MenuItem } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Coffee } from 'lucide-react';

interface MenuItemCardProps {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
}

export function MenuItemCard({ item, onSelect }: MenuItemCardProps) {
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] border-border bg-card overflow-hidden"
      onClick={() => onSelect(item)}
    >
      <CardContent className="p-4">
        <div className="aspect-square rounded-xl bg-secondary/50 flex items-center justify-center mb-4 overflow-hidden">
          {item.image_url ? (
            <img 
              src={item.image_url} 
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Coffee className="w-16 h-16 text-coffee-medium" />
          )}
        </div>
        <h3 className="font-semibold text-lg text-foreground mb-1">{item.name}</h3>
        {item.description && (
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{item.description}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-primary">
            PHP{item.base_price.toFixed(2)}
          </span>
          {item.allows_iced && (
            <span className="text-xs bg-secondary px-2 py-1 rounded-full text-muted-foreground">
              Hot/Iced
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
