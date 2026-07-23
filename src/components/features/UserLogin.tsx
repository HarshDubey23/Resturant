"use client";

import { ArrowLeft, ArrowRight, Loader2, MessageSquare, Phone, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { usePathname, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const mobilePattern = /^(\+91[-\s]?)?[6-9]\d{9}$/;

type Step = "phone" | "otp" | "details";

interface UserLoginProps {
        setOpen: (open: boolean) => void;
}

export default function UserLogin({ setOpen }: UserLoginProps) {
        const pathname = usePathname();
        const params = useSearchParams();
        const [step, setStep] = useState<Step>("phone");
        const [busy, setBusy] = useState(false);
        const [phone, setPhone] = useState("");
        const [otp, setOtp] = useState(["", "", "", "", "", ""]);
        const [fname, setFName] = useState("");
        const [lname, setLName] = useState("");
        const [verificationToken, setVerificationToken] = useState<string | null>(null);
        const [resendCooldown, setResendCooldown] = useState(0);
        const [debugOtp, setDebugOtp] = useState<string | null>(null);
        const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

        const phoneNumber = `+91${phone}`;
        const restaurantSlug = pathname.replaceAll("/", "");
        const tableId = params.get("table") || "";

        // Resend cooldown timer
        useEffect(() => {
                if (resendCooldown <= 0) return;
                const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
                return () => clearTimeout(t);
        }, [resendCooldown]);

        const handleOtpChange = (i: number, val: string) => {
                const digit = val.replace(/\D/g, "").slice(-1);
                const next = [...otp];
                next[i] = digit;
                setOtp(next);
                if (digit && i < 5) otpRefs.current[i + 1]?.focus();
        };

        const handleOtpKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Backspace" && !otp[i] && i > 0) {
                        otpRefs.current[i - 1]?.focus();
                }
                if (e.key === "Enter" && otp.every((d) => d)) {
                        handleVerifyOtp();
                }
        };

        const handleOtpPaste = (e: React.ClipboardEvent) => {
                e.preventDefault();
                const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                if (pasted.length === 6) {
                        setOtp(pasted.split(""));
                        otpRefs.current[5]?.focus();
                }
        };

        const isDemoRestaurant = restaurantSlug === "demo";

        const handleSendOtp = async () => {
                if (!mobilePattern.test(phoneNumber)) {
                        return toast.error("Please enter a valid 10-digit Indian mobile number");
                }
                if (!tableId) {
                        return toast.error("Please scan the table QR code to order");
                }
                setBusy(true);
                try {
                        const res = await fetch("/api/auth/send-otp", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ restaurant: restaurantSlug, phone: phoneNumber }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data?.message || "Failed to send OTP");
                        toast.success("OTP sent via WhatsApp", { description: `Check ${phoneNumber} for the 6-digit code` });
                        setStep("otp");
                        setResendCooldown(30);
                        if (data.debugOtp) {
                                setDebugOtp(data.debugOtp);
                        }
                        setTimeout(() => otpRefs.current[0]?.focus(), 200);
                } catch (err) {
                        // Fallback: if the OTP backend is unavailable (no Redis/WhatsApp) AND we're
                        // on the demo restaurant, skip OTP and go straight to sign-in. The server's
                        // isDemo check (DEMO_MODE=true + restaurant="demo" + non-prod) handles auth.
                        if (isDemoRestaurant) {
                                toast.info("Demo mode — skipping OTP");
                                setStep("details");
                                return;
                        }
                        toast.error(err instanceof Error ? err.message : "Failed to send OTP. Please try again.");
                } finally {
                        setBusy(false);
                }
        };

        const handleVerifyOtp = async () => {
                const code = otp.join("");
                if (code.length !== 6) return toast.error("Please enter the 6-digit code");
                setBusy(true);
                try {
                        const res = await fetch("/api/auth/verify-otp", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ restaurant: restaurantSlug, phone: phoneNumber, otp: code, fname, lname }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data?.message || "Invalid OTP");
                        setVerificationToken(data.verificationToken);
                        toast.success("Phone verified!");
                        // If the customer already has a real name (not Guest), skip the details step
                        const custName = `${data.customer?.fname ?? ""} ${data.customer?.lname ?? ""}`.trim();
                        if (data.customer && !custName.startsWith("Guest")) {
                                setFName(data.customer.fname || "");
                                setLName(data.customer.lname || "");
                                await handleSignIn(data.verificationToken, data.customer.fname || "", data.customer.lname || "");
                                return;
                        }
                        setStep("details");
                } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Invalid OTP");
                        // Clear OTP inputs on failure
                        setOtp(["", "", "", "", "", ""]);
                        otpRefs.current[0]?.focus();
                } finally {
                        setBusy(false);
                }
        };

        const handleSignIn = async (token?: string, firstName?: string, lastName?: string) => {
                const tokenToUse = token ?? verificationToken;
                if (!tokenToUse) {
                        toast.error("Session expired. Please verify your phone again.");
                        setStep("phone");
                        return;
                }
                setBusy(true);
                try {
                        const res = await signIn("customer", {
                                redirect: false,
                                restaurant: restaurantSlug,
                                phone: phoneNumber,
                                fname: firstName ?? fname,
                                lname: lastName ?? lname,
                                table: tableId,
                                verificationToken: tokenToUse,
                                callbackUrl: `${window.location.origin}`,
                        });
                        if (res?.error) {
                                throw new Error(res.error);
                        }
                        toast.success("You're in! Browse the menu and place your order.");
                        setOpen(false);
                } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Login failed");
                } finally {
                        setBusy(false);
                }
        };

        return (
                <div className="space-y-6 py-4">
                        <div className="text-center">
                                <h2 className="text-lg font-semibold">
                                        {step === "phone" && (
                                                <>
                                                        Let&apos;s <span className="text-primary">start ordering</span>
                                                </>
                                        )}
                                        {step === "otp" && (
                                                <>
                                                        Verify your <span className="text-primary">phone</span>
                                                </>
                                        )}
                                        {step === "details" && (
                                                <>
                                                        Almost <span className="text-primary">there</span>
                                                </>
                                        )}
                                </h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                        {step === "phone" && "Enter your phone number — we'll send a WhatsApp OTP"}
                                        {step === "otp" && `Enter the 6-digit code sent to ${phoneNumber}`}
                                        {step === "details" && "Tell us your name for the kitchen ticket"}
                                </p>
                        </div>

                        <AnimatePresence mode="wait">
                                {step === "phone" && (
                                        <motion.div key="phone" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                                                <div className="space-y-2">
                                                        <Label htmlFor="login-phone">Phone Number</Label>
                                                        <div className="flex items-center gap-2">
                                                                <div className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground">+91</div>
                                                                <Input
                                                                        id="login-phone"
                                                                        type="tel"
                                                                        placeholder="9876543210"
                                                                        value={phone}
                                                                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                                                                const val = e.target.value.replace(/\D/g, "");
                                                                                if (val.length <= 10) setPhone(val);
                                                                        }}
                                                                        onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                                                                        className="flex-1"
                                                                        autoComplete="tel"
                                                                />
                                                        </div>
                                                </div>
                                                <div className="flex items-start gap-2 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                                                        <ShieldCheck className="h-4 w-4 flex-shrink-0 mt-0.5 text-primary" />
                                                        <span>We verify your phone so the kitchen can confirm pickup and you can track your order. No spam, no marketing.</span>
                                                </div>
                                                <Button className="w-full" onClick={handleSendOtp} loading={busy}>
                                                        <MessageSquare className="mr-2 h-4 w-4" />
                                                        Send WhatsApp OTP
                                                </Button>
                                        </motion.div>
                                )}

                                {step === "otp" && (
                                        <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                                {debugOtp && (
                                                        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-center">
                                                                <p className="text-xs text-amber-700">
                                                                        <span className="font-semibold">Dev mode OTP:</span>{" "}
                                                                        <span className="font-mono text-base font-bold tracking-wider">{debugOtp}</span>
                                                                </p>
                                                        </div>
                                                )}
                                                <div className="space-y-2" onPaste={handleOtpPaste}>
                                                        <Label htmlFor="login-otp-0">6-digit code</Label>
                                                        <div className="flex gap-2 justify-between">
                                                                {otp.map((d, i) => (
                                                                        <Input
                                                                                key={i}
                                                                                id={`login-otp-${i}`}
                                                                                ref={(el) => {
                                                                                        otpRefs.current[i] = el;
                                                                                }}
                                                                                type="text"
                                                                                inputMode="numeric"
                                                                                maxLength={1}
                                                                                value={d}
                                                                                onChange={(e) => handleOtpChange(i, e.target.value)}
                                                                                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                                                                className="h-12 w-12 text-center text-lg font-bold p-0"
                                                                                autoComplete={i === 0 ? "one-time-code" : "off"}
                                                                        />
                                                                ))}
                                                        </div>
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                        <button
                                                                type="button"
                                                                onClick={handleSendOtp}
                                                                disabled={resendCooldown > 0 || busy}
                                                                className="text-primary hover:underline disabled:opacity-50 disabled:no-underline">
                                                                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                                                        </button>
                                                        <button type="button" onClick={() => setStep("phone")} className="text-muted-foreground hover:underline">
                                                                Change number
                                                        </button>
                                                </div>
                                                <Button className="w-full" onClick={handleVerifyOtp} loading={busy}>
                                                        Verify & Continue
                                                        <ArrowRight className="ml-2 h-4 w-4" />
                                                </Button>
                                        </motion.div>
                                )}

                                {step === "details" && (
                                        <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                                <div className="space-y-2">
                                                        <Label htmlFor="login-fname">First Name</Label>
                                                        <Input
                                                                id="login-fname"
                                                                placeholder="John"
                                                                value={fname}
                                                                onChange={(e: ChangeEvent<HTMLInputElement>) => setFName(e.target.value)}
                                                                autoComplete="given-name"
                                                        />
                                                </div>
                                                <div className="space-y-2">
                                                        <Label htmlFor="login-lname">Last Name</Label>
                                                        <Input
                                                                id="login-lname"
                                                                placeholder="Doe"
                                                                value={lname}
                                                                onChange={(e: ChangeEvent<HTMLInputElement>) => setLName(e.target.value)}
                                                                onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                                                                autoComplete="family-name"
                                                        />
                                                </div>
                                                <div className="flex gap-2">
                                                        <Button variant="outline" className="flex-1" onClick={() => setStep("otp")}>
                                                                <ArrowLeft className="mr-2 h-4 w-4" />
                                                                Back
                                                        </Button>
                                                        <Button className="flex-1" onClick={() => handleSignIn()} loading={busy}>
                                                                Start Ordering
                                                        </Button>
                                                </div>
                                        </motion.div>
                                )}
                        </AnimatePresence>

                        {/* Trust footer */}
                        <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                Your phone is used only for order verification.
                        </div>
                </div>
        );
}
