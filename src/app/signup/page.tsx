"use client";

import { ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { useState } from "react";

export default function SignupPage() {
	const [form, setForm] = useState({ email: "", password: "", restaurantName: "", restaurantID: "" });
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

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
		<div className="min-h-screen flex">
			{/* Left side - Visual */}
			<div className="hidden lg:flex lg:w-1/2 relative bg-mesh">
				<div className="absolute inset-0 flex flex-col items-center justify-center p-12">
					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center max-w-md">
						<div className="relative w-full max-w-sm mx-auto mb-10">
							<div className="aspect-square rounded-3xl overflow-hidden shadow-2xl glow-primary">
								<Image src="/food-images/hero-restaurant.png" alt="Restaurant dining experience" fill className="object-cover" priority />
							</div>
						</div>
						<h2 className="text-3xl font-black text-foreground mb-3">
							Join the <span className="text-gradient">revolution</span>
						</h2>
						<p className="text-muted-foreground leading-relaxed">500+ restaurants already use OrderWorder to serve customers faster and smarter.</p>

						<div className="mt-8 flex items-center justify-center gap-4">
							{[
								{ num: "500+", label: "Restaurants" },
								{ num: "50K+", label: "Orders/day" },
								{ num: "4.9", label: "Rating" },
							].map((stat) => (
								<div key={stat.label} className="text-center">
									<div className="text-2xl font-black text-primary">{stat.num}</div>
									<div className="text-xs text-muted-foreground">{stat.label}</div>
								</div>
							))}
						</div>
					</motion.div>
				</div>
			</div>

			{/* Right side - Form */}
			<div className="flex-1 flex items-center justify-center p-6 sm:p-8">
				<motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="w-full max-w-md">
					<div className="flex items-center gap-2 mb-8">
						<div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
							<Sparkles className="h-5 w-5 text-primary" />
						</div>
						<span className="text-xl font-bold tracking-tight text-foreground">
							Order<span className="text-primary">Worder</span>
						</span>
					</div>

					<h1 className="text-3xl font-black text-foreground mb-2">Create your account</h1>
					<p className="text-muted-foreground mb-8">Set up your restaurant in minutes. No credit card required.</p>

					<form onSubmit={handleSubmit} className="space-y-5">
						<div>
							<label htmlFor="email" className="block text-sm font-semibold text-foreground mb-2">
								Email
							</label>
							<input
								id="email"
								type="email"
								required
								value={form.email}
								onChange={(e) => setForm({ ...form, email: e.target.value })}
								className="w-full px-4 py-3 border border-border rounded-xl bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
								placeholder="you@example.com"
							/>
						</div>

						<div>
							<label htmlFor="password" className="block text-sm font-semibold text-foreground mb-2">
								Password
							</label>
							<div className="relative">
								<input
									id="password"
									type={showPassword ? "text" : "password"}
									required
									minLength={6}
									value={form.password}
									onChange={(e) => setForm({ ...form, password: e.target.value })}
									className="w-full px-4 py-3 border border-border rounded-xl bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all pr-12"
									placeholder="At least 6 characters"
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
									{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
								</button>
							</div>
						</div>

						<div>
							<label htmlFor="restaurantName" className="block text-sm font-semibold text-foreground mb-2">
								Restaurant Name
							</label>
							<input
								id="restaurantName"
								type="text"
								required
								value={form.restaurantName}
								onChange={(e) => setForm({ ...form, restaurantName: e.target.value })}
								className="w-full px-4 py-3 border border-border rounded-xl bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
								placeholder="My Restaurant"
							/>
						</div>

						<div>
							<label htmlFor="restaurantID" className="block text-sm font-semibold text-foreground mb-2">
								Restaurant URL
							</label>
							<div className="flex items-center border border-border rounded-xl bg-card focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary transition-all overflow-hidden">
								<span className="px-4 py-3 text-muted-foreground text-sm whitespace-nowrap bg-muted/50 border-r border-border">orderworder.com/</span>
								<input
									id="restaurantID"
									type="text"
									required
									value={form.restaurantID}
									onChange={(e) => setForm({ ...form, restaurantID: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
									className="w-full px-4 py-3 bg-card focus:outline-none"
									placeholder="my-restaurant"
								/>
							</div>
							<p className="text-xs text-muted-foreground mt-1.5">Lowercase letters, numbers, and hyphens only</p>
						</div>

						{error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-xl font-medium">{error}</div>}

						<button
							type="submit"
							disabled={loading}
							className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold text-base hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/25">
							{loading ? "Creating..." : "Create Account"}
							{!loading && <ArrowRight className="h-4 w-4" />}
						</button>
					</form>

					<p className="text-center text-sm text-muted-foreground mt-6">
						Already have an account?{" "}
						<a href="/dashboard" className="text-primary font-semibold hover:underline">
							Sign in
						</a>
					</p>
				</motion.div>
			</div>
		</div>
	);
}
