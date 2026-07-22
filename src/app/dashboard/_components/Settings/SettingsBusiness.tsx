"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "#components/context/useContext";
import { SUPPORTED_CURRENCIES } from "#utils/helper/currency";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export default function SettingsBusiness() {
	const { profile, profileMutate } = useAdmin();
	const [saving, setSaving] = useState(false);

	const [gstInclusive, setGstInclusive] = useState(false);
	const [gstNumber, setGstNumber] = useState("");
	const [upiId, setUpiId] = useState("");
	const [currency, setCurrency] = useState("INR");
	const [phone, setPhone] = useState("");
	const [address, setAddress] = useState("");

	useEffect(() => {
		if (profile) {
			setGstInclusive(profile.gstInclusive ?? false);
			setGstNumber(profile.gstNumber ?? "");
			setUpiId(profile.upiId ?? "");
			setCurrency(profile.currency ?? "INR");
			setPhone(profile.phone ?? "");
			setAddress(profile.address ?? "");
		}
	}, [profile]);

	const handleSave = async () => {
		setSaving(true);
		try {
			const res = await fetch("/api/admin", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					gstInclusive,
					gstNumber,
					upiId,
					currency,
					phone,
					address,
				}),
			});
			if (!res.ok) throw new Error("Failed to save");
			toast.success("Business settings saved");
			await profileMutate();
		} catch {
			toast.error("Failed to save business settings");
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="max-w-lg mx-auto space-y-6">
			<Card>
				<CardContent className="p-4 space-y-4">
					<h3 className="text-sm font-semibold">Business Details</h3>

					<div className="space-y-2">
						<Label htmlFor="phone" className="text-xs">
							Phone
						</Label>
						<Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Restaurant phone number" />
					</div>

					<div className="space-y-2">
						<Label htmlFor="address" className="text-xs">
							Address
						</Label>
						<Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Restaurant address" />
					</div>

					<Separator />

					<h3 className="text-sm font-semibold">Tax & Payments</h3>

					<div className="flex items-center justify-between">
						<div>
							<Label className="text-xs">GST Inclusive Pricing</Label>
							<p className="text-[10px] text-muted-foreground">Prices shown to customers include GST</p>
						</div>
						<Switch checked={gstInclusive} onCheckedChange={setGstInclusive} />
					</div>

					<div className="space-y-2">
						<Label htmlFor="gstNumber" className="text-xs">
							GST Number
						</Label>
						<Input
							id="gstNumber"
							value={gstNumber}
							onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
							placeholder="22AAAAA0000A1Z5"
							maxLength={15}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="upiId" className="text-xs">
							UPI ID
						</Label>
						<Input id="upiId" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="restaurant@upi" />
					</div>

					<div className="space-y-2">
						<Label htmlFor="currency" className="text-xs">
							Currency
						</Label>
						<Select value={currency} onValueChange={(v) => v && setCurrency(v)}>
							<SelectTrigger id="currency">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{SUPPORTED_CURRENCIES.map((c) => (
									<SelectItem key={c} value={c}>
										{c}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<Button onClick={handleSave} loading={saving} className="w-full">
						Save Settings
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
