"use client";
import useSWR from "swr";
import { formatCurrency } from "#utils/helper/currency";
import { Card } from "@/components/ui/card";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

export default function AggregatorOrdersPage() {
	const { data: orders = [], isLoading } = useSWR("/api/aggregator", fetcher, { refreshInterval: 10000 });
	return (
		<main className="container mx-auto p-6">
			<h1 className="text-2xl font-bold mb-4">External Aggregator Orders</h1>
			{isLoading && <p>Loading...</p>}
			<div className="grid gap-3">
				{orders.map((o: Record<string, unknown>) => (
					<Card key={o._id as string} className="p-4">
						<div className="flex justify-between">
							<span className="font-semibold">{(o.source as string)?.toUpperCase() ?? "AGGREGATOR"}</span>
							<span>{formatCurrency(o.totalAmount as number)}</span>
						</div>
						<p className="text-sm text-gray-600 mt-1">Customer: {o.customerName as string}</p>
					</Card>
				))}
			</div>
		</main>
	);
}
