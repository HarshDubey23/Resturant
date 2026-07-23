"use client";

import { AlertCircle, Download, Info, Loader2, Plus, Printer, QrCode, Sparkles, Trash2 } from "lucide-react";
import Image from "next/image";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useAdmin } from "#components/context/useContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsTables() {
	const { tables, profile, profileMutate } = useAdmin();
	const [qrs, setQrs] = useState<Record<string, string>>({});
	const [adding, setAdding] = useState(false);
	const [prefix, setPrefix] = useState("T");
	const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
	const [deleting, setDeleting] = useState(false);

	// Prefer the env-configured base URL — falls back to window.origin only on client.
	// This ensures QR codes encode the production URL even during SSR.
	const baseUrl = process.env.NEXT_PUBLIC_URL || (typeof window !== "undefined" ? window.location.origin : "https://orderworder.com");
	const slug = profile?.restaurantID || "demo";

	useEffect(() => {
		if (!tables?.length) return;
		let cancelled = false;
		(async () => {
			const map: Record<string, string> = {};
			for (const t of tables) {
				const url = `${baseUrl}/${slug}?table=${t.username}`;
				try {
					map[t.username] = await QRCode.toDataURL(url, { width: 400, margin: 2 });
				} catch {
					// skip failed generation
				}
			}
			if (!cancelled) setQrs(map);
		})();
		return () => {
			cancelled = true;
		};
	}, [tables, baseUrl, slug]);

	const handleAddTable = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!prefix.trim()) return toast.error("Prefix is required");
		setAdding(true);
		try {
			const res = await fetch("/api/admin/tables", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ prefix: prefix.trim().slice(0, 3) }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data?.message || "Failed to add table");
			toast.success(data.message || "Table added");
			await profileMutate();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to add table");
		} finally {
			setAdding(false);
		}
	};

	const handleDeleteTable = async () => {
		if (!deleteTarget) return;
		setDeleting(true);
		try {
			const res = await fetch("/api/admin/tables", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ tableId: deleteTarget.id }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data?.message || "Failed to delete table");
			toast.success(data.message || "Table removed");
			await profileMutate();
			setDeleteTarget(null);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to delete table");
		} finally {
			setDeleting(false);
		}
	};

	const printAll = () => {
		const w = window.open("", "_blank", "width=800,height=900");
		if (!w) {
			toast.error("Pop-up blocked. Please allow pop-ups for this site.");
			return;
		}
		const items = tables
			.map((t) => {
				const qr = qrs[t.username];
				if (!qr) return "";
				return `
                                <div class="qr-card">
                                        <img src="${qr}" alt="QR for Table ${t.name}" />
                                        <div class="name">Table ${t.name}</div>
                                        <div class="url">${slug}?table=${t.username}</div>
                                </div>`;
			})
			.join("");
		w.document.write(`
                        <html>
                        <head>
                                <title>${profile?.name ?? "Restaurant"} — Table QR codes</title>
                                <style>
                                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; background: #f7f7f7; margin: 0; }
                                        h1 { font-size: 20px; text-align: center; margin: 0 0 8px 0; color: #111; }
                                        .sub { text-align: center; font-size: 12px; color: #666; margin-bottom: 24px; }
                                        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; max-width: 700px; margin: 0 auto; }
                                        .qr-card { background: white; border: 1px solid #e5e5e5; border-radius: 12px; padding: 16px; text-align: center; page-break-inside: avoid; }
                                        .qr-card img { width: 200px; height: 200px; object-fit: contain; }
                                        .qr-card .name { font-size: 18px; font-weight: 700; margin-top: 8px; color: #111; }
                                        .qr-card .url { font-size: 10px; color: #888; margin-top: 4px; font-family: monospace; }
                                        .brand { text-align: center; font-size: 11px; color: #999; margin-top: 32px; }
                                        @media print { body { background: white; padding: 0; } .no-print { display: none; } }
                                </style>
                        </head>
                        <body>
                                <h1>${profile?.name ?? "Restaurant"}</h1>
                                <div class="sub">Scan to view menu & place order</div>
                                <div class="grid">${items}</div>
                                <div class="brand">Powered by OrderWorder</div>
                        </body>
                        </html>`);
		w.document.close();
		setTimeout(() => w.print(), 250);
	};

	const downloadOne = (tableName: string, username: string) => {
		const qr = qrs[username];
		if (!qr) return;
		const a = document.createElement("a");
		a.href = qr;
		a.download = `table-${tableName}-qr.png`;
		a.click();
	};

	return (
		<div className="space-y-6 p-4">
			{/* Header */}
			<div className="flex items-start justify-between flex-wrap gap-4">
				<div>
					<h2 className="text-lg font-bold tracking-tight">Table QR codes</h2>
					<p className="text-sm text-muted-foreground mt-0.5 max-w-md">
						Print these and place one on each table. Customers scan to instantly open your menu — no app, no login.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button onClick={printAll} disabled={!tables?.length} variant="outline" size="sm" className="gap-2 rounded-xl">
						<Printer className="h-4 w-4" />
						Print all{tables?.length ? ` (${tables.length})` : ""}
					</Button>
				</div>
			</div>

			{/* Add table form */}
			<form onSubmit={handleAddTable} className="rounded-2xl border bg-card p-4 flex items-end gap-3 flex-wrap">
				<div className="space-y-1.5 flex-1 min-w-[200px]">
					<Label htmlFor="table-prefix" className="text-xs">
						Add a new table
					</Label>
					<div className="flex items-center gap-2">
						<Input
							id="table-prefix"
							value={prefix}
							onChange={(e) => setPrefix(e.target.value.toUpperCase().slice(0, 3))}
							placeholder="T"
							className="w-20"
							maxLength={3}
						/>
						<span className="text-sm text-muted-foreground">
							Next table will be{" "}
							<span className="font-semibold text-foreground">
								{prefix}
								{(tables?.length ?? 0) + 1}
							</span>
						</span>
					</div>
					<p className="text-[10px] text-muted-foreground">Prefix is the letter(s) before the table number (e.g. T1, T2, B1 for bar).</p>
				</div>
				<Button type="submit" loading={adding} size="sm" className="gap-2">
					<Plus className="h-4 w-4" />
					Add Table
				</Button>
			</form>

			{/* QR grid */}
			{!tables?.length ? (
				<div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-2xl">
					<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
						<QrCode className="h-8 w-8 text-muted-foreground" />
					</div>
					<p className="text-sm font-semibold">No tables yet</p>
					<p className="text-xs text-muted-foreground mt-1 max-w-xs">Use the form above to add your first table. Its QR code will appear here instantly.</p>
				</div>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{tables.map((t) => (
						<div key={t.username} className="rounded-2xl border bg-card overflow-hidden group transition-all hover:shadow-lg hover:-translate-y-0.5">
							<div className="bg-white p-5 flex justify-center">
								{qrs[t.username] ? (
									<Image src={qrs[t.username]} alt={`QR for Table ${t.name}`} width={180} height={180} className="h-44 w-44" unoptimized />
								) : (
									<div className="flex h-44 w-44 items-center justify-center rounded-lg bg-muted">
										<Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
									</div>
								)}
							</div>
							<div className="p-4">
								<div className="flex items-center justify-between mb-2">
									<p className="font-bold text-sm">Table {t.name}</p>
									<span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
										<span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
										Active
									</span>
								</div>
								<p className="text-[10px] text-muted-foreground truncate mb-3 font-mono">
									{slug}?table={t.username}
								</p>
								<div className="flex gap-2">
									<Button
										size="sm"
										variant="outline"
										className="flex-1 gap-2 rounded-lg"
										disabled={!qrs[t.username]}
										onClick={() => downloadOne(t.name, t.username)}>
										<Download className="h-3.5 w-3.5" />
										PNG
									</Button>
									<Button
										size="sm"
										variant="ghost"
										className="px-2 text-muted-foreground hover:text-destructive"
										onClick={() => setDeleteTarget({ id: (t as unknown as { _id: { toString: () => string } })._id.toString(), name: t.name })}
										aria-label={`Delete table ${t.name}`}>
										<Trash2 className="h-3.5 w-3.5" />
									</Button>
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Info card */}
			<div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 flex items-start gap-4">
				<div className="flex h-10 w-10 rounded-xl bg-primary/15 text-primary items-center justify-center flex-shrink-0">
					<Info className="h-5 w-5" />
				</div>
				<div>
					<p className="font-semibold text-sm flex items-center gap-1.5">
						<Sparkles className="h-3.5 w-3.5 text-primary" />
						How customers use these
					</p>
					<p className="text-xs text-muted-foreground mt-1 leading-relaxed">
						Customer opens their phone camera, points at the QR, and taps the notification. Your menu loads instantly — they order, pay online or at the
						table, and the kitchen gets an immediate alert. No app install required, ever.
					</p>
				</div>
			</div>

			{/* Delete confirmation */}
			<Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<AlertCircle className="h-5 w-5 text-destructive" />
							Delete Table {deleteTarget?.name}?
						</DialogTitle>
						<DialogDescription>
							This permanently removes the table and its QR code. Past orders from this table are preserved in your history.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="gap-2">
						<Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={handleDeleteTable} loading={deleting}>
							Delete Table
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
