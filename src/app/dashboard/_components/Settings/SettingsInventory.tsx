"use client";

/** @file SettingsInventory — six-tab inventory manager (Stock Items, Stock-In /
 *    GRN, Wastage Log, Physical Count, Variance Report, Suppliers). Uses
 *    shadcn primitives + motion staggered rows + designed empty state. Dark
 *    mode safe via semantic tokens.
 * @phase 2
 * @audit-finding n/a
 */
import { motion } from "motion/react";
import {
        ChevronLeft,
        ChevronRight,
        Loader2,
        Package,
        PackageOpen,
        Plus,
        Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import VarianceReport from "@/app/dashboard/_components/Inventory/VarianceReport";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type Unit = "g" | "kg" | "ml" | "l" | "pcs" | "tsp" | "tbsp";

interface StockItem {
        _id: string;
        name: string;
        sku?: string;
        unit: Unit;
        currentStock: number;
        openingStock: number;
        reorderLevel: number;
        reorderQty: number;
        costPerUnit: number;
        supplier?: string;
        lastRestockedAt?: string;
        stockIn?: Array<{ qty: number; rate: number; supplier?: string; invoiceRef?: string; receivedBy?: string; date: string }>;
        wastage?: Array<{ qty: number; reasonCode: string; authorizedBy?: string; note?: string; date: string }>;
        physicalCount?: Array<{ qty: number; countedBy?: string; date: string }>;
}

interface Supplier {
        _id: string;
        name: string;
        phone?: string;
        gstin?: string;
        items?: string[];
        outstandingBalance?: number;
}

interface StockInForm {
        inventoryId: string;
        qty: string;
        rate: string;
        supplier: string;
        invoiceRef: string;
}

interface WastageForm {
        inventoryId: string;
        qty: string;
        reasonCode: string;
        note: string;
}

interface CountForm {
        items: Array<{ inventoryId: string; name: string; counted: string; previous: number }>;
}

const UNITS: Unit[] = ["g", "kg", "ml", "l", "pcs", "tsp", "tbsp"];
const WASTAGE_REASONS = ["spoilage", "expiry", "breakage", "pilferage", "spillage", "preparation_loss", "other"];

function formatDate(d?: string): string {
        if (!d) return "—";
        return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function SettingsInventory() {
        const [tab, setTab] = useState("items");

        return (
                <div className="space-y-4 p-4">
                        <div>
                                <h2 className="text-lg font-bold tracking-tight">Inventory</h2>
                                <p className="text-sm text-muted-foreground">
                                        Stock journals, GRN, wastage, physical counts, variance & suppliers.
                                </p>
                        </div>

                        <Tabs value={tab} onValueChange={setTab}>
                                <TabsList className="flex w-full max-w-2xl flex-wrap">
                                        <TabsTrigger value="items">Stock Items</TabsTrigger>
                                        <TabsTrigger value="stockin">Stock-In / GRN</TabsTrigger>
                                        <TabsTrigger value="wastage">Wastage</TabsTrigger>
                                        <TabsTrigger value="count">Physical Count</TabsTrigger>
                                        <TabsTrigger value="variance">Variance</TabsTrigger>
                                        <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
                                </TabsList>

                                <TabsContent value="items">
                                        <StockItemsTab />
                                </TabsContent>
                                <TabsContent value="stockin">
                                        <StockInTab />
                                </TabsContent>
                                <TabsContent value="wastage">
                                        <WastageTab />
                                </TabsContent>
                                <TabsContent value="count">
                                        <PhysicalCountTab />
                                </TabsContent>
                                <TabsContent value="variance">
                                        <VarianceReport />
                                </TabsContent>
                                <TabsContent value="suppliers">
                                        <SuppliersTab />
                                </TabsContent>
                        </Tabs>
                </div>
        );
}

// ─── Stock Items tab ────────────────────────────────────────────────────────
function StockItemsTab() {
        const [items, setItems] = useState<StockItem[]>([]);
        const [loading, setLoading] = useState(true);
        const [modalOpen, setModalOpen] = useState(false);
        const [saving, setSaving] = useState(false);
        const [form, setForm] = useState({
                name: "",
                sku: "",
                unit: "pcs" as Unit,
                openingStock: "0",
                reorderLevel: "0",
                reorderQty: "0",
                costPerUnit: "0",
                supplier: "",
        });

        const fetchItems = useCallback(async () => {
                setLoading(true);
                try {
                        const res = await fetch("/api/inventory");
                        const data = (await res.json()) as { items?: StockItem[]; message?: string };
                        if (!res.ok) throw new Error(data.message ?? "Failed to load inventory");
                        setItems(data.items ?? []);
                } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Failed to load inventory");
                } finally {
                        setLoading(false);
                }
        }, []);

        useEffect(() => {
                fetchItems();
        }, [fetchItems]);

        const handleSave = async () => {
                if (!form.name.trim()) {
                        toast.error("Item name is required");
                        return;
                }
                setSaving(true);
                try {
                        const res = await fetch("/api/inventory", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                        name: form.name.trim(),
                                        sku: form.sku.trim() || undefined,
                                        unit: form.unit,
                                        openingStock: Number(form.openingStock) || 0,
                                        reorderLevel: Number(form.reorderLevel) || 0,
                                        reorderQty: Number(form.reorderQty) || 0,
                                        costPerUnit: Number(form.costPerUnit) || 0,
                                        supplier: form.supplier.trim() || undefined,
                                }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data?.message ?? "Failed to create item");
                        toast.success("Item created");
                        setModalOpen(false);
                        setForm({
                                name: "",
                                sku: "",
                                unit: "pcs",
                                openingStock: "0",
                                reorderLevel: "0",
                                reorderQty: "0",
                                costPerUnit: "0",
                                supplier: "",
                        });
                        await fetchItems();
                } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Failed to create item");
                } finally {
                        setSaving(false);
                }
        };

        return (
                <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                                <CardTitle className="text-sm">Stock Items</CardTitle>
                                <Button size="sm" onClick={() => setModalOpen(true)}>
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add Item
                                </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                                {loading ? (
                                        <div className="space-y-2 p-4">
                                                {[...Array(4)].map((_, i) => (
                                                        <Skeleton key={`sit-sk-${i.toString()}`} className="h-10 w-full rounded-lg" />
                                                ))}
                                        </div>
                                ) : items.length === 0 ? (
                                        <EmptyState
                                                icon={<PackageOpen className="h-8 w-8 text-muted-foreground" />}
                                                title="No stock items yet"
                                                subtitle="Add your first inventory item to start tracking consumption, GRN and wastage."
                                                actionLabel="Add Item"
                                                onAction={() => setModalOpen(true)}
                                        />
                                ) : (
                                        <div className="max-h-[480px] overflow-auto">
                                                <Table>
                                                        <TableHeader>
                                                                <TableRow>
                                                                        <TableHead>Name</TableHead>
                                                                        <TableHead>SKU</TableHead>
                                                                        <TableHead>Unit</TableHead>
                                                                        <TableHead className="text-right">Current</TableHead>
                                                                        <TableHead className="text-right">Reorder Level</TableHead>
                                                                        <TableHead className="text-right">Cost / Unit</TableHead>
                                                                        <TableHead>Status</TableHead>
                                                                </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                                {items.map((item: StockItem, i: number) => {
                                                                        const lowStock = item.currentStock <= item.reorderLevel;
                                                                        return (
                                                                                <motion.tr
                                                                                        key={item._id}
                                                                                        initial={{ opacity: 0, y: 6 }}
                                                                                        animate={{ opacity: 1, y: 0 }}
                                                                                        transition={{ delay: Math.min(i * 0.04, 0.4), duration: 0.25 }}
                                                                                        className="hover:bg-muted/40">
                                                                                        <TableCell className="font-medium">{item.name}</TableCell>
                                                                                        <TableCell className="font-mono text-xs text-muted-foreground">{item.sku ?? "—"}</TableCell>
                                                                                        <TableCell className="text-xs">{item.unit}</TableCell>
                                                                                        <TableCell className={`text-right tabular-nums ${lowStock ? "text-destructive font-bold" : ""}`}>
                                                                                                {item.currentStock}
                                                                                        </TableCell>
                                                                                        <TableCell className="text-right tabular-nums">{item.reorderLevel}</TableCell>
                                                                                        <TableCell className="text-right tabular-nums">₹{item.costPerUnit.toFixed(2)}</TableCell>
                                                                                        <TableCell>
                                                                                                {lowStock ? (
                                                                                                        <Badge variant="destructive" className="gap-1">
                                                                                                                <Package className="h-3 w-3" />
                                                                                                                Low Stock
                                                                                                        </Badge>
                                                                                                ) : (
                                                                                                        <Badge variant="secondary">In Stock</Badge>
                                                                                                )}
                                                                                        </TableCell>
                                                                                </motion.tr>
                                                                        );
                                                                })}
                                                        </TableBody>
                                                </Table>
                                        </div>
                                )}
                        </CardContent>

                        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                                <DialogContent>
                                        <DialogHeader>
                                                <DialogTitle>Add Stock Item</DialogTitle>
                                                <DialogDescription>Create a new inventory item. Opening stock seeds the live balance.</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-3">
                                                <div className="space-y-1.5">
                                                        <Label htmlFor="item-name" className="text-xs">Name</Label>
                                                        <Input id="item-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Basmati Rice" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1.5">
                                                                <Label htmlFor="item-sku" className="text-xs">SKU</Label>
                                                                <Input id="item-sku" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })} placeholder="RICE-001" />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                                <Label className="text-xs">Unit</Label>
                                                                <Select value={form.unit} onValueChange={(v: string) => v && setForm({ ...form, unit: v as Unit })}>
                                                                        <SelectTrigger>
                                                                                <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                                {UNITS.map((u) => (
                                                                                        <SelectItem key={u} value={u}>{u}</SelectItem>
                                                                                ))}
                                                                        </SelectContent>
                                                                </Select>
                                                        </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1.5">
                                                                <Label htmlFor="item-open" className="text-xs">Opening Stock</Label>
                                                                <Input id="item-open" type="number" min="0" value={form.openingStock} onChange={(e) => setForm({ ...form, openingStock: e.target.value })} />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                                <Label htmlFor="item-cost" className="text-xs">Cost / Unit (₹)</Label>
                                                                <Input id="item-cost" type="number" min="0" step="0.01" value={form.costPerUnit} onChange={(e) => setForm({ ...form, costPerUnit: e.target.value })} />
                                                        </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1.5">
                                                                <Label htmlFor="item-reorder" className="text-xs">Reorder Level</Label>
                                                                <Input id="item-reorder" type="number" min="0" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                                <Label htmlFor="item-reorder-qty" className="text-xs">Reorder Qty</Label>
                                                                <Input id="item-reorder-qty" type="number" min="0" value={form.reorderQty} onChange={(e) => setForm({ ...form, reorderQty: e.target.value })} />
                                                        </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                        <Label htmlFor="item-supplier" className="text-xs">Supplier</Label>
                                                        <Input id="item-supplier" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="Supplier name" />
                                                </div>
                                        </div>
                                        <DialogFooter>
                                                <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button>
                                                <Button onClick={handleSave} loading={saving}>Create Item</Button>
                                        </DialogFooter>
                                </DialogContent>
                        </Dialog>
                </Card>
        );
}

// ─── Stock-In / GRN tab ─────────────────────────────────────────────────────
function StockInTab() {
        const [items, setItems] = useState<StockItem[]>([]);
        const [loading, setLoading] = useState(true);
        const [saving, setSaving] = useState(false);
        const [form, setForm] = useState<StockInForm>({
                inventoryId: "",
                qty: "",
                rate: "",
                supplier: "",
                invoiceRef: "",
        });

        const fetchItems = useCallback(async () => {
                setLoading(true);
                try {
                        const res = await fetch("/api/inventory");
                        const data = (await res.json()) as { items?: StockItem[]; message?: string };
                        if (!res.ok) throw new Error(data.message ?? "Failed to load inventory");
                        setItems(data.items ?? []);
                } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Failed to load inventory");
                } finally {
                        setLoading(false);
                }
        }, []);

        useEffect(() => {
                fetchItems();
        }, [fetchItems]);

        const handleSave = async () => {
                if (!form.inventoryId) {
                        toast.error("Select an item");
                        return;
                }
                if (!form.qty || Number(form.qty) <= 0) {
                        toast.error("Quantity must be > 0");
                        return;
                }
                if (!form.rate || Number(form.rate) < 0) {
                        toast.error("Rate must be >= 0");
                        return;
                }
                setSaving(true);
                try {
                        const res = await fetch("/api/inventory/stock-in", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                        inventoryId: form.inventoryId,
                                        qty: Number(form.qty),
                                        rate: Number(form.rate),
                                        supplier: form.supplier || undefined,
                                        invoiceRef: form.invoiceRef || undefined,
                                }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data?.message ?? "Failed to record stock-in");
                        toast.success("Stock-In recorded — audit chain appended");
                        setForm({ inventoryId: "", qty: "", rate: "", supplier: "", invoiceRef: "" });
                        await fetchItems();
                } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Failed to record stock-in");
                } finally {
                        setSaving(false);
                }
        };

        const recent = items
                .flatMap((i) => (i.stockIn ?? []).map((s) => ({ ...s, item: i.name })))
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 12);

        return (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <Card>
                                <CardHeader className="pb-3">
                                        <CardTitle className="text-sm">Record Stock-In (GRN)</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                        {loading ? (
                                                <Skeleton className="h-32 w-full rounded-lg" />
                                        ) : items.length === 0 ? (
                                                <EmptyState
                                                        icon={<PackageOpen className="h-7 w-7 text-muted-foreground" />}
                                                        title="No items to receive"
                                                        subtitle="Add stock items first, then record GRN against them."
                                                        actionLabel="Reload"
                                                        onAction={fetchItems}
                                                />
                                        ) : (
                                                <>
                                                        <div className="space-y-1.5">
                                                                <Label className="text-xs">Item</Label>
                                                                <Select value={form.inventoryId} onValueChange={(v: string) => v && setForm({ ...form, inventoryId: v })}>
                                                                        <SelectTrigger>
                                                                                <SelectValue placeholder="Select item" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                                {items.map((i) => (
                                                                                        <SelectItem key={i._id} value={i._id}>
                                                                                                {i.name} ({i.currentStock} {i.unit})
                                                                                        </SelectItem>
                                                                                ))}
                                                                        </SelectContent>
                                                                </Select>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                                <div className="space-y-1.5">
                                                                        <Label className="text-xs">Quantity</Label>
                                                                        <Input type="number" min="0" step="0.01" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} />
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                        <Label className="text-xs">Rate (₹/unit)</Label>
                                                                        <Input type="number" min="0" step="0.01" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
                                                                </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                                <div className="space-y-1.5">
                                                                        <Label className="text-xs">Supplier</Label>
                                                                        <Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="Supplier" />
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                        <Label className="text-xs">Invoice Ref</Label>
                                                                        <Input value={form.invoiceRef} onChange={(e) => setForm({ ...form, invoiceRef: e.target.value })} placeholder="INV-001" />
                                                                </div>
                                                        </div>
                                                        <Button onClick={handleSave} loading={saving} className="w-full">
                                                                Record Stock-In
                                                        </Button>
                                                </>
                                        )}
                                </CardContent>
                        </Card>

                        <Card>
                                <CardHeader className="pb-3">
                                        <CardTitle className="text-sm">Recent GRN Entries</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                        {recent.length === 0 ? (
                                                <div className="p-6 text-center text-xs text-muted-foreground">No stock-in recorded yet.</div>
                                        ) : (
                                                <div className="max-h-[360px] overflow-auto">
                                                        <Table>
                                                                <TableHeader>
                                                                        <TableRow>
                                                                                <TableHead>Item</TableHead>
                                                                                <TableHead className="text-right">Qty</TableHead>
                                                                                <TableHead className="text-right">Rate</TableHead>
                                                                                <TableHead>Supplier</TableHead>
                                                                                <TableHead>Date</TableHead>
                                                                        </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                        {recent.map((s, i) => (
                                                                                <TableRow key={`grn-${i.toString()}-${s.date}`}>
                                                                                        <TableCell className="font-medium">{s.item}</TableCell>
                                                                                        <TableCell className="text-right tabular-nums">{s.qty}</TableCell>
                                                                                        <TableCell className="text-right tabular-nums">₹{s.rate.toFixed(2)}</TableCell>
                                                                                        <TableCell className="text-xs">{s.supplier ?? "—"}</TableCell>
                                                                                        <TableCell className="text-xs">{formatDate(s.date)}</TableCell>
                                                                                </TableRow>
                                                                        ))}
                                                                </TableBody>
                                                        </Table>
                                                </div>
                                        )}
                                </CardContent>
                        </Card>
                </div>
        );
}

// ─── Wastage tab ────────────────────────────────────────────────────────────
function WastageTab() {
        const [items, setItems] = useState<StockItem[]>([]);
        const [loading, setLoading] = useState(true);
        const [saving, setSaving] = useState(false);
        const [form, setForm] = useState<WastageForm>({
                inventoryId: "",
                qty: "",
                reasonCode: "spoilage",
                note: "",
        });

        const fetchItems = useCallback(async () => {
                setLoading(true);
                try {
                        const res = await fetch("/api/inventory");
                        const data = (await res.json()) as { items?: StockItem[]; message?: string };
                        if (!res.ok) throw new Error(data.message ?? "Failed to load inventory");
                        setItems(data.items ?? []);
                } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Failed to load inventory");
                } finally {
                        setLoading(false);
                }
        }, []);

        useEffect(() => {
                fetchItems();
        }, [fetchItems]);

        const handleSave = async () => {
                if (!form.inventoryId) {
                        toast.error("Select an item");
                        return;
                }
                if (!form.qty || Number(form.qty) <= 0) {
                        toast.error("Quantity must be > 0");
                        return;
                }
                setSaving(true);
                try {
                        const res = await fetch("/api/inventory/wastage", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                        inventoryId: form.inventoryId,
                                        qty: Number(form.qty),
                                        reasonCode: form.reasonCode,
                                        note: form.note || undefined,
                                }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data?.message ?? "Failed to record wastage");
                        toast.success("Wastage recorded — audit chain appended");
                        setForm({ inventoryId: "", qty: "", reasonCode: "spoilage", note: "" });
                        await fetchItems();
                } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Failed to record wastage");
                } finally {
                        setSaving(false);
                }
        };

        const recent = items
                .flatMap((i) => (i.wastage ?? []).map((w) => ({ ...w, item: i.name })))
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 12);

        return (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <Card>
                                <CardHeader className="pb-3">
                                        <CardTitle className="text-sm">Log Wastage</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                        {loading ? (
                                                <Skeleton className="h-32 w-full rounded-lg" />
                                        ) : items.length === 0 ? (
                                                <EmptyState
                                                        icon={<Trash2 className="h-7 w-7 text-muted-foreground" />}
                                                        title="No items to log"
                                                        subtitle="Add stock items first, then record wastage against them."
                                                        actionLabel="Reload"
                                                        onAction={fetchItems}
                                                />
                                        ) : (
                                                <>
                                                        <div className="space-y-1.5">
                                                                <Label className="text-xs">Item</Label>
                                                                <Select value={form.inventoryId} onValueChange={(v: string) => v && setForm({ ...form, inventoryId: v })}>
                                                                        <SelectTrigger>
                                                                                <SelectValue placeholder="Select item" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                                {items.map((i) => (
                                                                                        <SelectItem key={i._id} value={i._id}>
                                                                                                {i.name} ({i.currentStock} {i.unit})
                                                                                        </SelectItem>
                                                                                ))}
                                                                        </SelectContent>
                                                                </Select>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                                <div className="space-y-1.5">
                                                                        <Label className="text-xs">Quantity</Label>
                                                                        <Input type="number" min="0" step="0.01" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} />
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                        <Label className="text-xs">Reason</Label>
                                                                        <Select value={form.reasonCode} onValueChange={(v: string) => v && setForm({ ...form, reasonCode: v })}>
                                                                                <SelectTrigger>
                                                                                        <SelectValue />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                        {WASTAGE_REASONS.map((r) => (
                                                                                                <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>
                                                                                        ))}
                                                                                </SelectContent>
                                                                        </Select>
                                                                </div>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                                <Label className="text-xs">Note</Label>
                                                                <Textarea rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Optional context" />
                                                        </div>
                                                        <Button onClick={handleSave} loading={saving} className="w-full">
                                                                Record Wastage
                                                        </Button>
                                                </>
                                        )}
                                </CardContent>
                        </Card>

                        <Card>
                                <CardHeader className="pb-3">
                                        <CardTitle className="text-sm">Recent Wastage Entries</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                        {recent.length === 0 ? (
                                                <div className="p-6 text-center text-xs text-muted-foreground">No wastage recorded yet.</div>
                                        ) : (
                                                <div className="max-h-[360px] overflow-auto">
                                                        <Table>
                                                                <TableHeader>
                                                                        <TableRow>
                                                                                <TableHead>Item</TableHead>
                                                                                <TableHead className="text-right">Qty</TableHead>
                                                                                <TableHead>Reason</TableHead>
                                                                                <TableHead>By</TableHead>
                                                                                <TableHead>Date</TableHead>
                                                                        </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                        {recent.map((w, i) => (
                                                                                <TableRow key={`w-${i.toString()}-${w.date}`}>
                                                                                        <TableCell className="font-medium">{w.item}</TableCell>
                                                                                        <TableCell className="text-right tabular-nums text-destructive">-{w.qty}</TableCell>
                                                                                        <TableCell>
                                                                                                <Badge variant="outline" className="text-[10px]">{w.reasonCode}</Badge>
                                                                                        </TableCell>
                                                                                        <TableCell className="text-xs">{w.authorizedBy ?? "—"}</TableCell>
                                                                                        <TableCell className="text-xs">{formatDate(w.date)}</TableCell>
                                                                                </TableRow>
                                                                        ))}
                                                                </TableBody>
                                                        </Table>
                                                </div>
                                        )}
                                </CardContent>
                        </Card>
                </div>
        );
}

// ─── Physical Count tab ─────────────────────────────────────────────────────
function PhysicalCountTab() {
        const [items, setItems] = useState<StockItem[]>([]);
        const [loading, setLoading] = useState(true);
        const [saving, setSaving] = useState(false);
        const [form, setForm] = useState<CountForm>({ items: [] });

        const fetchItems = useCallback(async () => {
                setLoading(true);
                try {
                        const res = await fetch("/api/inventory");
                        const data = (await res.json()) as { items?: StockItem[]; message?: string };
                        if (!res.ok) throw new Error(data.message ?? "Failed to load inventory");
                        const list = data.items ?? [];
                        setItems(list);
                        setForm({
                                items: list.map((i: StockItem) => ({
                                        inventoryId: i._id,
                                        name: i.name,
                                        counted: String(i.currentStock),
                                        previous: i.currentStock,
                                })),
                        });
                } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Failed to load inventory");
                } finally {
                        setLoading(false);
                }
        }, []);

        useEffect(() => {
                fetchItems();
        }, [fetchItems]);

        const handleSave = async () => {
                setSaving(true);
                try {
                        const res = await fetch("/api/inventory/physical-count", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                        items: form.items
                                                .filter((i) => i.counted !== "" && !Number.isNaN(Number(i.counted)))
                                                .map((i) => ({ inventoryId: i.inventoryId, qty: Number(i.counted) })),
                                }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data?.message ?? "Failed to save physical count");
                        toast.success("Physical count saved — audit chain appended");
                        await fetchItems();
                } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Failed to save physical count");
                } finally {
                        setSaving(false);
                }
        };

        return (
                <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                                <CardTitle className="text-sm">Physical Count</CardTitle>
                                <Button size="sm" onClick={handleSave} loading={saving} disabled={loading || form.items.length === 0}>
                                        Save Count
                                </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                                {loading ? (
                                        <div className="space-y-2 p-4">
                                                {[...Array(4)].map((_, i) => (
                                                        <Skeleton key={`pc-sk-${i.toString()}`} className="h-10 w-full rounded-lg" />
                                                ))}
                                        </div>
                                ) : form.items.length === 0 ? (
                                        <EmptyState
                                                icon={<PackageOpen className="h-7 w-7 text-muted-foreground" />}
                                                title="No stock items"
                                                subtitle="Add stock items first to perform a physical count."
                                                actionLabel="Reload"
                                                onAction={fetchItems}
                                        />
                                ) : (
                                        <div className="max-h-[480px] overflow-auto">
                                                <Table>
                                                        <TableHeader>
                                                                <TableRow>
                                                                        <TableHead>Item</TableHead>
                                                                        <TableHead className="text-right">Previous</TableHead>
                                                                        <TableHead className="text-right">Counted</TableHead>
                                                                        <TableHead className="text-right">Δ</TableHead>
                                                                </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                                {form.items.map((row: CountForm["items"][number], i: number) => {
                                                                        const delta = Number(row.counted) - row.previous;
                                                                        return (
                                                                                <TableRow key={row.inventoryId}>
                                                                                        <TableCell className="font-medium">{row.name}</TableCell>
                                                                                        <TableCell className="text-right tabular-nums text-muted-foreground">{row.previous}</TableCell>
                                                                                        <TableCell className="text-right">
                                                                                                <Input
                                                                                                        type="number"
                                                                                                        className="ml-auto h-8 w-24 text-right"
                                                                                                        value={row.counted}
                                                                                                        onChange={(e) => {
                                                                                                                const next = [...form.items];
                                                                                                                next[i] = { ...next[i], counted: e.target.value };
                                                                                                                setForm({ items: next });
                                                                                                        }}
                                                                                                />
                                                                                        </TableCell>
                                                                                        <TableCell className={`text-right tabular-nums ${delta < 0 ? "text-destructive font-semibold" : delta > 0 ? "text-emerald-600 dark:text-emerald-400 font-semibold" : ""}`}>
                                                                                                {delta > 0 ? "+" : ""}
                                                                                                {delta.toFixed(2)}
                                                                                        </TableCell>
                                                                                </TableRow>
                                                                        );
                                                                })}
                                                        </TableBody>
                                                </Table>
                                        </div>
                                )}
                        </CardContent>
                </Card>
        );
}

// ─── Suppliers tab ──────────────────────────────────────────────────────────
function SuppliersTab() {
        const [suppliers, setSuppliers] = useState<Supplier[]>([]);
        const [loading, setLoading] = useState(true);
        const [page, setPage] = useState(1);
        const [total, setTotal] = useState(0);
        const [modalOpen, setModalOpen] = useState(false);
        const [saving, setSaving] = useState(false);
        const [form, setForm] = useState({ name: "", phone: "", gstin: "", items: "" });
        const limit = 20;

        const fetchSuppliers = useCallback(async () => {
                setLoading(true);
                try {
                        const res = await fetch("/api/suppliers");
                        const data = (await res.json()) as { suppliers?: Supplier[]; message?: string };
                        if (!res.ok) throw new Error(data.message ?? "Failed to load suppliers");
                        setSuppliers(data.suppliers ?? []);
                        setTotal(data.suppliers?.length ?? 0);
                } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Failed to load suppliers");
                } finally {
                        setLoading(false);
                }
        }, []);

        useEffect(() => {
                fetchSuppliers();
        }, [fetchSuppliers]);

        const handleSave = async () => {
                if (!form.name.trim()) {
                        toast.error("Supplier name is required");
                        return;
                }
                setSaving(true);
                try {
                        const res = await fetch("/api/suppliers", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                        name: form.name.trim(),
                                        phone: form.phone.trim() || undefined,
                                        gstin: form.gstin.trim().toUpperCase() || undefined,
                                        items: form.items.split(",").map((s) => s.trim()).filter(Boolean),
                                }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data?.message ?? "Failed to create supplier");
                        toast.success("Supplier created");
                        setModalOpen(false);
                        setForm({ name: "", phone: "", gstin: "", items: "" });
                        await fetchSuppliers();
                } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Failed to create supplier");
                } finally {
                        setSaving(false);
                }
        };

        const start = (page - 1) * limit;
        const paged = suppliers.slice(start, start + limit);
        const totalPages = Math.max(1, Math.ceil(total / limit));

        return (
                <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                                <CardTitle className="text-sm">Suppliers</CardTitle>
                                <Button size="sm" onClick={() => setModalOpen(true)}>
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add Supplier
                                </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                                {loading ? (
                                        <div className="space-y-2 p-4">
                                                {[...Array(4)].map((_, i) => (
                                                        <Skeleton key={`sup-sk-${i.toString()}`} className="h-10 w-full rounded-lg" />
                                                ))}
                                        </div>
                                ) : suppliers.length === 0 ? (
                                        <EmptyState
                                                icon={<PackageOpen className="h-7 w-7 text-muted-foreground" />}
                                                title="No suppliers yet"
                                                subtitle="Add your first vendor to track purchases, GSTIN and outstanding balances."
                                                actionLabel="Add Supplier"
                                                onAction={() => setModalOpen(true)}
                                        />
                                ) : (
                                        <>
                                                <div className="max-h-[480px] overflow-auto">
                                                        <Table>
                                                                <TableHeader>
                                                                        <TableRow>
                                                                                <TableHead>Name</TableHead>
                                                                                <TableHead>Phone</TableHead>
                                                                                <TableHead>GSTIN</TableHead>
                                                                                <TableHead>Items</TableHead>
                                                                                <TableHead className="text-right">Outstanding</TableHead>
                                                                        </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                        {paged.map((s: Supplier, i: number) => (
                                                                                <motion.tr
                                                                                        key={s._id}
                                                                                        initial={{ opacity: 0, y: 6 }}
                                                                                        animate={{ opacity: 1, y: 0 }}
                                                                                        transition={{ delay: Math.min(i * 0.04, 0.4), duration: 0.25 }}
                                                                                        className="hover:bg-muted/40">
                                                                                        <TableCell className="font-medium">{s.name}</TableCell>
                                                                                        <TableCell className="text-xs">{s.phone ?? "—"}</TableCell>
                                                                                        <TableCell className="font-mono text-xs">{s.gstin ?? "—"}</TableCell>
                                                                                        <TableCell className="text-xs text-muted-foreground">{(s.items ?? []).join(", ") || "—"}</TableCell>
                                                                                        <TableCell className="text-right tabular-nums">₹{(s.outstandingBalance ?? 0).toFixed(2)}</TableCell>
                                                                                </motion.tr>
                                                                        ))}
                                                                </TableBody>
                                                        </Table>
                                                </div>
                                                {totalPages > 1 && (
                                                        <div className="flex items-center justify-between px-4 py-3 border-t">
                                                                <p className="text-xs text-muted-foreground">
                                                                        Showing {start + 1}–{Math.min(start + limit, total)} of {total}
                                                                </p>
                                                                <div className="flex items-center gap-2">
                                                                        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                                                                                <ChevronLeft className="h-3.5 w-3.5" />
                                                                                Prev
                                                                        </Button>
                                                                        <span className="text-xs tabular-nums">{page} / {totalPages}</span>
                                                                        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                                                                                Next
                                                                                <ChevronRight className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                </div>
                                                        </div>
                                                )}
                                        </>
                                )}
                        </CardContent>

                        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                                <DialogContent>
                                        <DialogHeader>
                                                <DialogTitle>Add Supplier</DialogTitle>
                                                <DialogDescription>Vendor master record. GSTIN is used by the GSTR-2B reconciliation flow.</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-3">
                                                <div className="space-y-1.5">
                                                        <Label htmlFor="sup-name" className="text-xs">Name</Label>
                                                        <Input id="sup-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1.5">
                                                                <Label htmlFor="sup-phone" className="text-xs">Phone</Label>
                                                                <Input id="sup-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                                <Label htmlFor="sup-gstin" className="text-xs">GSTIN</Label>
                                                                <Input id="sup-gstin" value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })} maxLength={15} />
                                                        </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                        <Label htmlFor="sup-items" className="text-xs">Items (comma-separated)</Label>
                                                        <Input id="sup-items" value={form.items} onChange={(e) => setForm({ ...form, items: e.target.value })} placeholder="Rice, Oil, Spices" />
                                                </div>
                                        </div>
                                        <DialogFooter>
                                                <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button>
                                                <Button onClick={handleSave} loading={saving}>Create</Button>
                                        </DialogFooter>
                                </DialogContent>
                        </Dialog>
                </Card>
        );
}

// ─── Shared empty-state component ───────────────────────────────────────────
function EmptyState({
        icon,
        title,
        subtitle,
        actionLabel,
        onAction,
}: {
        icon: React.ReactNode;
        title: string;
        subtitle: string;
        actionLabel?: string;
        onAction?: () => void;
}) {
        return (
                <div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">{icon}</div>
                        <div>
                                <p className="text-sm font-semibold">{title}</p>
                                <p className="text-xs text-muted-foreground mt-1 max-w-sm">{subtitle}</p>
                        </div>
                        {actionLabel && onAction && (
                                <Button variant="outline" size="sm" onClick={onAction}>
                                        {actionLabel}
                                </Button>
                        )}
                </div>
        );
}

// Loader export — used by parent Settings.tsx if it ever needs to show a global loader.
export function SettingsInventoryLoader() {
        return (
                <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
        );
}
