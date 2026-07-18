"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "xtreme-ui";

type Table = { name: string; qr: string };

export default function SetupPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const restaurant = searchParams.get("restaurant");

	const [step, setStep] = useState<"tables" | "menu" | "qr">("tables");
	const [tableCount, setTableCount] = useState(5);
	const [tables, setTables] = useState<Table[]>([]);
	const [menuItems, setMenuItems] = useState<{ name: string; price: string; category: string }[]>([]);
	const [menuName, setMenuName] = useState("");
	const [menuPrice, setMenuPrice] = useState("");
	const [menuCategory, setMenuCategory] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const generateTables = async () => {
		setLoading(true);
		setError("");

		try {
			const res = await fetch("/api/auth/setup-tables", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ restaurantID: restaurant, count: tableCount }),
			});

			const data = await res.json();

			if (!res.ok) {
				setError(data.message);
				return;
			}

			setTables(data.tables);
		} catch {
			setError("Failed to create tables");
		} finally {
			setLoading(false);
		}
	};

	const addMenuItem = async () => {
		if (!menuName || !menuPrice) return;

		setLoading(true);
		setError("");

		try {
			const res = await fetch("/api/auth/setup-menu", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					restaurantID: restaurant,
					name: menuName,
					price: Number.parseFloat(menuPrice),
					category: menuCategory || "main",
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				setError(data.message);
				return;
			}

			setMenuItems([...menuItems, { name: menuName, price: menuPrice, category: menuCategory || "main" }]);
			setMenuName("");
			setMenuPrice("");
			setMenuCategory("");
		} catch {
			setError("Failed to add menu item");
		} finally {
			setLoading(false);
		}
	};

	if (!restaurant) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<p className="text-gray-500">No restaurant specified. Please sign up first.</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
			<div className="max-w-3xl mx-auto p-6">
				<div className="text-center mb-8 pt-8">
					<h1 className="text-3xl font-bold text-gray-900">Welcome to {restaurant}!</h1>
					<p className="text-gray-500 mt-2">Let's set up your restaurant in a few steps</p>
				</div>

				{/* Step indicator */}
				<div className="flex justify-center gap-2 mb-8">
					{["Tables", "Menu", "QR Codes"].map((s, i) => {
						const steps = ["tables", "menu", "qr"];
						const idx = steps.indexOf(step);
						const isActive = i <= idx;
						return (
							<div key={s} className={`flex items-center gap-2 ${i < 2 ? "after:content-[''] after:w-8 after:h-0.5 after:bg-gray-300" : ""}`}>
								<div
									className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${isActive ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-500"}`}>
									{i + 1}
								</div>
								<span className={`text-sm ${isActive ? "text-purple-600 font-medium" : "text-gray-400"}`}>{["Tables", "Menu", "QR Codes"][i]}</span>
							</div>
						);
					})}
				</div>

				{/* Step 1: Tables */}
				{step === "tables" && (
					<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
						<h2 className="text-xl font-semibold mb-4">Create Tables</h2>
						<p className="text-gray-500 mb-4">How many tables does your restaurant have? (Free plan: up to 5)</p>

						<div className="flex items-center gap-4 mb-6">
							<input
								type="number"
								min={1}
								max={5}
								value={tableCount}
								onChange={(e) => setTableCount(Number.parseInt(e.target.value, 10) || 1)}
								className="w-24 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
							/>
							<Button onClick={generateTables} loading={loading}>
								Create Tables
							</Button>
						</div>

						{error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}

						{tables.length > 0 && (
							<div className="mt-4 p-4 bg-green-50 rounded-lg">
								<p className="text-green-700 font-medium">{tables.length} tables created successfully!</p>
								<Button className="mt-3" onClick={() => setStep("menu")}>
									Next: Add Menu Items
								</Button>
							</div>
						)}
					</div>
				)}

				{/* Step 2: Menu */}
				{step === "menu" && (
					<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
						<h2 className="text-xl font-semibold mb-4">Add Menu Items</h2>
						<p className="text-gray-500 mb-4">Add your first menu items (Free plan: up to 20)</p>

						<div className="space-y-3 mb-4">
							<input
								type="text"
								value={menuName}
								onChange={(e) => setMenuName(e.target.value)}
								placeholder="Item name"
								className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
							/>
							<div className="flex gap-3">
								<input
									type="number"
									step="0.01"
									value={menuPrice}
									onChange={(e) => setMenuPrice(e.target.value)}
									placeholder="Price"
									className="w-1/2 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
								/>
								<input
									type="text"
									value={menuCategory}
									onChange={(e) => setMenuCategory(e.target.value)}
									placeholder="Category (e.g. main)"
									className="w-1/2 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
								/>
							</div>
							<Button onClick={addMenuItem} loading={loading} className="w-full">
								Add Item
							</Button>
						</div>

						{menuItems.length > 0 && (
							<div className="mt-4">
								<h3 className="font-medium text-gray-700 mb-2">Added Items ({menuItems.length})</h3>
								<div className="space-y-2 max-h-48 overflow-y-auto">
									{menuItems.map((item, i) => (
										<div key={i} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
											<span>{item.name}</span>
											<span className="text-gray-500">
												${item.price} — {item.category}
											</span>
										</div>
									))}
								</div>
								<Button className="mt-4" onClick={() => setStep("qr")}>
									Next: Generate QR Codes
								</Button>
							</div>
						)}
					</div>
				)}

				{/* Step 3: QR Codes */}
				{step === "qr" && (
					<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
						<h2 className="text-xl font-semibold mb-4">Your QR Codes</h2>
						<p className="text-gray-500 mb-4">Print these QR codes and place them on each table for customers to scan.</p>

						<div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
							{tables.map((table) => (
								<div key={table.name} className="border rounded-lg p-4 text-center">
									<Image src={table.qr} alt={`Table ${table.name}`} width={200} height={200} className="w-full aspect-square mx-auto mb-2" />
									<p className="text-sm font-medium text-gray-700">Table {table.name}</p>
								</div>
							))}
						</div>

						<div className="flex gap-3">
							<Button onClick={() => window.print()} className="flex-1">
								Print QR Sheet
							</Button>
							<Button onClick={() => router.push("/dashboard")} className="flex-1">
								Go to Dashboard
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
