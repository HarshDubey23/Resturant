"use client";

import { ChevronLeft, ChevronRight, Download, FileText, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdmin } from "#components/context/useContext";
import Invoice from "#components/layout/Invoice";
import type { TInvoice } from "#utils/database/models/invoice";
import type { TOrder } from "#utils/database/models/order";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
	razorpay: "Razorpay",
	stripe: "Stripe",
	cash: "Cash",
	upi: "UPI",
};

export default function Invoices() {
	const [invoices, setInvoices] = useState<TInvoice[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [total, setTotal] = useState(0);
	const [selectedInvoice, setSelectedInvoice] = useState<TInvoice | null>(null);
	const limit = 15;
	const { profile } = useAdmin();

	const fetchInvoices = useCallback(async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
			if (search) params.set("search", search);
			const res = await fetch(`/api/invoice?${params}`);
			if (!res.ok) throw new Error("Failed to fetch");
			const data = await res.json();
			setInvoices(data.invoices || []);
			setTotalPages(data.pagination?.totalPages || 1);
			setTotal(data.pagination?.total || 0);
		} catch {
			setInvoices([]);
		} finally {
			setLoading(false);
		}
	}, [page, search]);

	useEffect(() => {
		fetchInvoices();
	}, [fetchInvoices]);

	const handleSearch = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			setPage(1);
			fetchInvoices();
		},
		[fetchInvoices],
	);

	const handleDownload = useCallback(async (invoice: TInvoice) => {
		try {
			const res = await fetch(`/api/invoice/${invoice._id}/pdf`);
			if (!res.ok) throw new Error("Failed to download");
			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `Invoice-${invoice.invoiceNumber}.pdf`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		} catch {
			// silent
		}
	}, []);

	const pageNumbers = useMemo(() => {
		const pages: (number | "ellipsis")[] = [];
		if (totalPages <= 7) {
			for (let i = 1; i <= totalPages; i++) pages.push(i);
		} else {
			pages.push(1);
			if (page > 3) pages.push("ellipsis");
			for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
				pages.push(i);
			}
			if (page < totalPages - 2) pages.push("ellipsis");
			pages.push(totalPages);
		}
		return pages;
	}, [page, totalPages]);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between gap-4">
				<form onSubmit={handleSearch} className="relative flex-1 max-w-md">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search by invoice number, customer name, or phone..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="pl-9"
					/>
				</form>
				<div className="text-sm text-muted-foreground">
					{total > 0 && (
						<span>
							{total} invoice{total !== 1 ? "s" : ""}
						</span>
					)}
				</div>
			</div>

			{loading ? (
				<div className="space-y-3">
					{[...Array(8)].map((_, i) => (
						<Skeleton key={i} className="h-16 w-full rounded-lg" />
					))}
				</div>
			) : invoices.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
					<FileText className="h-12 w-12 mb-4 opacity-50" />
					<p className="text-lg font-medium">No invoices found</p>
					<p className="text-sm">Invoices are auto-generated when payments are completed</p>
				</div>
			) : (
				<div className="space-y-2">
					{invoices.map((invoice) => {
						const order = invoice.order as unknown as TOrder | undefined;
						return (
							<div
								key={String(invoice._id)}
								className="flex items-center justify-between rounded-lg border bg-card p-4 hover:bg-muted/50 transition-colors cursor-pointer"
								onClick={() => setSelectedInvoice(invoice)}>
								<div className="min-w-0 flex-1 space-y-1">
									<div className="flex items-center gap-2">
										<FileText className="h-4 w-4 text-primary shrink-0" />
										<p className="text-sm font-medium truncate">{invoice.invoiceNumber}</p>
										<Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-auto">
											{PAYMENT_METHOD_LABELS[invoice.paymentMethod] || invoice.paymentMethod}
										</Badge>
									</div>
									<div className="flex items-center gap-3 text-xs text-muted-foreground">
										<span>{invoice.customerName || "Guest"}</span>
										<span aria-hidden="true">&middot;</span>
										<span>Table {order?.table || "—"}</span>
										<span aria-hidden="true">&middot;</span>
										<span>{new Date(invoice.generatedAt || Date.now()).toLocaleDateString()}</span>
										<span aria-hidden="true">&middot;</span>
										<span className="font-medium text-foreground">
											{(invoice.grandTotal || 0).toLocaleString("en-IN", { style: "currency", currency: profile?.currency || "INR" })}
										</span>
									</div>
								</div>
								<Button
									variant="ghost"
									size="icon"
									className="shrink-0 ml-2"
									onClick={(e) => {
										e.stopPropagation();
										handleDownload(invoice);
									}}>
									<Download className="h-4 w-4" />
								</Button>
							</div>
						);
					})}
				</div>
			)}

			{totalPages > 1 && (
				<div className="flex items-center justify-center gap-1">
					<Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					{pageNumbers.map((p, i) =>
						p === "ellipsis" ? (
							<span key={`ellipsis-${i}`} className="px-2 text-muted-foreground text-sm">
								...
							</span>
						) : (
							<Button key={p} variant={p === page ? "default" : "outline"} size="icon" className="h-8 w-8 text-xs" onClick={() => setPage(p)}>
								{p}
							</Button>
						),
					)}
					<Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
			)}

			<Dialog
				open={!!selectedInvoice}
				onOpenChange={(open) => {
					if (!open) setSelectedInvoice(null);
				}}>
				<DialogContent className="max-w-4xl h-[80vh] flex flex-col">
					<DialogHeader>
						<DialogTitle>Invoice {selectedInvoice?.invoiceNumber}</DialogTitle>
					</DialogHeader>
					<div className="flex-1 min-h-0 rounded-lg overflow-hidden">
						{selectedInvoice?.order && (
							<Invoice
								order={
									{
										...(selectedInvoice.order as unknown as Record<string, unknown>),
										_id: (selectedInvoice.order as unknown as { _id?: string })?._id || "",
										createdAt: new Date(),
										invoiceNumber: selectedInvoice.invoiceNumber,
									} as TOrder & { _id: string; createdAt: string | Date }
								}
								profile={profile}
							/>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
