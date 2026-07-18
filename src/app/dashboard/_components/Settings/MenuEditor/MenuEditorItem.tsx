"use client";

import { useInView } from "react-intersection-observer";
import { Eye, EyeOff, PencilLine, ImageIcon } from "lucide-react";
import { type TMenu } from "#utils/database/models/menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MenuEditorItemProps {
  item: TMenu;
  onEdit: (item: TMenu) => void;
  onHide: (id: string, hidden: boolean) => void;
  hideSettingsLoading?: boolean;
}

const VEG_STYLES: Record<string, { label: string; className: string }> = {
  veg: { label: "Veg", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  "non-veg": { label: "Non-Veg", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  "contains-egg": { label: "Contains Egg", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
};

export default function MenuEditorItem({ item, onEdit, onHide, hideSettingsLoading = false }: MenuEditorItemProps) {
  const [itemRef, inView] = useInView({ threshold: 0 });

  return (
    <div ref={itemRef} className={cn("flex items-center gap-3 rounded-lg border bg-card p-3", !inView && "min-h-[72px]")}>
      {inView && (
        <>
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted relative">
            {item.image ? (
              <span
                className="block h-full w-full bg-cover bg-center"
                style={{ background: `url(${item.image})` }}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            {item.veg && (
              <span className={cn(
                "absolute bottom-0 left-0 text-[8px] font-semibold px-1 py-0.5 leading-none rounded-tr",
                VEG_STYLES[item.veg]?.className ?? ""
              )}>
                {VEG_STYLES[item.veg]?.label ?? item.veg}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{item.name}</p>
            <p className="text-xs text-muted-foreground truncate">{item.description}</p>
            <p className="text-xs font-semibold mt-0.5">₹{item.price}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="xs"
              variant={item.hidden ? "secondary" : "default"}
              onClick={() => onHide(item._id.toString(), !item.hidden)}
              loading={hideSettingsLoading}
            >
              {item.hidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {item.hidden ? "Hidden" : "Visible"}
            </Button>
            <Button size="xs" variant="outline" onClick={() => onEdit(item)}>
              <PencilLine className="h-3 w-3" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
