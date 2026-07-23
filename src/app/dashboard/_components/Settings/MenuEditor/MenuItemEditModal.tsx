"use client";

import { Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { TMenu } from "#utils/database/models/menu";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { currencySymbol } from "#utils/helper/currency";

interface MenuItemEditModalProps {
	item?: TMenu;
	categories: string[];
	currency?: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSaved: () => Promise<void> | void;
}

const inputClass =
	"flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const TAX_SLABS = [0, 5, 12, 18, 28];

export default function MenuItemEditModal({ item, categories, currency = "INR", open, onOpenChange, onSaved }: MenuItemEditModalProps) {
	const isCreate = !item;
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [price, setPrice] = useState("");
	const [taxPercent, setTaxPercent] = useState("5");
	const [category, setCategory] = useState("");
	const [veg, setVeg] = useState("veg");
	const [foodType, setFoodType] = useState("");
	const [image, setImage] = useState("");
	const [saving, setSaving] = useState(false);
	const [uploading, setUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (open) {
			if (item) {
				setName(item.name ?? "");
				setDescription(item.description ?? "");
				setPrice(String(item.price ?? ""));
				setTaxPercent(String(item.taxPercent ?? "5"));
				setCategory(item.category ?? (categories[0] ?? ""));
				setVeg(item.veg ?? "veg");
				setFoodType(item.foodType ?? "");
				setImage(item.image ?? "");
			} else {
				// Reset for create mode
				setName("");
				setDescription("");
				setPrice("");
				setTaxPercent("5");
				setCategory(categories[0] ?? "");
				setVeg("veg");
				setFoodType("");
				setImage("");
			}
		}
	}, [item, open, categories]);

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const priceNum = Number(price);
		const taxNum = Number(taxPercent);
		if (!name.trim()) return toast.error("Name is required");
		if (!Number.isFinite(priceNum) || priceNum <= 0) return toast.error("Enter a valid price");
		if (!Number.isFinite(taxNum) || taxNum < 0 || taxNum > 100) return toast.error("Tax % must be between 0 and 100");
		if (!category) return toast.error("Please pick a category");

		setSaving(true);
		try {
			const payload = {
				...(isCreate ? {} : { itemId: item!._id.toString() }),
				name: name.trim(),
				description: description.trim(),
				price: priceNum,
				taxPercent: taxNum,
				category,
				veg,
				foodType: foodType || undefined,
				image: image.trim(),
			};
			const res = await fetch("/api/admin/menu", {
				method: isCreate ? "POST" : "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data?.message || `Failed to ${isCreate ? "create" : "update"} item`);
			toast.success(isCreate ? "Menu item added" : "Menu item updated");
			await onSaved();
			onOpenChange(false);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : `Failed to ${isCreate ? "create" : "update"} item`);
		} finally {
			setSaving(false);
		}
	};

	const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		// Client-side guard: reject files > 4MB before uploading
		if (file.size > 4 * 1024 * 1024) {
			toast.error("Image too large. Maximum 4MB.");
			if (fileInputRef.current) fileInputRef.current.value = "";
			return;
		}
		setUploading(true);
		try {
			const fd = new FormData();
			fd.append("file", file);
			fd.append("bucket", "menu");
			const res = await fetch("/api/upload", { method: "POST", body: fd });
			const data = await res.json();
			if (!res.ok) throw new Error(data?.message || "Upload failed");
			setImage(data.url);
			toast.success("Image uploaded");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Upload failed — paste a URL instead");
		} finally {
			setUploading(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	};

	const symbol = currencySymbol(currency);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
				<DialogTitle className="text-base font-semibold">{isCreate ? "Add Menu Item" : "Edit Menu Item"}</DialogTitle>
				<DialogDescription className="text-xs">
					{isCreate
						? "Add a new dish to your menu. Customers will see this instantly after you save."
						: "Update the details of this menu item. Changes go live immediately."}
				</DialogDescription>
				<form onSubmit={onSubmit} className="space-y-4">
					<div className="space-y-1.5">
						<Label htmlFor="edit-name">Name</Label>
						<Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required placeholder="e.g. Paneer Butter Masala" />
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="edit-desc">Description</Label>
						<textarea
							id="edit-desc"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							maxLength={500}
							rows={2}
							placeholder="A short, mouth-watering description"
							className={`${inputClass} h-auto py-2 resize-none`}
						/>
						<p className="text-[10px] text-muted-foreground text-right">{description.length}/500</p>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label htmlFor="edit-price">Price ({symbol})</Label>
							<Input id="edit-price" type="number" min="1" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="0.00" />
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="edit-tax">Tax %</Label>
							<div className="flex gap-1.5">
								<Input id="edit-tax" type="number" min="0" max="100" step="0.1" value={taxPercent} onChange={(e) => setTaxPercent(e.target.value)} required className="w-20" />
								<select
									value=""
									onChange={(e) => e.target.value && setTaxPercent(e.target.value)}
									className={`${inputClass} flex-1`}
									aria-label="Quick tax slab">
									<option value="">Slab…</option>
									{TAX_SLABS.map((s) => (
										<option key={s} value={String(s)}>
											{s}%
										</option>
									))}
								</select>
							</div>
						</div>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label htmlFor="edit-category">Category</Label>
							<select
								id="edit-category"
								value={category}
								onChange={(e) => setCategory(e.target.value)}
								className={inputClass}
								required>
								{categories.length === 0 && <option value="">No categories — add in Business</option>}
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
						<Label htmlFor="edit-image">Image</Label>
						<div className="flex gap-2">
							<Input id="edit-image" type="url" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://…" className="flex-1" />
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => fileInputRef.current?.click()}
								loading={uploading}
								title="Upload image (max 4MB)">
								<Upload className="h-4 w-4" />
							</Button>
							<input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onUpload} className="hidden" />
						</div>
						{image ? (
							<img
								src={image}
								alt="Preview"
								className="mt-2 h-20 w-20 object-cover rounded-md border"
								onError={(e) => {
									(e.target as HTMLImageElement).style.display = "none";
								}}
							/>
						) : (
							<p className="mt-1 text-[10px] text-muted-foreground">Square images (800×800) work best. Max 4MB.</p>
						)}
					</div>
					<div className="flex justify-end gap-2 pt-2">
						<Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
							Cancel
						</Button>
						<Button type="submit" loading={saving}>
							{isCreate ? "Add Item" : "Save Changes"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
