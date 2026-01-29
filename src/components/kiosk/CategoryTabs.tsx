import { Category } from '@/types/database';
import { cn } from '@/lib/utils';

interface CategoryTabsProps {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function CategoryTabs({ categories, selectedId, onSelect }: CategoryTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 px-1">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelect(category.id)}
          className={cn(
            "touch-target px-6 py-3 rounded-xl font-medium text-lg whitespace-nowrap transition-all duration-200",
            selectedId === category.id
              ? "bg-primary text-primary-foreground shadow-lg"
              : "bg-card text-foreground hover:bg-secondary border border-border"
          )}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
