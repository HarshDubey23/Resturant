"use client";

import { ChevronLeft, ChevronRight, Loader2, Plus, UtensilsCrossed } from "lucide-react";
import { type UIEvent, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "#components/context/useContext";
import type { TMenu } from "#utils/database/models/menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import MenuEditorItem from "./MenuEditorItem";
import MenuItemEditModal from "./MenuItemEditModal";

const ALL_ITEMS = "__all__";

export default function MenuEditor() {
	const { profile, menus, profileLoading, profileMutate } = useAdmin();
	const [modalOpen, setModalOpen] = useState(false);
	const [editItem, setEditItem] = useState<TMenu | undefined>(undefined);
	const [hideSettingsLoading, setHideSettingsLoading] = useState<string[]>([]);
	const [category, setCategory] = useState<string>(ALL_ITEMS);
	const [search, setSearch] = useState("");
	const categoriesRef = useRef<HTMLDivElement>(null);
	const [leftCategoryScroll, setLeftCategoryScroll] = useState(false);
	const [rightCategoryScroll, setRightCategoryScroll] = useState(true);

	const onCategoryScroll = (event: UIEvent<HTMLDivElement>) => {
		const target = event.target as HTMLDivElement;
		if (target.scrollLeft > 50) setLeftCategoryScroll(true);
		else setLeftCategoryScroll(false);
		if (Math.round(target.scrollWidth - target.scrollLeft) - 50 > target.clientWidth) setRightCategoryScroll(true);
		else setRightCategoryScroll(false);
	};

	const categoryScrollLeft = () => {
		if (categoriesRef.current) categoriesRef.current.scrollLeft -= 400;
	};
	const categoryScrollRight = () => {
		if (categoriesRef.current) categoriesRef.current.scrollLeft += 400;
	};

	const onHide = async (itemId: string, hidden: boolean) => {
		setHideSettingsLoading((v) => [...v, itemId]);
		try {
			const req = await fetch("/api/admin/menu/hidden", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ itemId, hidden }),
			});
			const res = await req.json();
			if (res?.status !== 200) toast.error(res?.message);
			await profileMutate();
		} catch {
			toast.error("Failed to update item visibility");
		} finally {
			setHideSettingsLoading((prev) => prev.filter((id) => id !== itemId));
		}
	};

	const onEdit = (item: TMenu) => {
		setEditItem(item);
		setModalOpen(true);
	};

	const onAddNew = () => {
		setEditItem(undefined);
		setModalOpen(true);
	};

	// Filter menus by selected category and search query — previously this state was dead.
	const filteredMenus = useMemo(() => {
		const q = search.trim().toLowerCase();
		return menus.filter((item) => {
			const matchesCategory = category === ALL_ITEMS || item.category === category;
			const matchesSearch = !q || item.name?.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q);
			return matchesCategory && matchesSearch;
		});
	}, [menus, category, search]);

	const categories = profile?.categories ?? [];

	if (profileLoading) {
		return (
			<div className="flex items-center justify-center py-16">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
				<span className="ml-2 text-sm text-muted-foreground">Loading Menu...</span>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Categories row + Add button */}
			<div className="relative">
				<div className="flex items-center justify-between mb-3 gap-3">
					<h2 className="text-base font-semibold">Categories</h2>
					<div className="flex items-center gap-2">
						<input
							type="search"
							placeholder="Search items..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="h-9 w-44 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						/>
						<Button size="sm" onClick={onAddNew}>
							<Plus className="h-4 w-4 mr-1" />
							Add Item
						</Button>
					</div>
				</div>
				<div className="relative">
					<div ref={categoriesRef} onScroll={onCategoryScroll} className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
						<button
							onClick={() => setCategory(ALL_ITEMS)}
							aria-pressed={category === ALL_ITEMS}
							className={cn(
								"shrink-0 px-4 py-2 rounded-md text-sm font-medium transition-colors",
								category === ALL_ITEMS ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
							)}>
							All
							<span className="ml-1.5 text-[10px] opacity-70">{menus.length}</span>
						</button>
						{categories.map((item, i) => {
							const count = menus.filter((m) => m.category === item).length;
							return (
								<button
									key={`${item}-${i}`}
									onClick={() => setCategory(item)}
									aria-pressed={category === item}
									className={cn(
										"shrink-0 px-4 py-2 rounded-md text-sm font-medium transition-colors",
										category === item ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
									)}>
									{item.charAt(0).toUpperCase() + item.slice(1)}
									<span className="ml-1.5 text-[10px] opacity-70">{count}</span>
								</button>
							);
						})}
						<div className="shrink-0 w-4" />
					</div>
					{leftCategoryScroll && (
						<button
							onClick={categoryScrollLeft}
							aria-label="Scroll categories left"
							className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full bg-background border shadow-sm">
							<ChevronLeft className="h-4 w-4" />
						</button>
					)}
					{rightCategoryScroll && (
						<button
							onClick={categoryScrollRight}
							aria-label="Scroll categories right"
							className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full bg-background border shadow-sm">
							<ChevronRight className="h-4 w-4" />
						</button>
					)}
				</div>
			</div>

			{/* Items list */}
			<div>
				<div className="flex items-center justify-between mb-3">
					<h2 className="text-base font-semibold">
						Menu Items
						<span className="ml-2 text-xs font-normal text-muted-foreground">
							{filteredMenus.length} of {menus.length}
						</span>
					</h2>
				</div>

				{categories.length === 0 ? (
					<div className="flex flex-col items-center justify-center gap-3 py-16 text-center border border-dashed rounded-lg">
						<UtensilsCrossed className="h-10 w-10 text-muted-foreground/40" />
						<div className="space-y-1">
							<p className="text-sm font-medium">No categories yet</p>
							<p className="text-xs text-muted-foreground">Add categories in Business Settings to organize your menu.</p>
						</div>
					</div>
				) : filteredMenus.length === 0 ? (
					<div className="flex flex-col items-center justify-center gap-3 py-16 text-center border border-dashed rounded-lg">
						<UtensilsCrossed className="h-10 w-10 text-muted-foreground/40" />
						<div className="space-y-1">
							<p className="text-sm font-medium">{search ? "No items match your search" : "No items in this category"}</p>
							<p className="text-xs text-muted-foreground">{search ? "Try a different keyword." : "Add your first item to get started."}</p>
						</div>
						{!search && (
							<Button size="sm" variant="outline" onClick={onAddNew}>
								<Plus className="h-4 w-4 mr-1" />
								Add Menu Item
							</Button>
						)}
					</div>
				) : (
					<div className="space-y-2">
						{filteredMenus.map((item) => (
							<MenuEditorItem
								key={item._id.toString()}
								item={item}
								onEdit={onEdit}
								onHide={onHide}
								hideSettingsLoading={hideSettingsLoading.includes(item._id.toString())}
							/>
						))}
					</div>
				)}
			</div>

			<MenuItemEditModal
				item={editItem}
				categories={categories}
				currency={profile?.currency ?? "INR"}
				open={modalOpen}
				onOpenChange={setModalOpen}
				onSaved={profileMutate}
			/>
		</div>
	);
}
