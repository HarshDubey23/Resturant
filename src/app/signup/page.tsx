"use client";

import { useState } from "react";
import { Button } from "xtreme-ui";

export default function SignupPage() {
	const [form, setForm] = useState({ email: "", password: "", restaurantName: "", restaurantID: "" });
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const res = await fetch("/api/auth/signup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(form),
			});

			const data = await res.json();

			if (!res.ok) {
				setError(data.message);
				return;
			}

			window.location.href = `/setup?restaurant=${data.restaurantID}`;
		} catch {
			setError("Something went wrong. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
			<div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-gray-900">Get Started</h1>
					<p className="text-gray-500 mt-2">Create your restaurant account</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-5">
					<div>
						<label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
							Email
						</label>
						<input
							id="email"
							type="email"
							required
							value={form.email}
							onChange={(e) => setForm({ ...form, email: e.target.value })}
							className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
							placeholder="you@example.com"
						/>
					</div>

					<div>
						<label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
							Password
						</label>
						<input
							id="password"
							type="password"
							required
							minLength={6}
							value={form.password}
							onChange={(e) => setForm({ ...form, password: e.target.value })}
							className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
							placeholder="At least 6 characters"
						/>
					</div>

					<div>
						<label htmlFor="restaurantName" className="block text-sm font-medium text-gray-700 mb-1">
							Restaurant Name
						</label>
						<input
							id="restaurantName"
							type="text"
							required
							value={form.restaurantName}
							onChange={(e) => setForm({ ...form, restaurantName: e.target.value })}
							className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
							placeholder="My Restaurant"
						/>
					</div>

					<div>
						<label htmlFor="restaurantID" className="block text-sm font-medium text-gray-700 mb-1">
							Restaurant URL
						</label>
						<div className="flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent">
							<span className="px-3 text-gray-500 text-sm whitespace-nowrap">orderworder.com/</span>
							<input
								id="restaurantID"
								type="text"
								required
								value={form.restaurantID}
								onChange={(e) => setForm({ ...form, restaurantID: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
								className="w-full px-3 py-2.5 border-l border-gray-300 focus:outline-none rounded-r-lg"
								placeholder="my-restaurant"
							/>
						</div>
						<p className="text-xs text-gray-400 mt-1">Lowercase letters, numbers, and hyphens only</p>
					</div>

					{error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}

					<Button type="submit" loading={loading} className="w-full">
						Create Account
					</Button>
				</form>

				<p className="text-center text-sm text-gray-500 mt-6">
					Already have an account?{" "}
					<a href="/dashboard" className="text-purple-600 font-medium hover:underline">
						Sign in
					</a>
				</p>
			</div>
		</div>
	);
}
