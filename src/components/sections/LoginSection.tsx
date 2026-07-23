"use client";

import { ArrowRight, Bot, ChevronLeft, KeyRound, LogOut } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, useXTheme } from "xtreme-ui";

import { useAdmin } from "#components/context/useContext";
import { DEFAULT_THEME_COLOR } from "#utils/constants/common";
import type { TProfile } from "#utils/database/models/profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginSection() {
	const { setThemeColor } = useXTheme();
	const router = useRouter();
	const session = useSession();
	const { profile: dashboard } = useAdmin();
	const loggedIn = session.status === "authenticated";

	const [logoutLoading, setLogoutLoading] = useState(false);
	const [profile, setProfile] = useState<TProfile>();
	const [nextLoading, setNextLoading] = useState(false);
	const [email, setEmail] = useState("");
	const [kitchenUsername, setKitchenUsername] = useState("");
	const [showKitchen, setShowKitchen] = useState(false);
	const [password, setPassword] = useState("");

	const onNext = async () => {
		setNextLoading(true);
		if (!profile) {
			const res = await fetch(`/api/baseProfile?email=${email}`);
			const profileData = await res.json();
			if (profileData.status === 404) {
				toast.error("Account does not exist!");
			} else {
				setProfile(profileData);
			}
		} else {
			const res = await signIn("restaurant", {
				redirect: false,
				username: email,
				...(showKitchen && { kitchen: kitchenUsername }),
				password,
				callbackUrl: `${window.location.origin}`,
			});
			if (res?.error) {
				toast.error(res?.error);
				setPassword("");
				return setNextLoading(false);
			}
			if (kitchenUsername) router.push("/kitchen");
			else router.push("/dashboard");
		}
		setNextLoading(false);
	};

	const logout = () => {
		setThemeColor(DEFAULT_THEME_COLOR);
		if (!loggedIn) return setProfile(undefined);
		setLogoutLoading(true);
		router.push("/logout");
	};

	useEffect(() => {
		const newColor = profile?.themeColor ?? dashboard?.themeColor;
		if (newColor) setThemeColor(profile?.themeColor ?? dashboard?.themeColor);
	}, [profile, dashboard, setThemeColor]);

	const name = profile?.name ?? dashboard?.name ?? (session.data?.customer ? `${session.data.customer.fname} ${session.data.customer.lname}` : "");
	const avatarUrl = profile?.avatar ?? dashboard?.avatar ?? session.data?.restaurant?.avatar ?? "";
	const address = profile?.address ?? dashboard?.address ?? session.data?.customer?.phone;

	return (
		<section id="login" className="relative py-28 sm:py-36 bg-slate-50">
			<div className="absolute inset-0 bg-mesh pointer-events-none" />
			<div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				<div className="grid lg:grid-cols-2 gap-16 items-center">
					<motion.div
						initial={{ opacity: 0, x: -30 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true, margin: "-100px" }}
						transition={{ duration: 0.6, ease: "easeOut" }}
						className="hidden lg:flex flex-col items-center justify-center text-center">
						<div className="relative w-72 h-80 rounded-3xl overflow-hidden shadow-2xl glow-primary mb-8">
							<Image
								src="https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&h=800&fit=crop"
								alt="Restaurant kitchen"
								className="w-full h-full object-cover"
								fill
								sizes="288px"
							/>
							<div className="absolute inset-0 bg-gradient-to-t from-violet-600/30 to-transparent" />
							<div className="absolute bottom-6 left-6 right-6">
								<div className="glass rounded-2xl p-4 text-left">
									<p className="text-sm font-semibold text-slate-900">Manage everything</p>
									<p className="text-xs text-slate-500">Orders, menu, analytics — all in one place</p>
								</div>
							</div>
						</div>
						<h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back!</h3>
						<p className="text-slate-500 mt-3 max-w-sm leading-relaxed">Sign in to manage your restaurant, view orders, and access the kitchen display.</p>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, x: 24 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true, margin: "-100px" }}
						transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}>
						<Card className="shadow-soft overflow-hidden">
							<div className="h-1 bg-gradient-to-r from-violet-600 via-violet-500 to-fuchsia-500" />
							<CardHeader className="text-center">
								{profile || loggedIn ? (
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											{avatarUrl && <Avatar src={avatarUrl} size="mini" />}
											<div className="text-left">
												<CardTitle className="text-base">{name || "OrderWorder"}</CardTitle>
												{address && <CardDescription>{address}</CardDescription>}
											</div>
										</div>
										<Button variant="ghost" size="icon" onClick={logout} loading={logoutLoading} aria-label="Sign out">
											<LogOut className="h-4 w-4" />
										</Button>
									</div>
								) : (
									<>
										<CardTitle>Sign in</CardTitle>
										<CardDescription>Enter your credentials to access the dashboard</CardDescription>
									</>
								)}
							</CardHeader>

							<CardContent>
								{!loggedIn ? (
									!profile ? (
										<div className="space-y-4">
											<div className="space-y-2">
												<Label htmlFor="login-email">Email</Label>
												<Input
													id="login-email"
													type="email"
													placeholder="you@restaurant.com"
													value={email}
													onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
													onKeyDown={(e) => e.key === "Enter" && onNext()}
												/>
											</div>
											<Button className="w-full" onClick={onNext} loading={nextLoading}>
												Next
												<ArrowRight className="ml-2 h-4 w-4" />
											</Button>
										</div>
									) : (
										<div className="space-y-4">
											<button
												onClick={() => setProfile(undefined)}
												className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-all duration-200">
												<ChevronLeft className="h-4 w-4" />
												Change email
											</button>

											{showKitchen && (
												<div className="space-y-2">
													<Label htmlFor="kitchen-username">Kitchen username</Label>
													<Input
														id="kitchen-username"
														placeholder="Enter kitchen username"
														value={kitchenUsername}
														onChange={(e: ChangeEvent<HTMLInputElement>) => setKitchenUsername(e.target.value)}
													/>
												</div>
											)}

											<div className="space-y-2">
												<Label htmlFor="login-password">Password</Label>
												<Input
													id="login-password"
													type="password"
													placeholder={`Enter ${showKitchen ? "kitchen" : "admin"} password`}
													value={password}
													onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
													onKeyDown={(e) => e.key === "Enter" && onNext()}
												/>
											</div>

											<Button variant="outline" className="w-full" onClick={() => setShowKitchen((v) => !v)}>
												<Bot className="mr-2 h-4 w-4" />
												{showKitchen ? "Sign in as admin" : "Sign in to kitchen"}
											</Button>

											<Button className="w-full" onClick={onNext} loading={nextLoading}>
												<KeyRound className="mr-2 h-4 w-4" />
												Sign In
											</Button>
										</div>
									)
								) : (
									<div className="space-y-3">
										{session.data?.role === "admin" && (
											<Button className="w-full" onClick={() => router.push("/dashboard")}>
												Open dashboard
											</Button>
										)}
										{(session.data?.role === "admin" || session.data?.role === "kitchen") && (
											<Button variant="outline" className="w-full" onClick={() => router.push("/kitchen")}>
												Open kitchen display
											</Button>
										)}
										{session.data?.role === "customer" && (
											<Button className="w-full" onClick={() => router.push(`/${session.data?.restaurant?.username}`)}>
												Open restaurant menu
											</Button>
										)}
									</div>
								)}
							</CardContent>
						</Card>
					</motion.div>
				</div>
			</div>
		</section>
	);
}
