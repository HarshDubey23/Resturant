"use client";

import { type UIEvent, useEffect, useState } from "react";
import { useAdmin } from "#components/context/useContext";
import type { TOrder } from "#utils/database/models/order";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface OrderHistoryProps {
  onScroll: (event: UIEvent<HTMLDivElement>) => void;
}

const states: Record<string, { label: string; variant: "secondary" | "destructive" | "default" | "outline" }> = {
  complete: { label: "Completed", variant: "default" },
  reject: { label: "Rejected", variant: "destructive" },
  cancel: { label: "Cancelled", variant: "outline" },
};

export default function OrderHistory({ onScroll }: OrderHistoryProps) {
  const { orderHistory = [], profile } = useAdmin();
  const [activeCardID, setActiveCardID] = useState<string>();

  useEffect(() => {
    if (orderHistory?.length === 0) {
      setActiveCardID(undefined);
    } else if (!orderHistory.some(({ _id }) => _id.toString() === activeCardID)) {
      setActiveCardID(orderHistory[0]?._id.toString());
    }
  }, [activeCardID, orderHistory]);

  const activeData = orderHistory.find((o) => o._id.toString() === activeCardID);

  return (
    <div className="flex gap-4 h-full">
      <div className="w-72 shrink-0 space-y-2 overflow-auto" onScroll={onScroll}>
        {orderHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No order history</p>
        ) : (
          orderHistory.map((data) => {
            const stateInfo = states[data.state] ?? { label: data.state, variant: "outline" as const };
            return (
              <button
                key={data._id.toString()}
                onClick={() => setActiveCardID(data._id.toString())}
                className={`w-full rounded-lg border bg-card p-3 text-left text-sm transition-all ${
                  activeCardID === data._id.toString() ? "ring-1 ring-primary" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">Table: {data.table}</span>
                  <Badge variant={stateInfo.variant} className="text-[10px]">{stateInfo.label}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data?.customer?.fname ?? "Guest"} {data?.customer?.lname ?? ""}
                </p>
                {data?.orderTotal != null && (
                  <p className="text-xs font-semibold mt-1">₹{data.orderTotal}</p>
                )}
              </button>
            );
          })
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {!activeData ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Select an order to view details</p>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Order #{activeData._id.toString().slice(-6).toUpperCase()}
                </CardTitle>
                <Badge variant={states[activeData.state]?.variant ?? "outline"}>
                  {states[activeData.state]?.label ?? activeData.state}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Date</span>
                  <p className="font-medium">
                    {(activeData as any).createdAt
                      ? new Date((activeData as any).createdAt).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Table</span>
                  <p className="font-medium">{activeData.table}</p>
                </div>
                {activeData.customer && (
                  <>
                    <div>
                      <span className="text-muted-foreground">Customer</span>
                      <p className="font-medium">
                        {activeData.customer.fname} {activeData.customer.lname}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Contact</span>
                      <p className="font-medium">{activeData.customer.phone}</p>
                    </div>
                  </>
                )}
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-2">Items</h4>
                <div className="space-y-2">
                  {activeData.products?.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="font-medium">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{activeData.orderTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>₹{activeData.taxTotal}</span>
                </div>
                <div className="flex justify-between font-semibold pt-1">
                  <span>Total</span>
                  <span>₹{(activeData.orderTotal ?? 0) + (activeData.taxTotal ?? 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
