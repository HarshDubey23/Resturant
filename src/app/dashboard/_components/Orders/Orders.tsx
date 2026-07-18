import { useSearchParams } from "next/navigation";
import type { UIEvent } from "react";
import { Loader2 } from "lucide-react";
import { useAdmin } from "#components/context/useContext";
import ActiveOrders from "./ActiveOrders";
import OrderHistory from "./OrderHistory";
import OrderRequests from "./OrderRequests";

interface OrdersProps {
  onScroll: (event: UIEvent<HTMLDivElement>) => void;
}

export default function Orders({ onScroll }: OrdersProps) {
  const { orderLoading } = useAdmin();
  const queryParams = useSearchParams();
  const subTab = queryParams.get("subTab") ?? "";

  if (orderLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Fetching orders...</span>
      </div>
    );
  }

  if (subTab === "requests") return <OrderRequests onScroll={onScroll} />;
  if (subTab === "active") return <ActiveOrders onScroll={onScroll} />;
  if (subTab === "history") return <OrderHistory onScroll={onScroll} />;

  return null;
}
