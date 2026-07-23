"use client";

import { AlertTriangle, CheckCircle2, Copy, Globe } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const CNAME_TARGET = "app.orderworder.com";
const TXT_RECORD_NAME = "_orderworder-verify";
const TXT_PLACEHOLDER = "ow_verify_XXXXXX";

export default function SettingsDomain() {
	const [customDomain, setCustomDomain] = useState("");
	const [copied, setCopied] = useState<string | null>(null);

	const copyToClipboard = (text: string, label: string) => {
		navigator.clipboard.writeText(text);
		setCopied(label);
		setTimeout(() => setCopied(null), 2000);
	};

	return (
		<div className="space-y-6">
			{/* Enterprise banner */}
			<Card className="border-violet-200 bg-violet-50">
				<CardHeader className="pb-3">
					<div className="flex items-center gap-3">
						<Globe className="h-5 w-5 text-violet-600" />
						<CardTitle className="text-base">Custom Domain</CardTitle>
						<Badge className="bg-violet-600 text-white hover:bg-violet-700">Enterprise</Badge>
					</div>
					<CardDescription>
						Map your own domain (e.g. menu.myrestaurant.com) to your OrderWorder storefront. Full SSL automation and provisioning will be available after
						launch.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-2 p-3 rounded-lg bg-violet-100 text-violet-800 text-sm">
						<AlertTriangle className="h-4 w-4 shrink-0" />
						<span>Custom domains require an Enterprise plan. Automatic SSL certificate provisioning is coming soon.</span>
					</div>
				</CardContent>
			</Card>

			{/* Domain input form */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-sm font-semibold">Configure Custom Domain</CardTitle>
					<CardDescription>Enter the domain you want to map to your restaurant storefront.</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col gap-4">
						<div className="flex items-center gap-3">
							<Input placeholder="menu.myrestaurant.com" value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} className="flex-1" />
							<Button variant="outline" disabled={!customDomain.trim()}>
								Save Domain
							</Button>
						</div>
						{customDomain.trim() && (
							<p className="text-xs text-slate-500">After saving, you'll need to configure DNS records with your domain provider as shown below.</p>
						)}
					</div>
				</CardContent>
			</Card>

			{/* DNS configuration instructions */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-sm font-semibold">DNS Configuration</CardTitle>
					<CardDescription>Add these records in your domain provider's DNS settings.</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{/* CNAME record */}
						<div className="rounded-lg border p-4 space-y-2">
							<div className="flex items-center justify-between">
								<span className="text-xs font-semibold uppercase text-slate-500">CNAME Record</span>
								<Badge variant="outline" className="text-xs">
									Required
								</Badge>
							</div>
							<Separator />
							<div className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
								<span className="text-slate-500">Host/Name:</span>
								<span className="font-medium">{customDomain.trim() || "menu"}</span>
								<span className="text-slate-500">Value/Target:</span>
								<div className="flex items-center gap-2">
									<code className="bg-slate-100 px-2 py-0.5 rounded text-xs font-mono">{CNAME_TARGET}</code>
									<button
										onClick={() => copyToClipboard(CNAME_TARGET, "cname")}
										className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
										type="button">
										{copied === "cname" ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
										{copied === "cname" ? "Copied" : "Copy"}
									</button>
								</div>
							</div>
						</div>

						{/* TXT verification record */}
						<div className="rounded-lg border p-4 space-y-2">
							<div className="flex items-center justify-between">
								<span className="text-xs font-semibold uppercase text-slate-500">TXT Verification Record</span>
								<Badge variant="outline" className="text-xs">
									Required
								</Badge>
							</div>
							<Separator />
							<div className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
								<span className="text-slate-500">Host/Name:</span>
								<div className="flex items-center gap-2">
									<code className="bg-slate-100 px-2 py-0.5 rounded text-xs font-mono">{TXT_RECORD_NAME}</code>
									<button
										onClick={() => copyToClipboard(TXT_RECORD_NAME, "txt-name")}
										className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
										type="button">
										{copied === "txt-name" ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
										{copied === "txt-name" ? "Copied" : "Copy"}
									</button>
								</div>
								<span className="text-slate-500">Value:</span>
								<div className="flex items-center gap-2">
									<code className="bg-slate-100 px-2 py-0.5 rounded text-xs font-mono">{TXT_PLACEHOLDER}</code>
									<button
										onClick={() => copyToClipboard(TXT_PLACEHOLDER, "txt-value")}
										className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
										type="button">
										{copied === "txt-value" ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
										{copied === "txt-value" ? "Copied" : "Copy"}
									</button>
								</div>
							</div>
							<p className="text-xs text-slate-500 mt-1">The verification token will be generated when you save the domain above.</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
