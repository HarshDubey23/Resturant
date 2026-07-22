"use client";

import { Check, Eye, EyeOff, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

const PROVIDERS = [
	{ key: "groq", label: "Groq", placeholder: "gsk_your_groq_api_key" },
	{ key: "cerebras", label: "Cerebras", placeholder: "your_cerebras_api_key" },
	{ key: "google", label: "Google Gemini", placeholder: "AIza_your_google_api_key" },
	{ key: "siliconflow", label: "SiliconFlow", placeholder: "your_siliconflow_api_key" },
];

export default function AIKeysSettings() {
	const [keys, setKeys] = useState<Record<string, string>>({});
	const [visible, setVisible] = useState<Record<string, boolean>>({});
	const [saving, setSaving] = useState(false);
	const [loading, setLoading] = useState(true);
	const [configured, setConfigured] = useState<Record<string, boolean>>({});

	useEffect(() => {
		fetch("/api/admin/ai-keys")
			.then((r) => r.json())
			.then((data) => {
				if (data?.configured) setConfigured(data.configured);
			})
			.catch(() => {})
			.finally(() => setLoading(false));
	}, []);

	const handleSave = async () => {
		setSaving(true);
		try {
			const res = await fetch("/api/admin/ai-keys", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(keys),
			});
			const data = await res.json();
			if (res.ok) {
				toast.success("AI keys saved successfully");
				setKeys({});
				const updated = { ...configured };
				for (const p of PROVIDERS) {
					if (keys[p.key]) updated[p.key] = true;
				}
				setConfigured(updated);
			} else {
				toast.error(data?.message || "Failed to save keys");
			}
		} catch {
			toast.error("Failed to save keys");
		}
		setSaving(false);
	};

	const hasPendingKey = Object.values(keys).some((v) => v);

	return (
		<div className="p-6 max-w-2xl space-y-6">
			<div className="flex items-start gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
					<KeyRound className="h-5 w-5" />
				</div>
				<div>
					<h2 className="text-xl font-bold tracking-tight">AI Provider Keys</h2>
					<p className="text-sm text-muted-foreground mt-1">
						Override global AI provider keys for this restaurant. Keys are write-only — stored encrypted and never returned.
					</p>
				</div>
			</div>

			<div className="space-y-4">
				{loading
					? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
					: PROVIDERS.map(({ key, label, placeholder }) => (
							<div key={key} className="space-y-1.5">
								<Label htmlFor={`key-${key}`} className="flex items-center gap-2 text-sm font-medium">
									{label}
									{configured[key] && (
										<span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 ring-1 ring-emerald-200">
											<Check className="h-2.5 w-2.5" />
											Configured
										</span>
									)}
								</Label>
								<div className="relative">
									<Input
										id={`key-${key}`}
										type={visible[key] ? "text" : "password"}
										placeholder={configured[key] ? "••••••• (overwrite)" : placeholder}
										value={keys[key] || ""}
										onChange={(e) => setKeys((k) => ({ ...k, [key]: e.target.value }))}
										className="pr-10 font-mono text-sm"
										autoComplete="off"
									/>
									<button
										type="button"
										onClick={() => setVisible((v) => ({ ...v, [key]: !v[key] }))}
										className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
										aria-label={visible[key] ? "Hide key" : "Show key"}>
										{visible[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
									</button>
								</div>
							</div>
						))}
			</div>

			<Button
				onClick={handleSave}
				disabled={saving || !hasPendingKey}
				className="bg-gradient-to-br from-primary to-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all">
				{saving ? "Saving…" : "Save Keys"}
			</Button>
		</div>
	);
}
