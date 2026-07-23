"use client";

import { Copy, Edit, Plus, Power, PowerOff, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import type { TCoupon } from "#utils/database/models/coupon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// ─── Zod schemas ──────────────────────────────────────────────
const createSchema = z.object({
	code: z.string().min(1, "Code is required").max(30, "Code too long"),
	discountType: z.enum(["percentage", "flat"]),
	discountValue: z.number().positive("Must be positive"),
	validFrom: z.string().min(1, "Start date required"),
	validUntil: z.string().min(1, "End date required"),
	usageLimit: z.string().optional(),
	minOrderValue: z.string().optional(),
});

type CouponForm = z.infer<typeof createSchema>;

// ─── Component ────────────────────────────────────────────────
export default function SettingsCoupons() {
	const [coupons, setCoupons] = useState<TCoupon[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");

	// Modal state
	const [modalOpen, setModalOpen] = useState(false);
	const [editingCoupon, setEditingCoupon] = useState<TCoupon | null>(null);
	const [saving, setSaving] = useState(false);

	// Form state
	const [form, setForm] = useState<CouponForm>({
		code: "",
		discountType: "percentage",
		discountValue: 0,
		validFrom: "",
		validUntil: "",
		usageLimit: "",
		minOrderValue: "",
	});

	const fetchCoupons = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch(`/api/admin/coupons?page=${page}&limit=20`);
			const data = await res.json();
			if (!res.ok) throw new Error(data?.message || "Failed to load coupons");
			setCoupons(data.coupons);
			setTotal(data.total);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load coupons");
		} finally {
			setLoading(false);
		}
	}, [page]);

	useEffect(() => {
		fetchCoupons();
	}, [fetchCoupons]);

	const openCreateModal = () => {
		setEditingCoupon(null);
		setForm({
			code: "",
			discountType: "percentage",
			discountValue: 0,
			validFrom: new Date().toISOString().split("T")[0],
			validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
			usageLimit: "",
			minOrderValue: "",
		});
		setModalOpen(true);
	};

	const openEditModal = (coupon: TCoupon) => {
		setEditingCoupon(coupon);
		setForm({
			code: coupon.code,
			discountType: coupon.discountType as "percentage" | "flat",
			discountValue: coupon.discountValue,
			validFrom: new Date(coupon.validFrom).toISOString().split("T")[0],
			validUntil: new Date(coupon.validUntil).toISOString().split("T")[0],
			usageLimit: coupon.usageLimit != null ? String(coupon.usageLimit) : "",
			minOrderValue: coupon.minOrderAmount != null ? String(coupon.minOrderAmount) : "",
		});
		setModalOpen(true);
	};

	const handleSave = async () => {
		const parsed = createSchema.safeParse(form);
		if (!parsed.success) {
			const firstError = parsed.error.issues[0];
			toast.error(firstError?.message || "Validation failed");
			return;
		}

		setSaving(true);
		try {
			if (editingCoupon) {
				// PATCH — update existing (don't allow code change)
				const payload = {
					id: editingCoupon._id.toString(),
					discountType: parsed.data.discountType,
					discountValue: parsed.data.discountValue,
					validFrom: parsed.data.validFrom,
					validUntil: parsed.data.validUntil,
					usageLimit: parsed.data.usageLimit ? Number(parsed.data.usageLimit) : null,
					minOrderValue: parsed.data.minOrderValue ? Number(parsed.data.minOrderValue) : undefined,
				};
				const res = await fetch("/api/admin/coupons", {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});
				const data = await res.json();
				if (!res.ok) throw new Error(data?.message || "Failed to update coupon");
				toast.success("Coupon updated");
			} else {
				// POST — create new
				const payload = {
					code: parsed.data.code.toUpperCase(),
					discountType: parsed.data.discountType,
					discountValue: parsed.data.discountValue,
					validFrom: parsed.data.validFrom,
					validUntil: parsed.data.validUntil,
					usageLimit: parsed.data.usageLimit ? Number(parsed.data.usageLimit) : null,
					minOrderValue: parsed.data.minOrderValue ? Number(parsed.data.minOrderValue) : undefined,
				};
				const res = await fetch("/api/admin/coupons", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});
				const data = await res.json();
				if (!res.ok) throw new Error(data?.message || "Failed to create coupon");
				toast.success("Coupon created");
			}
			setModalOpen(false);
			await fetchCoupons();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Operation failed");
		} finally {
			setSaving(false);
		}
	};

	const handleToggleActive = async (coupon: TCoupon) => {
		try {
			const res = await fetch("/api/admin/coupons", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: coupon._id.toString(), isActive: !coupon.isActive }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data?.message || "Failed to toggle coupon");
			toast.success(coupon.isActive ? "Coupon deactivated" : "Coupon activated");
			await fetchCoupons();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Operation failed");
		}
	};

	const handleDelete = async (coupon: TCoupon) => {
		if (!confirm(`Soft-delete coupon "${coupon.code}"? It will be marked as inactive.`)) return;
		try {
			const res = await fetch("/api/admin/coupons", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: coupon._id.toString() }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data?.message || "Failed to delete coupon");
			toast.success("Coupon deleted");
			await fetchCoupons();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Operation failed");
		}
	};

	const filteredCoupons = coupons.filter((c) => {
		if (!search) return true;
		const q = search.toLowerCase();
		return c.code.toLowerCase().includes(q) || c.discountType.toLowerCase().includes(q);
	});

	const formatDate = (d: Date | string) => {
		const date = new Date(d);
		return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
	};

	if (error) {
		return (
			<div className="p-6">
				<div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
					<p>Error: {error}</p>
					<Button variant="outline" size="sm" className="mt-2" onClick={fetchCoupons}>
						Retry
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="p-4 sm:p-6 space-y-4">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
				<div>
					<h2 className="text-lg font-semibold">Coupons</h2>
					<p className="text-sm text-muted-foreground">Manage discount coupons for your restaurant</p>
				</div>
				<Button onClick={openCreateModal} size="sm">
					<Plus className="h-4 w-4 mr-1" />
					Add Coupon
				</Button>
			</div>

			<Separator />

			{/* Search */}
			<div className="flex items-center gap-2">
				<div className="relative flex-1 max-w-xs">
					<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input placeholder="Search coupons…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-sm" />
				</div>
				<span className="text-xs text-muted-foreground">{total} total</span>
			</div>

			{/* Table */}
			{loading ? (
				<div className="flex items-center justify-center py-12">
					<div className="animate-spin h-6 w-6 border-2 border-violet-600 border-t-transparent rounded-full" />
					<span className="ml-2 text-sm text-muted-foreground">Loading coupons…</span>
				</div>
			) : filteredCoupons.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<div className="rounded-full bg-muted p-3 mb-3">
						<Copy className="h-6 w-6 text-muted-foreground" />
					</div>
					<p className="text-sm text-muted-foreground">{search ? "No coupons match your search" : "No coupons yet. Create your first discount coupon!"}</p>
				</div>
			) : (
				<div className="rounded-lg border overflow-hidden">
					<ScrollArea className="max-h-[500px]">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-[100px]">Code</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Value</TableHead>
									<TableHead className="hidden sm:table-cell">Valid From</TableHead>
									<TableHead className="hidden sm:table-cell">Valid Until</TableHead>
									<TableHead className="hidden md:table-cell">Usage</TableHead>
									<TableHead className="hidden md:table-cell">Min Order</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="w-[80px]">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredCoupons.map((coupon) => (
									<TableRow key={coupon._id.toString()}>
										<TableCell className="font-medium uppercase">{coupon.code}</TableCell>
										<TableCell>
											<Badge variant="outline" className="text-xs">
												{coupon.discountType === "percentage" ? "%" : "₹ flat"}
											</Badge>
										</TableCell>
										<TableCell>{coupon.discountType === "percentage" ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}</TableCell>
										<TableCell className="hidden sm:table-cell text-xs">{formatDate(coupon.validFrom)}</TableCell>
										<TableCell className="hidden sm:table-cell text-xs">{formatDate(coupon.validUntil)}</TableCell>
										<TableCell className="hidden md:table-cell text-xs">
											{coupon.usedCount}/{coupon.usageLimit ?? "∞"}
										</TableCell>
										<TableCell className="hidden md:table-cell text-xs">₹{coupon.minOrderAmount ?? 0}</TableCell>
										<TableCell>
											<Badge
												variant={coupon.isActive ? "default" : "secondary"}
												className={coupon.isActive ? "bg-violet-600 text-white text-xs" : "text-xs"}>
												{coupon.isActive ? "Active" : "Inactive"}
											</Badge>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-1">
												<Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditModal(coupon)} title="Edit coupon">
													<Edit className="h-3.5 w-3.5" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="h-7 w-7"
													onClick={() => handleToggleActive(coupon)}
													title={coupon.isActive ? "Deactivate" : "Activate"}>
													{coupon.isActive ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5 text-violet-600" />}
												</Button>
												<Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(coupon)} title="Delete coupon">
													<Trash2 className="h-3.5 w-3.5 text-red-500" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</ScrollArea>
				</div>
			)}

			{/* Pagination */}
			{total > 20 && (
				<div className="flex items-center justify-between">
					<span className="text-xs text-muted-foreground">
						Page {page} of {Math.ceil(total / 20)}
					</span>
					<div className="flex gap-2">
						<Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
							Previous
						</Button>
						<Button variant="outline" size="sm" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(page + 1)}>
							Next
						</Button>
					</div>
				</div>
			)}

			{/* Create/Edit Modal */}
			<Dialog open={modalOpen} onOpenChange={setModalOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogTitle className="text-base font-semibold">{editingCoupon ? "Edit Coupon" : "Create Coupon"}</DialogTitle>
					<DialogDescription className="text-xs">
						{editingCoupon
							? `Update details for coupon "${editingCoupon.code}". The code cannot be changed.`
							: "Create a new discount coupon for your restaurant customers."}
					</DialogDescription>

					<div className="space-y-4 mt-2">
						<div className="space-y-1.5">
							<Label htmlFor="coupon-code">Code</Label>
							<Input
								id="coupon-code"
								value={form.code}
								onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
								disabled={editingCoupon != null}
								placeholder="e.g. SUMMER50"
								className="uppercase"
							/>
							{editingCoupon && <p className="text-[10px] text-muted-foreground">Coupon code cannot be changed after creation</p>}
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label htmlFor="coupon-type">Discount Type</Label>
								<select
									id="coupon-type"
									value={form.discountType}
									onChange={(e) => setForm({ ...form, discountType: e.target.value as "percentage" | "flat" })}
									className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
									<option value="percentage">Percentage (%)</option>
									<option value="flat">Flat (₹)</option>
								</select>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="coupon-value">Discount Value {form.discountType === "percentage" ? "(%)" : "(₹)"}</Label>
								<Input
									id="coupon-value"
									type="number"
									min="1"
									max={form.discountType === "percentage" ? "100" : undefined}
									step={form.discountType === "percentage" ? "1" : "0.01"}
									value={form.discountValue}
									onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
									required
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label htmlFor="coupon-from">Valid From</Label>
								<Input id="coupon-from" type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} required />
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="coupon-until">Valid Until</Label>
								<Input
									id="coupon-until"
									type="date"
									value={form.validUntil}
									onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
									required
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label htmlFor="coupon-usage">Usage Limit</Label>
								<Input
									id="coupon-usage"
									type="number"
									min="1"
									value={form.usageLimit}
									onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
									placeholder="∞ unlimited"
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="coupon-min">Min Order Value (₹)</Label>
								<Input
									id="coupon-min"
									type="number"
									min="0"
									step="0.01"
									value={form.minOrderValue}
									onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })}
									placeholder="0"
								/>
							</div>
						</div>

						<div className="flex justify-end gap-2 pt-2">
							<Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
								Cancel
							</Button>
							<Button onClick={handleSave} loading={saving}>
								{editingCoupon ? "Save Changes" : "Create Coupon"}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
