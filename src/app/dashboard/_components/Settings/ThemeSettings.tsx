"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { useAdmin } from "#components/context/useContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
	{ name: "Default Blue", value: "#3b82f6" },
	{ name: "Terracotta", value: "#c2664a" },
	{ name: "Emerald", value: "#10b981" },
	{ name: "Amber", value: "#f59e0b" },
	{ name: "Rose", value: "#f43f5e" },
	{ name: "Violet", value: "#8b5cf6" },
	{ name: "Cyan", value: "#06b6d4" },
	{ name: "Slate", value: "#64748b" },
];

export default function ThemeSettings() {
	const { profile, profileMutate } = useAdmin();
	const [themeColor, setThemeColor] = useState<string>((profile?.themeColor as unknown as string) ?? PRESET_COLORS[0].value);
	const [loading, setLoading] = useState(false);
	const [customColor, setCustomColor] = useState("");

	const hasChanged = themeColor !== (profile?.themeColor as unknown as string);

	const onClear = () => {
		if (profile?.themeColor) setThemeColor(profile.themeColor as unknown as string);
		setCustomColor("");
	};

	const onSave = async () => {
		setLoading(true);
		const req = await fetch("/api/admin/theme", {
			method: "POST",
			body: JSON.stringify({ themeColor }),
		});
		const res = await req.json();
		if (res?.status !== 200) toast.error(res?.message);
		await profileMutate();
		setLoading(false);
	};

	const handleCustomColor = (e: React.ChangeEvent<HTMLInputElement>) => {
		setCustomColor(e.target.value);
		setThemeColor(e.target.value);
	};

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="text-base">
					Theme <span className="text-muted-foreground">Color</span>
				</CardTitle>
				{hasChanged && (
					<div className="flex items-center gap-2">
						<Button variant="outline" size="sm" disabled={loading} onClick={onClear}>
							Clear
						</Button>
						<Button size="sm" loading={loading} onClick={onSave}>
							Apply
						</Button>
					</div>
				)}
			</CardHeader>
			<CardContent>
				<div className="flex flex-wrap gap-3">
					{PRESET_COLORS.map((c) => (
						<button
							key={c.value}
							type="button"
							title={c.name}
							onClick={() => {
								setThemeColor(c.value);
								setCustomColor("");
							}}
							className={cn(
								"h-8 w-8 rounded-full border-2 transition-all",
								themeColor === c.value ? "border-foreground scale-110" : "border-transparent hover:scale-110",
							)}
							style={{ backgroundColor: c.value }}
						/>
					))}
					<div className="relative">
						<input
							type="color"
							value={themeColor}
							onChange={handleCustomColor}
							className="h-8 w-8 cursor-pointer rounded-full border-0 p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full"
						/>
					</div>
				</div>
				<p className="text-xs text-muted-foreground mt-3">
					Current: <span className="font-mono">{themeColor}</span>
				</p>
			</CardContent>
		</Card>
	);
}
