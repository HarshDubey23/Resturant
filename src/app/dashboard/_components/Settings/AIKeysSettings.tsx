"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const PROVIDERS = [
	{ key: "groq", label: "Groq", placeholder: "gsk_your_groq_api_key" },
	{ key: "cerebras", label: "Cerebras", placeholder: "your_cerebras_api_key" },
	{ key: "google", label: "Google Gemini", placeholder: "AIza_your_google_api_key" },
	{ key: "siliconflow", label: "SiliconFlow", placeholder: "your_siliconflow_api_key" },
];

export default function AIKeysSettings() {
	const [keys, setKeys] = useState<Record<string, string>>({});
	const [saving, setSaving] = useState(false);
	const [configured, setConfigured] = useState<Record<string, boolean>>({});

	useEffect(() => {
		fetch("/api/admin/ai-keys")
			.then((r) => r.json())
			.then((data) => {
				if (data?.configured) setConfigured(data.configured);
			})
			.catch(() => {});
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

	return (
		<div className="p-6 max-w-2xl">
			<h2 className="text-xl font-semibold mb-4">AI Provider Keys</h2>
			<p className="text-sm text-gray-500 mb-6">Override global AI provider keys for this restaurant. Keys are write-only and never returned.</p>
			<div className="space-y-4">
				{PROVIDERS.map(({ key, label, placeholder }) => (
					<div key={key}>
						<label className="block text-sm font-medium mb-1">
							{label}
							{configured[key] && <span className="ml-2 text-xs text-green-600">(configured)</span>}
							<input
								type="password"
								placeholder={configured[key] ? "***** (overwrite)" : placeholder}
								value={keys[key] || ""}
								onChange={(e) => setKeys((k) => ({ ...k, [key]: e.target.value }))}
								className="mt-1 w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
							/>
						</label>
					</div>
				))}
			</div>
			<button
				onClick={handleSave}
				disabled={saving || Object.values(keys).every((v) => !v)}
				className="mt-6 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50">
				{saving ? "Saving..." : "Save Keys"}
			</button>
		</div>
	);
}
