"use client";

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { type UIEvent, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useAdmin } from "#components/context/useContext";
import type { TMenu } from "#utils/database/models/menu";
import { cn } from "@/lib/utils";
import MenuEditorItem from "./MenuEditorItem";

export default function MenuEditor() {
	const { profile, menus, profileLoading, profileMutate } = useAdmin();
	const [_modalState, setModalState] = useState("");
	const [_editItem, setEditItem] = useState<TMenu>();
	const [hideSettingsLoading, setHideSettingsLoading] = useState<string[]>([]);
	const [category, setCategory] = useState(0);
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
		const req = await fetch("/api/admin/menu/hidden", {
			method: "POST",
			body: JSON.stringify({ itemId, hidden }),
		});
		const res = await req.json();
		if (res?.status !== 200) toast.error(res?.message);
		await profileMutate();
		setHideSettingsLoading((prev) => prev.filter((id) => id !== itemId));
	};

	const onEdit = (item: TMenu) => {
		setEditItem(item);
		setModalState("menuItemEditState");
	};

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
			<div className="relative">
				<div className="flex items-center justify-between mb-3">
					<h2 className="text-base font-semibold">Menu Categories</h2>
				</div>
				<div className="relative">
					<div ref={categoriesRef} onScroll={onCategoryScroll} className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
						{profile?.categories?.map((item, i) => (
							<button
								key={i}
								onClick={() => setCategory(i)}
								className={cn(
									"shrink-0 px-4 py-2 rounded-md text-sm font-medium transition-colors",
									category === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
								)}>
								{item}
							</button>
						))}
						<div className="shrink-0 w-4" />
					</div>
					{leftCategoryScroll && (
						<button
							onClick={categoryScrollLeft}
							className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full bg-background border shadow-sm">
							<ChevronLeft className="h-4 w-4" />
						</button>
					)}
					{rightCategoryScroll && (
						<button
							onClick={categoryScrollRight}
							className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full bg-background border shadow-sm">
							<ChevronRight className="h-4 w-4" />
						</button>
					)}
				</div>
			</div>

			<div>
				<div className="flex items-center justify-between mb-3">
					<h2 className="text-base font-semibold">Menu Items</h2>
				</div>
				<div className="space-y-2">
					{menus.map((item, id) => (
						<MenuEditorItem key={id} item={item} onEdit={onEdit} onHide={onHide} hideSettingsLoading={hideSettingsLoading.includes(item._id.toString())} />
					))}
				</div>
			</div>
		</div>
	);
}
