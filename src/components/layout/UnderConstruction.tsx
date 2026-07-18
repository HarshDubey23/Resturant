import { Construction } from "lucide-react";
import { cn } from "@/lib/utils";

interface IUnderConstructionProps {
  className?: string;
  message?: string;
}

export default function UnderConstruction({ className, message }: IUnderConstructionProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16", className)}>
      <Construction className="h-16 w-16 text-muted-foreground/50" />
      <h1 className="text-xl font-semibold">Under Construction!</h1>
      <p className="text-sm text-muted-foreground">{message ?? "This page is under development!"}</p>
    </div>
  );
}
