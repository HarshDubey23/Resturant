import { Leaf, Drumstick, CookingPot } from "lucide-react";
import type { MenuSuggestion } from "../../types/chat";
import { cn } from "@/lib/utils";

interface MenuCardProps {
  item: MenuSuggestion;
}

const VEG_ICONS: Record<string, { icon: typeof Leaf; className: string }> = {
  veg: { icon: Leaf, className: "text-green-600" },
  "non-veg": { icon: Drumstick, className: "text-red-600" },
  "contains-egg": { icon: CookingPot, className: "text-yellow-600" },
};

export function MenuCard({ item }: MenuCardProps) {
  const handleClick = () => {
    const el = document.getElementById(`menu-item-${item._id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      window.dispatchEvent(new CustomEvent("highlight-item", { detail: { id: String(item._id) } }));
    }
  };

  const VegIcon = item.veg ? VEG_ICONS[item.veg]?.icon : null;

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center gap-2 rounded-lg border bg-card p-2 text-left text-sm transition-colors hover:bg-muted w-full"
    >
      {item.image && (
        <div
          className="h-10 w-10 shrink-0 rounded-md bg-cover bg-center bg-muted"
          style={{ backgroundImage: `url(${item.image})` }}
        />
      )}
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-medium truncate">{item.name}</h4>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          {VegIcon && <VegIcon className={cn("h-3 w-3", VEG_ICONS[item.veg!]?.className)} />}
          <span>₹{item.price}</span>
        </p>
      </div>
    </button>
  );
}
