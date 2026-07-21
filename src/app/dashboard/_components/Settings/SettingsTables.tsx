"use client";

import { Download, QrCode } from "lucide-react";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

import { useAdmin } from "#components/context/useContext";
import { Button } from "@/components/ui/button";

export default function SettingsTables() {
	const { tables, profile } = useAdmin();
	const [qrs, setQrs] = useState<Record<string, string>>({});

	const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3050";

	useEffect(() => {
		if (!tables?.length) return;
		let cancelled = false;
		(async () => {
			const map: Record<string, string> = {};
			for (const t of tables) {
				const url = `${baseUrl}/${profile?.restaurantID || "demo"}?table=${t.username}`;
				map[t.username] = await QRCode.toDataURL(url, { width: 300, margin: 1 });
			}
			if (!cancelled) setQrs(map);
		})();
		return () => { cancelled = true; };
	}, [tables, baseUrl, profile?.restaurantID]);

	if (!tables?.length) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
				<QrCode className="h-12 w-12 mb-3 opacity-40" />
				<p>No tables created yet</p>
			</div>
		);
	}

	return (
		<div className="space-y-6 p-4">
			<div>
				<h2 className="text-lg font-semibold">Table QR Codes</h2>
				<p className="text-sm text-muted-foreground">Print these QR codes and place them on tables for customers to scan and order.</p>
			</div>
			<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{tables.map((t) => (
					<div key={t._id?.toString()} className="flex flex-col items-center gap-3 rounded-xl border bg-card p-4">
						{qrs[t.username] ? (
							<div className="relative">
								<img src={qrs[t.username]} alt={`QR for Table ${t.name}`} className="h-40 w-40" />
							</div>
						) : (
							<div className="flex h-40 w-40 items-center justify-center rounded-lg bg-muted">
								<QrCode className="h-8 w-8 text-muted-foreground animate-pulse" />
							</div>
						)}
						<div className="text-center">
							<p className="font-medium text-sm">Table {t.name}</p>
							<p className="text-xs text-muted-foreground">{baseUrl}/{profile?.restaurantID}?table={t.username}</p>
						</div>
						{qrs[t.username] && (
							<Button
								size="sm"
								variant="outline"
								className="w-full gap-2"
								onClick={() => {
									const a = document.createElement("a");
									a.href = qrs[t.username];
									a.download = `table-${t.name}-qr.png`;
									a.click();
								}}>
								<Download className="h-3 w-3" />
								Download
							</Button>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
