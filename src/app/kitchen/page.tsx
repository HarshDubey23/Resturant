import { Construction } from "lucide-react";

const Kitchen = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8">
      <Construction className="h-24 w-24 text-muted-foreground/50" />
      <p className="text-lg text-muted-foreground">This page is under development</p>
    </div>
  );
};

export default Kitchen;
