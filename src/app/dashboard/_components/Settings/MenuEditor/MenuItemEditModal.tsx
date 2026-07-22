"use client";

import { Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { TMenu } from "#utils/database/models/menu";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MenuItemEditModalProps {
	item?: TMenu;
	categories: string[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSaved: () => Promise<void> | void;
}

const inputClass =
	"flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function MenuItemEditModal({ item, categories, open, onOpenChange, onSaved }: MenuItemEditModalProps) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [price, setPrice] = useState("");
	const [taxPercent, setTaxPercent] = useState("");
	const [category, setCategory] = useState("");
	const [veg, setVeg] = useState("veg");
	const [foodType, setFoodType] = useState("");
	const [image, setImage] = useState("");
	const [saving, setSaving] = useState(false);
	const [uploading, setUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (item && open) {
			setName(item.name ?? "");
			setDescription(item.description ?? "");
			setPrice(String(item.price ?? ""));
			setTaxPercent(String(item.taxPercent ?? ""));
			setCategory(item.category ?? "");
			setVeg(item.veg ?? "veg");
			setFoodType(item.foodType ?? "");
			setImage(item.image ?? "");
		}
	}, [item, open]);

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!item) return;
		const priceNum = Number(price);
		const taxNum = Number(taxPercent);
		if (!name.trim()) return toast.error("Name is required");
		if (!Number.isFinite(priceNum) || priceNum <= 0) return toast.error("Enter a valid price");
		if (!Number.isFinite(taxNum) || taxNum < 0 || taxNum > 100) return toast.error("Tax % must be between 0 and 100");

		setSaving(true);
		try {
			const res = await fetch("/api/admin/menu", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					itemId: item._id.toString(),
					name: name.trim(),
					description: description.trim(),
					price: priceNum,
					taxPercent: taxNum,
					category: category || undefined,
					veg,
					foodType: foodType || undefined,
					image: image.trim(),
				}),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data?.message || "Failed to update item");
			toast.success("Menu item updated");
			await onSaved();
			onOpenChange(false);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to update item");
		} finally {
			setSaving(false);
		}
	};

	const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setUploading(true);
		try {
			const fd = new FormData();
			fd.append("file", file);
			fd.append("bucket", "menu");
			const res = await fetch("/api/upload", { method: "POST", body: fd });
			const data = await res.json();
			if (!res.ok) throw new Error(data?.message || "Upload failed");
			setImage(data.url);
			toast.success("Image uploaded to R2");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Upload failed — falling back to URL field");
		} finally {
			setUploading(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
				<DialogTitle className="text-base font-semibold">Edit Menu Item</DialogTitle>
				<form onSubmit={onSubmit} className="space-y-4">
					<div className="space-y-1.5">
						<Label htmlFor="edit-name">Name</Label>
						<Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required />
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="edit-desc">Description</Label>
						<textarea
							id="edit-desc"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							maxLength={500}
							rows={2}
							className={`${inputClass} h-auto py-2 resize-none`}
						/>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label htmlFor="edit-price">Price</Label>
							<Input id="edit-price" type="number" min="1" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="edit-tax">Tax %</Label>
							<Input id="edit-tax" type="number" min="0" max="100" step="0.1" value={taxPercent} onChange={(e) => setTaxPercent(e.target.value)} required />
						</div>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label htmlFor="edit-category">Category</Label>
							<select id="edit-category" value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
								{categories.map((c) => (
									<option key={c} value={c}>
										{c.charAt(0).toUpperCase() + c.slice(1)}
									</option>
								))}
							</select>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="edit-veg">Type</Label>
							<select id="edit-veg" value={veg} onChange={(e) => setVeg(e.target.value)} className={inputClass}>
								<option value="veg">Veg</option>
								<option value="non-veg">Non-Veg</option>
								<option value="contains-egg">Contains Egg</option>
							</select>
						</div>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="edit-foodtype">Taste Profile</Label>
						<select id="edit-foodtype" value={foodType} onChange={(e) => setFoodType(e.target.value)} className={inputClass}>
							<option value="">None</option>
							<option value="spicy">Spicy</option>
							<option value="extra-spicy">Extra Spicy</option>
							<option value="sweet">Sweet</option>
						</select>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="edit-image">Image URL</Label>
						<div className="flex gap-2">
							<Input id="edit-image" type="url" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://…" className="flex-1" />
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => fileInputRef.current?.click()}
								loading={uploading}
								title="Upload image to Cloudflare R2">
								<Upload className="h-4 w-4" />
							</Button>
							<input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onUpload} className="hidden" />
						</div>
						{image && (
							<div
								role="img"
								aria-label="Preview"
								style={{ backgroundImage: `url(${image})` }}
								className="mt-2 h-20 w-20 bg-cover bg-center rounded-md border"
							/>
						)}
					</div>
					<div className="flex justify-end gap-2 pt-2">
						<Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
							Cancel
						</Button>
						<Button type="submit" loading={saving}>
							Save Changes
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
