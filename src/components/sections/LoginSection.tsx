"use client";

import { ArrowRight, Bot, ChevronLeft, Crown, KeyRound, LogOut, Sparkles, Zap } from "lucide-react";
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

// Pre-configured demo accounts — one click to login for live pitches
const DEMO_ACCOUNTS = [
        {
                email: "admin@spiceroute.com",
                password: "spiceroute@demo123",
                name: "The Spice Route",
                tagline: "Indian fine-dining • 360° food viewer",
                emoji: "🍛",
                color: "from-orange-500 to-red-500",
                featured: true,
        },
        {
                email: "admin@brewpoint.com",
                password: "brewpoint@123",
                name: "Brewpoint Café",
                tagline: "Café & bakery • compact menu",
                emoji: "☕",
                color: "from-amber-600 to-yellow-700",
                featured: false,
        },
        {
                email: "admin@empire.com",
                password: "empire@123",
                name: "Empire Restaurant",
                tagline: "Multi-cuisine • large menu",
                emoji: "👑",
                color: "from-purple-600 to-indigo-700",
                featured: false,
        },
];

export default function LoginSection() {
        const { setThemeColor } = useXTheme();
        const router = useRouter();
        const session = useSession();
        const { profile: dashboard } = useAdmin();
        const loggedIn = session.status === "authenticated";

        const [logoutLoading, setLogoutLoading] = useState(false);
        const [profile, setProfile] = useState<TProfile>();
        const [nextLoading, setNextLoading] = useState(false);
        const [demoLoading, setDemoLoading] = useState<string | null>(null);
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

        // One-click demo login — used in live pitches to restaurant owners
        const onDemoLogin = async (demoEmail: string, demoPassword: string, demoName: string) => {
                setDemoLoading(demoEmail);
                try {
                        const res = await signIn("restaurant", {
                                redirect: false,
                                username: demoEmail,
                                password: demoPassword,
                                callbackUrl: `${window.location.origin}/dashboard`,
                        });
                        if (res?.error) {
                                toast.error(`Login failed: ${res.error}`);
                                return;
                        }
                        toast.success(`Welcome to ${demoName}!`);
                        router.push("/dashboard");
                } catch {
                        toast.error("Something went wrong. Please try again.");
                } finally {
                        setDemoLoading(null);
                }
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
                <section id="login" className="relative py-28 sm:py-36 bg-muted/30">
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
                                                        <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent" />
                                                        <div className="absolute bottom-6 left-6 right-6">
                                                                <div className="glass rounded-2xl p-4 text-left">
                                                                        <p className="text-sm font-semibold text-foreground">Manage everything</p>
                                                                        <p className="text-xs text-muted-foreground">Orders, menu, analytics — all in one place</p>
                                                                </div>
                                                        </div>
                                                </div>
                                                <h3 className="text-3xl font-black text-foreground">Welcome back!</h3>
                                                <p className="text-muted-foreground mt-3 max-w-sm leading-relaxed">
                                                        Sign in to manage your restaurant, view orders, and access the kitchen display.
                                                </p>
                                        </motion.div>

                                        <motion.div
                                                initial={{ opacity: 0, x: 24 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: true, margin: "-100px" }}
                                                transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}>
                                                <Card className="border-2 shadow-xl overflow-hidden">
                                                        <div className="h-1 bg-gradient-to-r from-primary via-accent to-secondary" />
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
                                                                                <div className="space-y-5">
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

                                                                                        {/* Divider */}
                                                                                        <div className="relative py-1">
                                                                                                <div className="absolute inset-0 flex items-center">
                                                                                                        <span className="w-full border-t" />
                                                                                                </div>
                                                                                                <div className="relative flex justify-center">
                                                                                                        <span className="bg-card px-3 text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                                                                                                <Sparkles className="h-3 w-3 text-primary" />
                                                                                                                Live demo accounts
                                                                                                        </span>
                                                                                                </div>
                                                                                        </div>

                                                                                        {/* Demo login shortcuts — one click for live pitches */}
                                                                                        <div className="space-y-2.5">
                                                                                                {DEMO_ACCOUNTS.map((demo) => (
                                                                                                        <motion.button
                                                                                                                key={demo.email}
                                                                                                                type="button"
                                                                                                                onClick={() => onDemoLogin(demo.email, demo.password, demo.name)}
                                                                                                                disabled={demoLoading !== null}
                                                                                                                whileHover={{ scale: demoLoading === null ? 1.01 : 1 }}
                                                                                                                whileTap={{ scale: 0.99 }}
                                                                                                                className={`group relative w-full flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all overflow-hidden
                                                                                                                        ${demo.featured ? "border-primary/40 bg-gradient-to-br from-primary/5 to-transparent hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10" : "border-border bg-card hover:border-primary/30 hover:bg-muted/40"}`}>
                                                                                                                {/* Featured ribbon */}
                                                                                                                {demo.featured && (
                                                                                                                        <div className="absolute top-0 right-0 bg-gradient-to-l from-primary to-primary/80 text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-bl-lg flex items-center gap-1">
                                                                                                                                <Crown className="h-2.5 w-2.5" /> HERO
                                                                                                                        </div>
                                                                                                                )}

                                                                                                                {/* Emoji icon with gradient bg */}
                                                                                                                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${demo.color} text-xl shadow-md`}>
                                                                                                                        <span>{demo.emoji}</span>
                                                                                                                </div>

                                                                                                                {/* Text content */}
                                                                                                                <div className="flex-1 min-w-0">
                                                                                                                        <div className="text-sm font-bold text-foreground truncate">{demo.name}</div>
                                                                                                                        <div className="text-[11px] text-muted-foreground truncate">{demo.tagline}</div>
                                                                                                                </div>

                                                                                                                {/* CTA */}
                                                                                                                <div className="shrink-0 flex items-center gap-1 text-primary">
                                                                                                                        {demoLoading === demo.email ? (
                                                                                                                                <span className="text-[11px] font-medium animate-pulse">Signing in…</span>
                                                                                                                        ) : (
                                                                                                                                <>
                                                                                                                                        <span className="text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Open</span>
                                                                                                                                        <Zap className="h-4 w-4 fill-primary" />
                                                                                                                                </>
                                                                                                                        )}
                                                                                                                </div>
                                                                                                        </motion.button>
                                                                                                ))}
                                                                                        </div>

                                                                                        <p className="text-center text-[11px] text-muted-foreground pt-1">
                                                                                                Demo accounts are pre-loaded with menus, tables & orders. No signup needed.
                                                                                        </p>
                                                                                </div>
                                                                        ) : (
                                                                                <div className="space-y-4">
                                                                                        <button
                                                                                                onClick={() => setProfile(undefined)}
                                                                                                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
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
