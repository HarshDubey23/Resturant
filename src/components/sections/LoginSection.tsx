"use client";

import { ArrowRight, Bot, ChevronLeft, KeyRound, LogIn, LogOut, CalendarCheck, CalendarDays, Clock, Users, Phone, Mail, User, MessageSquare } from "lucide-react";
import { motion } from "motion/react";
import type { ChangeEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginSection() {
        const [identifier, setIdentifier] = useState("");
        const [kitchenUsername, setKitchenUsername] = useState("");
        const [showKitchen, setShowKitchen] = useState(false);
        const [password, setPassword] = useState("");
        const [step, setStep] = useState<"identifier" | "password">("identifier");
        const [loading, setLoading] = useState(false);
        const [loggedIn, setLoggedIn] = useState(false);
        const [profileName, setProfileName] = useState("");

        const onNext = async () => {
                setLoading(true);
                try {
                        if (step === "identifier") {
                                // Try to fetch profile preview from our API
                                const res = await fetch(`/api/auth/profile?email=${encodeURIComponent(identifier)}`);
                                const data = await res.json();
                                if (data.name) {
                                        setProfileName(data.name);
                                } else {
                                        setProfileName(identifier);
                                }
                                setStep("password");
                        } else {
                                // Sign in via our auth API
                                const res = await fetch("/api/auth/login", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                                email: identifier,
                                                password,
                                                kitchenUsername: showKitchen ? kitchenUsername : undefined,
                                        }),
                                });
                                const data = await res.json();
                                if (res.ok) {
                                        toast.success("Signed in successfully!");
                                        setLoggedIn(true);
                                        setProfileName(data.user?.name || identifier);
                                } else {
                                        toast.error(data.error || "Invalid credentials");
                                        setPassword("");
                                }
                        }
                } catch {
                        toast.error("Network error. Please try again.");
                } finally {
                        setLoading(false);
                }
        };

        // Reservation form state
        const [resData, setResData] = useState({ name: "", email: "", phone: "", date: "", time: "", guests: "2", message: "" });
        const [resLoading, setResLoading] = useState(false);

        const handleResChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                // Map form IDs to state keys
                const idMap: Record<string, string> = { "res-name": "name", "res-email": "email", "res-phone": "phone", "res-date": "date", "res-time": "time", "res-guests": "guests", "res-message": "message" };
                const key = idMap[e.target.id] || e.target.id;
                setResData((prev) => ({ ...prev, [key]: e.target.value }));
        };

        const handleResSubmit = async (e: React.FormEvent) => {
                e.preventDefault();
                setResLoading(true);
                try {
                        const res = await fetch("/api/reservation", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(resData),
                        });
                        const data = await res.json();
                        if (res.ok) {
                                toast.success("Reservation confirmed! We'll send you a confirmation email.");
                                setResData({ name: "", email: "", phone: "", date: "", time: "", guests: "2", message: "" });
                        } else {
                                toast.error(data.error || "Failed to make reservation.");
                        }
                } catch {
                        toast.error("Network error. Please try again.");
                } finally {
                        setResLoading(false);
                }
        };

        const logout = () => {
                setLoggedIn(false);
                setProfileName("");
                setStep("identifier");
                setIdentifier("");
                setPassword("");
                toast.success("Signed out");
        };

        return (
                <section id="login" className="relative py-28 sm:py-36 bg-slate-50">
                        <div className="absolute inset-0 bg-mesh pointer-events-none" />
                        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                                <div className="grid lg:grid-cols-2 gap-16 items-center">
                                        <motion.div
                                                initial={{ opacity: 0, x: -30 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: true, margin: "-100px" }}
                                                transition={{ duration: 0.6, ease: "easeOut" }}>
                                                <div className="rounded-2xl border border-slate-100 bg-white shadow-soft overflow-hidden">
                                                        <div className="h-1.5 bg-gradient-to-r from-violet-600 via-violet-500 to-fuchsia-500" />
                                                        <div className="p-6 sm:p-8">
                                                                <div className="text-center mb-6">
                                                                        <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Reserve Your Table</h3>
                                                                        <p className="text-sm text-slate-500 mt-2">Book a dining experience at our restaurant</p>
                                                                </div>
                                                                <form onSubmit={handleResSubmit} className="[&_input::placeholder]:text-slate-500 [&_textarea::placeholder]:text-slate-500 space-y-4">
                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                                <div className="space-y-2">
                                                                                        <Label htmlFor="res-name" className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-slate-400" />Name</Label>
                                                                                        <Input id="res-name" value={resData.name} onChange={handleResChange} placeholder="Your name" required />
                                                                                </div>
                                                                                <div className="space-y-2">
                                                                                        <Label htmlFor="res-email" className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-400" />Email</Label>
                                                                                        <Input id="res-email" type="email" value={resData.email} onChange={handleResChange} placeholder="you@email.com" required />
                                                                                </div>
                                                                        </div>
                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                                <div className="space-y-2">
                                                                                        <Label htmlFor="res-phone" className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-400" />Phone</Label>
                                                                                        <Input id="res-phone" type="tel" value={resData.phone} onChange={handleResChange} placeholder="+91 9876543210" required />
                                                                                </div>
                                                                                <div className="space-y-2">
                                                                                        <Label htmlFor="res-guests" className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-slate-400" />Guests</Label>
                                                                                        <Input id="res-guests" type="number" min="1" max="20" value={resData.guests} onChange={handleResChange} placeholder="2" required />
                                                                                </div>
                                                                        </div>
                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                                <div className="space-y-2">
                                                                                        <Label htmlFor="res-date" className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-slate-400" />Date</Label>
                                                                                        <Input id="res-date" type="date" value={resData.date} onChange={handleResChange} required />
                                                                                </div>
                                                                                <div className="space-y-2">
                                                                                        <Label htmlFor="res-time" className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-slate-400" />Time</Label>
                                                                                        <Input id="res-time" type="time" value={resData.time} onChange={handleResChange} required />
                                                                                </div>
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                                <Label htmlFor="res-message" className="flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5 text-slate-400" />Special requests (optional)</Label>
                                                                                <textarea id="res-message" value={resData.message} onChange={handleResChange} placeholder="Any dietary requirements, seating preferences..." className="w-full min-h-[80px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 focus:outline-none resize-none" />
                                                                        </div>
                                                                        <Button type="submit" className="w-full h-12 text-base rounded-xl bg-violet-600 hover:bg-violet-700" disabled={resLoading}>
                                                                                {resLoading ? "Reserving..." : <>Reserve Table <CalendarCheck className="ml-2 h-4 w-4" /></>}
                                                                        </Button>
                                                                        <p className="text-xs text-slate-400 text-center">Free reservation — no payment required</p>
                                                                </form>
                                                        </div>
                                                </div>
                                        </motion.div>

                                        <motion.div
                                                initial={{ opacity: 0, x: 24 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: true, margin: "-100px" }}
                                                transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}>
                                                <Card className="shadow-soft overflow-hidden min-h-[480px] border border-slate-100 rounded-2xl bg-white">
                                                        <div className="h-1 bg-gradient-to-r from-violet-600 via-violet-500 to-fuchsia-500" />
                                                        <CardHeader className="text-center">
                                                                {loggedIn ? (
                                                                        <div className="flex items-center justify-between">
                                                                                <div className="text-left">
                                                                                        <CardTitle className="text-base">{profileName}</CardTitle>
                                                                                        <CardDescription>Restaurant Owner</CardDescription>
                                                                                </div>
                                                                                <Button variant="ghost" size="icon" onClick={logout} aria-label="Sign out">
                                                                                        <LogOut className="h-4 w-4" />
                                                                                </Button>
                                                                        </div>
                                                                ) : (
                                                                        <>
                                                                                <LogIn className="h-8 w-8 text-violet-600 mx-auto mb-2" />
                                                                                <CardTitle>Sign in</CardTitle>
                                                                                <CardDescription>Enter your credentials to access the dashboard</CardDescription>
                                                                        </>
                                                                )}
                                                        </CardHeader>

                                                        <CardContent>
                                                                {!loggedIn ? (
                                                                        step === "identifier" ? (
                                                                                <div className="space-y-4">
                                                                                        <div className="space-y-2">
                                                                                                <Label htmlFor="login-identifier">Email or Restaurant ID</Label>
                                                                                                <Input
                                                                                                        id="login-identifier"
                                                                                                        type="text"
                                                                                                        placeholder="you@restaurant.com or your-restaurant"
                                                                                                        value={identifier}
                                                                                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setIdentifier(e.target.value.trim())}
                                                                                                        onKeyDown={(e) => e.key === "Enter" && onNext()}
                                                                                                        autoComplete="username"
                                                                                                />
                                                                                        </div>
                                                                                        <Button className="w-full" onClick={onNext} disabled={loading}>
                                                                                                Next
                                                                                                <ArrowRight className="ml-2 h-4 w-4" />
                                                                                        </Button>
                                                                                </div>
                                                                        ) : (
                                                                                <div className="space-y-4">
                                                                                        <button
                                                                                                onClick={() => { setStep("identifier"); setPassword(""); }}
                                                                                                className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-all duration-200">
                                                                                                <ChevronLeft className="h-4 w-4" />
                                                                                                Change login
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
                                                                                                        autoComplete="current-password"
                                                                                                />
                                                                                        </div>

                                                                                        <Button variant="outline" className="w-full" onClick={() => setShowKitchen((v) => !v)}>
                                                                                                <Bot className="mr-2 h-4 w-4" />
                                                                                                {showKitchen ? "Sign in as admin" : "Sign in to kitchen"}
                                                                                        </Button>

                                                                                        <Button className="w-full" onClick={onNext} disabled={loading}>
                                                                                                <KeyRound className="mr-2 h-4 w-4" />
                                                                                                Sign In
                                                                                        </Button>
                                                                                </div>
                                                                        )
                                                                ) : (
                                                                        <div className="space-y-3">
                                                                                <Button className="w-full">
                                                                                        Open dashboard
                                                                                </Button>
                                                                                <Button variant="outline" className="w-full">
                                                                                        Open kitchen display
                                                                                </Button>
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
