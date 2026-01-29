import { OrderWithItems, STATUS_LABELS, OrderStatus } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface OrderCardProps {
  order: OrderWithItems;
  onSelect: (order: OrderWithItems) => void;
  isSelected: boolean;
}

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-warning text-warning-foreground',
  in_progress: 'bg-blue-500 text-white',
  ready: 'bg-success text-white',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive text-destructive-foreground',
};

export function OrderCard({ order, onSelect, isSelected }: OrderCardProps) {
  const timeAgo = formatDistanceToNow(new Date(order.created_at), { addSuffix: true });

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md",
        isSelected ? "ring-2 ring-primary" : ""
      )}
      onClick={() => onSelect(order)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-display">
            #{order.order_number}
          </CardTitle>
          <Badge className={cn("text-xs", statusColors[order.status])}>
            {STATUS_LABELS[order.status]}
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{timeAgo}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 mb-3">
          {order.order_items.slice(0, 3).map((item) => (
            <div key={item.id} className="text-sm flex justify-between">
              <span>
                {item.quantity}x {item.item_name}
              </span>
              <span className="text-muted-foreground text-xs">
                {item.size} / {item.temperature}
              </span>
            </div>
          ))}
          {order.order_items.length > 3 && (
            <p className="text-xs text-muted-foreground">
              +{order.order_items.length - 3} more items
            </p>
          )}
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="font-bold text-lg">${Number(order.total).toFixed(2)}</span>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}
