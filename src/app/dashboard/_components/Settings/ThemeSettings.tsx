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

function hslToHex(h: number, s: number, l: number): string {
	s /= 100;
	l /= 100;
	const a = s * Math.min(l, 1 - l);
	const f = (n: number) => {
		const k = (n + h / 30) % 12;
		const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
		return Math.round(255 * color).toString(16).padStart(2, "0");
	};
	return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
	const r = parseInt(hex.slice(1, 3), 16) / 255;
	const g = parseInt(hex.slice(3, 5), 16) / 255;
	const b = parseInt(hex.slice(5, 7), 16) / 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;
	let h = 0;
	let s = 0;
	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
		}
		h *= 60;
	}
	return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export default function ThemeSettings() {
	const { profile, profileMutate } = useAdmin();
	const initialColor = (() => {
		const c = profile?.themeColor;
		if (!c) return PRESET_COLORS[0].value;
		if (typeof c === "object") {
			const hsl = c as { h: number; s: number; l: number };
			return hslToHex(hsl.h, hsl.s, hsl.l);
		}
		return c as string;
	})();
	const [themeColor, setThemeColor] = useState<string>(initialColor);
	const [loading, setLoading] = useState(false);
	const [_customColor, setCustomColor] = useState("");

	const currentColorStr = (() => {
		const c = profile?.themeColor;
		if (!c) return PRESET_COLORS[0].value;
		if (typeof c === "object") {
			const hsl = c as { h: number; s: number; l: number };
			return hslToHex(hsl.h, hsl.s, hsl.l);
		}
		return c as string;
	})();
	const hasChanged = themeColor !== currentColorStr;

	const onClear = () => {
		setThemeColor(currentColorStr);
		setCustomColor("");
	};

	const onSave = async () => {
		setLoading(true);
		const hsl = hexToHsl(themeColor);
		const req = await fetch("/api/admin/theme", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ themeColor: hsl }),
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
