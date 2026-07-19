"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type Table = { name: string; qr: string };

export default function SetupPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const restaurant = searchParams.get("restaurant");

	const [step, setStep] = useState<"tables" | "menu" | "qr">("tables");
	const [tableCount, setTableCount] = useState(5);
	const [tables, setTables] = useState<Table[]>([]);
	const [menuItems, setMenuItems] = useState<{ name: string; price: string; category: string; image?: string }[]>([]);
	const [menuName, setMenuName] = useState("");
	const [menuPrice, setMenuPrice] = useState("");
	const [menuCategory, setMenuCategory] = useState("");
	const [menuImage, setMenuImage] = useState("");
	const [menuImagePreview, setMenuImagePreview] = useState("");
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

	const handleMenuImage = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				setMenuImage(reader.result as string);
				setMenuImagePreview(reader.result as string);
			};
			reader.readAsDataURL(file);
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
					image: menuImage || undefined,
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				setError(data.message);
				return;
			}

			setMenuItems([...menuItems, { name: menuName, price: menuPrice, category: menuCategory || "main", image: menuImage || undefined }]);
			setMenuName("");
			setMenuPrice("");
			setMenuCategory("");
			setMenuImage("");
			setMenuImagePreview("");
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
			<style>{`
				@media print {
					body { visibility: hidden; }
					.qr-print-area { visibility: visible; position: fixed; inset: 20px; }
					.qr-print-area * { visibility: visible; }
					.no-print { display: none !important; }
				}
			`}</style>
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
						<p className="text-gray-500 mb-4">How many tables does your restaurant have?</p>

						<div className="flex items-center gap-4 mb-6">
							<input
								type="number"
								min={1}
								value={tableCount}
								onChange={(e) => setTableCount(Number.parseInt(e.target.value, 10) || 1)}
								className="w-24 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
							/>
							<button
								onClick={generateTables}
								disabled={loading}
								className="px-6 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50">
								{loading ? "Creating..." : "Create Tables"}
							</button>
						</div>

						{error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}

						{tables.length > 0 && (
							<div className="mt-4 p-4 bg-green-50 rounded-lg">
								<p className="text-green-700 font-medium">{tables.length} tables created successfully!</p>
								<button
									className="mt-3 px-6 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
									onClick={() => setStep("menu")}>
									Next: Add Menu Items
								</button>
							</div>
						)}

						<div className="mt-4 text-center">
							<button onClick={() => setStep("menu")} className="text-sm text-purple-600 hover:underline">
								Skip this step
							</button>
						</div>
					</div>
				)}

				{/* Step 2: Menu */}
				{step === "menu" && (
					<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
						<h2 className="text-xl font-semibold mb-4">Add Menu Items</h2>
						<p className="text-gray-500 mb-4">Add your menu items. You can add photos and skip to finish later.</p>

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
							<div>
								<label htmlFor="menu-photo" className="block text-sm text-gray-500 mb-1">
									Photo (optional)
								</label>
								<input
									id="menu-photo"
									type="file"
									accept="image/*"
									onChange={handleMenuImage}
									className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
								/>
								{menuImagePreview && (
									// biome-ignore lint/performance/noImgElement: dynamic blob URL from file upload
									<img src={menuImagePreview} alt="Preview" className="mt-2 w-20 h-20 object-cover rounded-lg border" />
								)}
							</div>
							<button
								onClick={addMenuItem}
								disabled={loading}
								className="w-full px-4 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50">
								{loading ? "Adding..." : "Add Item"}
							</button>
						</div>

						{menuItems.length > 0 && (
							<div className="mt-4">
								<h3 className="font-medium text-gray-700 mb-2">Added Items ({menuItems.length})</h3>
								<div className="space-y-2 max-h-48 overflow-y-auto">
									{menuItems.map((item, i) => (
										<div key={i} className="flex items-center gap-3 bg-gray-50 p-2 rounded text-sm">
											{item.image && (
												// biome-ignore lint/performance/noImgElement: dynamic preview image
												<img src={item.image} alt="" className="w-10 h-10 object-cover rounded" />
											)}
											<span className="flex-1">{item.name}</span>
											<span className="text-gray-500">
												${item.price} — {item.category}
											</span>
										</div>
									))}
								</div>
							</div>
						)}

						<div className="mt-4 flex gap-3">
							<button
								onClick={() => setStep("qr")}
								className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition">
								{menuItems.length > 0 ? "Next: Generate QR Codes" : "Skip to QR Codes"}
							</button>
						</div>
					</div>
				)}

				{/* Step 3: QR Codes */}
				{step === "qr" && (
					<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
						<h2 className="text-xl font-semibold mb-4">Your QR Codes</h2>
						<p className="text-gray-500 mb-4">Print these QR codes and place them on each table for customers to scan.</p>

						<div className="qr-print-area">
							<div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
								{tables.map((table) => (
									<div key={table.name} className="border rounded-lg p-4 text-center">
										{/* biome-ignore lint/performance/noImgElement: QR code from API response */}
										<img src={table.qr} alt={`Table ${table.name}`} className="w-full aspect-square mx-auto mb-2" />
										<p className="text-sm font-medium text-gray-700">Table {table.name}</p>
									</div>
								))}
							</div>
						</div>

						<div className="no-print flex gap-3">
							<button
								onClick={() => window.print()}
								className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition">
								Print QR Sheet
							</button>
							<button
								onClick={() => router.push("/dashboard")}
								className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition">
								Go to Dashboard
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
