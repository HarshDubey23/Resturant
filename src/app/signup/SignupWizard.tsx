"use client";

import { ArrowLeft, ArrowRight, Check, Loader2, PartyPopper, Printer, Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
        CURRENCY_OPTIONS,
        FOOD_TYPE_OPTIONS,
        initialWizardState,
        passwordStrength,
        slugify,
        STATION_OPTIONS,
        STEP_DEFS,
        THEME_PRESETS,
        type MenuItemDraft,
        type WizardState,
        VEG_OPTIONS,
        fileToDataUrl,
} from "./wizard-types";

const PROGRESS_MESSAGES: Record<number, string> = {
        1: "Creating your account…",
        2: "Signing you in…",
        3: "Saving brand & location…",
        4: "Applying theme…",
        5: "Configuring AI providers…",
        6: "Adding menu items…",
        7: "Generating table QR codes…",
        8: "Almost there…",
};

export default function SignupWizard() {
        const router = useRouter();
        const [step, setStep] = useState(1);
        const [state, setState] = useState<WizardState>(initialWizardState);
        const [errors, setErrors] = useState<Record<string, string>>({});
        const [submitting, setSubmitting] = useState(false);
        const [progress, setProgress] = useState<{ step: number; message: string } | null>(null);
        const [slugStatus, setSlugStatus] = useState<{ state: "idle" | "checking" | "available" | "taken"; message?: string }>({ state: "idle" });
        const [success, setSuccess] = useState<{ qrCodes: Array<{ name: string; qr: string }>; restaurantUrl: string } | null>(null);

        const update = <K extends keyof WizardState>(key: K, value: WizardState[K]) => {
                setState((s) => ({ ...s, [key]: value }));
                if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
        };

        // Debounced slug availability check (3+ chars only). Avoids burning the user's
        // time completing 9 steps only to find the slug is taken at submit.
        useEffect(() => {
                const slug = state.restaurantID;
                if (!slug || slug.length < 3 || !/^[a-z0-9-]+$/.test(slug)) {
                        setSlugStatus({ state: "idle" });
                        return;
                }
                setSlugStatus({ state: "checking" });
                const controller = new AbortController();
                const t = setTimeout(async () => {
                        try {
                                const res = await fetch(`/api/baseProfile?username=${encodeURIComponent(slug)}`, { signal: controller.signal });
                                if (res.status === 404) {
                                        setSlugStatus({ state: "available", message: "Available" });
                                } else if (res.ok) {
                                        setSlugStatus({ state: "taken", message: "This URL is already taken" });
                                } else {
                                        setSlugStatus({ state: "idle" });
                                }
                        } catch {
                                if (!controller.signal.aborted) setSlugStatus({ state: "idle" });
                        }
                }, 400);
                return () => {
                        controller.abort();
                        clearTimeout(t);
                };
        }, [state.restaurantID]);

        const validateStep = (n: number): boolean => {
                const e: Record<string, string> = {};
                if (n === 1) {
                        if (!state.restaurantName.trim()) e.restaurantName = "Restaurant name is required";
                        if (state.restaurantID.length < 3) e.restaurantID = "URL must be at least 3 characters";
                        if (!/^[a-z0-9-]+$/.test(state.restaurantID)) e.restaurantID = "Only lowercase letters, numbers, hyphens";
                        else if (slugStatus.state === "taken") e.restaurantID = "This URL is already taken — try another";
                }
                if (n === 2) {
                        if (!state.address.trim()) e.address = "Address is required";
                        if (state.phone && !/^[+\d\s-]{8,}$/.test(state.phone)) e.phone = "Invalid phone";
                }
                if (n === 4) {
                        for (const item of state.menuItems) {
                                if (!item.name.trim()) { e[`menu-${item.id}`] = "Name required"; break; }
                                if (!item.price || Number(item.price) <= 0) { e[`menu-${item.id}`] = "Valid price required"; break; }
                        }
                }
                if (n === 6) {
                        if (state.gstNumber && !/^[A-Z0-9]{10,15}$/i.test(state.gstNumber)) e.gstNumber = "Invalid GSTIN format";
                        if (state.currency === "INR" && state.upiId && !/^[\w.-]+@[\w.-]+$/.test(state.upiId)) e.upiId = "Invalid UPI ID";
                }
                if (n === 7) {
                        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) e.email = "Valid email required";
                        if (state.password.length < 8) e.password = "Min 8 characters";
                        if (state.password !== state.passwordConfirm) e.passwordConfirm = "Passwords don't match";
                }
                setErrors(e);
                return Object.keys(e).length === 0;
        };

        const next = () => {
                if (validateStep(step)) {
                        setStep((s) => Math.min(s + 1, 9));
                        window.scrollTo({ top: 0, behavior: "smooth" });
                }
        };
        const back = () => setStep((s) => Math.max(s - 1, 1));

        const submitAll = async () => {
                if (!validateStep(7)) return;
                setSubmitting(true);
                try {
                        setProgress({ step: 1, message: PROGRESS_MESSAGES[1] });
                        // 1. Create account + profile
                        const signupRes = await fetch("/api/auth/signup", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                        email: state.email,
                                        password: state.password,
                                        restaurantName: state.restaurantName,
                                        restaurantID: state.restaurantID,
                                }),
                        });
                        const signupData = await signupRes.json();
                        if (!signupRes.ok) throw new Error(signupData.message || "Signup failed");

                        // 2. Sign in as admin
                        setProgress({ step: 2, message: PROGRESS_MESSAGES[2] });
                        const signInRes = await signIn("restaurant", {
                                username: state.restaurantID,
                                password: state.password,
                                redirect: false,
                        });
                        if (!signInRes || signInRes.error) throw new Error("Login failed after signup");

                        // 3. Update profile with all wizard data
                        setProgress({ step: 3, message: PROGRESS_MESSAGES[3] });
                        const profileBody: Record<string, unknown> = {
                                name: state.restaurantName,
                                description: state.description,
                                address: state.address,
                                phone: state.phone,
                                currency: state.currency,
                                gstInclusive: state.gstInclusive,
                                gstNumber: state.gstNumber.toUpperCase(),
                                upiId: state.upiId,
                                categories: state.categories,
                                avatar: state.logoUrl,
                                cover: state.cover,
                                photos: state.photos,
                                logoUrl: state.logoUrl,
                                brandColor: state.brandColor,
                        };
                        await fetch("/api/admin", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(profileBody),
                        });

                        // 4. Apply theme
                        setProgress({ step: 4, message: PROGRESS_MESSAGES[4] });
                        await fetch("/api/admin/theme", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ themeColor: { h: state.themeH, s: state.themeS, l: state.themeL } }),
                        });

                        // 5. Save AI keys (if any provided)
                        if (state.aiGroq || state.aiCerebras || state.aiGoogle || state.aiSiliconFlow || state.aiHuggingFace) {
                                setProgress({ step: 5, message: PROGRESS_MESSAGES[5] });
                                await fetch("/api/admin/ai-keys", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                                groq: state.aiGroq || undefined,
                                                cerebras: state.aiCerebras || undefined,
                                                google: state.aiGoogle || undefined,
                                                siliconflow: state.aiSiliconFlow || undefined,
                                                huggingface: state.aiHuggingFace || undefined,
                                        }),
                                });
                        }

                        // 6. Add menu items
                        if (state.menuItems.length > 0) {
                                setProgress({ step: 6, message: PROGRESS_MESSAGES[6] });
                                for (const item of state.menuItems) {
                                        await fetch("/api/auth/setup-menu", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({
                                                        restaurantID: state.restaurantID,
                                                        name: item.name,
                                                        price: Number(item.price),
                                                        category: item.category || "main",
                                                        image: item.image || undefined,
                                                }),
                                        });
                                }
                        }

                        // 7. Generate tables + QR codes — capture response so we can show a success screen
                        setProgress({ step: 7, message: PROGRESS_MESSAGES[7] });
                        const tablesRes = await fetch("/api/auth/setup-tables", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ restaurantID: state.restaurantID, count: state.tableCount, prefix: state.tablePrefix }),
                        });
                        const tablesData = await tablesRes.json().catch(() => ({}));
                        const qrCodes = Array.isArray(tablesData?.tables) ? tablesData.tables : [];
                        const restaurantUrl = `${window.location.origin}/${state.restaurantID}`;

                        setProgress({ step: 8, message: PROGRESS_MESSAGES[8] });
                        // Show the success screen with QR codes (replaces the artificial 800ms delay)
                        setSuccess({ qrCodes, restaurantUrl });
                        setProgress(null);
                } catch (err) {
                        setProgress(null);
                        setErrors({ submit: err instanceof Error ? err.message : "Something went wrong" });
                } finally {
                        setSubmitting(false);
                }
        };

        return (
                <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
                        {/* Print scope is now the wizard container — no longer hides the whole document. */}

                        {/* Success screen — replaces the wizard once tables + QR codes are generated */}
                        {success && <SuccessScreen success={success} restaurantName={state.restaurantName} onEnterDashboard={() => router.push("/dashboard")} />}

                        {/* Top bar */}
                        <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/70 dark:bg-zinc-950/70 border-b border-border">
                                <div className="mx-auto max-w-5xl px-4 sm:px-6 h-16 flex items-center justify-between">
                                        <a href="/" className="flex items-center gap-2">
                                                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                                        <Sparkles className="h-5 w-5 text-primary" />
                                                </div>
                                                <span className="text-lg font-bold tracking-tight">
                                                        Order<span className="text-primary">Worder</span>
                                                </span>
                                        </a>
                                        <a href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                                Already a customer? <span className="font-semibold text-primary">Sign in</span>
                                        </a>
                                </div>
                        </header>

                        {!success && (
                                <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12">
                                        {/* Title + stepper */}
                                        <div className="text-center mb-10">
                                                <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
                                                        Launch your restaurant in <span className="text-gradient">9 simple steps</span>
                                                </h1>
                                                <p className="mt-2 text-muted-foreground">
                                                        Everything you set up here goes live instantly. You can change it later from your dashboard.
                                                </p>
                                        </div>

                                {/* Stepper rail */}
                                <Stepper currentStep={step} onJump={(n) => n < step && setStep(n)} />

                                {/* Step body */}
                                <div className="mt-8">
                                        <AnimatePresence mode="wait">
                                                <motion.div
                                                        key={step}
                                                        initial={{ opacity: 0, x: 20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: -20 }}
                                                        transition={{ duration: 0.25, ease: "easeOut" }}
                                                >
                                                        {step === 1 && <BrandStep state={state} update={update} errors={errors} slugStatus={slugStatus} />}
                                                        {step === 2 && <LocationStep state={state} update={update} errors={errors} />}
                                                        {step === 3 && <ThemeStep state={state} update={update} />}
                                                        {step === 4 && <MenuStep state={state} update={update} errors={errors} />}
                                                        {step === 5 && <TablesStep state={state} update={update} />}
                                                        {step === 6 && <PaymentsStep state={state} update={update} errors={errors} />}
                                                        {step === 7 && <AccountStep state={state} update={update} errors={errors} />}
                                                        {step === 8 && <AIKeysStep state={state} update={update} />}
                                                        {step === 9 && <ReviewStep state={state} />}
                                                </motion.div>
                                        </AnimatePresence>
                                </div>

                                {/* Sticky footer nav */}
                                <div className="mt-10 flex items-center justify-between gap-3">
                                        <button
                                                onClick={back}
                                                disabled={step === 1 || submitting}
                                                className="inline-flex items-center gap-2 px-5 h-11 rounded-xl text-sm font-medium border border-border bg-card hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        >
                                                <ArrowLeft className="h-4 w-4" />
                                                Back
                                        </button>

                                        <div className="text-xs text-muted-foreground hidden sm:block">
                                                Step <span className="font-semibold text-foreground">{step}</span> of 9
                                        </div>

                                        {step < 9 ? (
                                                <button
                                                        onClick={next}
                                                        disabled={submitting}
                                                        className="inline-flex items-center gap-2 px-6 h-11 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 disabled:opacity-50 transition-all"
                                                >
                                                        Continue
                                                        <ArrowRight className="h-4 w-4" />
                                                </button>
                                        ) : (
                                                <button
                                                        onClick={submitAll}
                                                        disabled={submitting}
                                                        className="inline-flex items-center gap-2 px-6 h-11 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 disabled:opacity-50 transition-all"
                                                >
                                                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                        {submitting ? "Launching…" : "Launch my restaurant"}
                                                </button>
                                        )}
                                </div>

                                {errors.submit && (
                                        <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                                                {errors.submit}
                                        </div>
                                )}
                        </div>
                                )}

                        {/* Submit overlay */}
                        <AnimatePresence>
                                {progress && (
                                        <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
                                        >
                                                <div className="max-w-md w-full bg-card rounded-2xl border border-border shadow-2xl p-8 text-center">
                                                        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                                                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                        </div>
                                                        <h3 className="text-xl font-bold mb-2">Setting up your restaurant</h3>
                                                        <p className="text-sm text-muted-foreground mb-6">{progress.message}</p>
                                                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                                                                <motion.div
                                                                        className="h-full bg-primary rounded-full"
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${(progress.step / 8) * 100}%` }}
                                                                        transition={{ duration: 0.5 }}
                                                                />
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-3">{progress.step} / 8</p>
                                                </div>
                                        </motion.div>
                                )}
                        </AnimatePresence>
                </div>
        );
}

/* ───────────────────────── Stepper ───────────────────────── */

function Stepper({ currentStep, onJump }: { currentStep: number; onJump: (n: number) => void }) {
        return (
                <div className="hidden sm:flex items-center justify-between gap-1 max-w-3xl mx-auto">
                        {STEP_DEFS.map((s, i) => {
                                const isDone = s.id < currentStep;
                                const isActive = s.id === currentStep;
                                return (
                                        <div key={s.id} className="flex items-center flex-1 last:flex-none">
                                                <button
                                                        onClick={() => onJump(s.id)}
                                                        disabled={s.id >= currentStep}
                                                        className="flex items-center gap-2 group disabled:cursor-default"
                                                >
                                                        <div
                                                                className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                                                        isActive
                                                                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110"
                                                                                : isDone
                                                                                  ? "bg-primary text-primary-foreground"
                                                                                  : "bg-muted text-muted-foreground border border-border"
                                                                }`}
                                                        >
                                                                {isDone ? <Check className="h-4 w-4" /> : s.id}
                                                        </div>
                                                        <span
                                                                className={`text-xs font-medium hidden md:block ${isActive ? "text-foreground" : isDone ? "text-primary" : "text-muted-foreground"}`}
                                                        >
                                                                {s.short}
                                                        </span>
                                                </button>
                                                {i < STEP_DEFS.length - 1 && (
                                                        <div className={`h-0.5 flex-1 mx-2 rounded-full transition-all ${s.id < currentStep ? "bg-primary" : "bg-border"}`} />
                                                )}
                                        </div>
                                );
                        })}
                </div>
        );
}

/* ───────────────────────── Step 1: Brand ───────────────────────── */

function BrandStep({ state, update, errors, slugStatus }: { state: WizardState; update: <K extends keyof WizardState>(k: K, v: WizardState[K]) => void; errors: Record<string, string>; slugStatus: { state: "idle" | "checking" | "available" | "taken"; message?: string } }) {
        const logoInput = useRef<HTMLInputElement>(null);
        const coverInput = useRef<HTMLInputElement>(null);

        return (
                <div className="grid lg:grid-cols-5 gap-6">
                        <div className="lg:col-span-3 space-y-6">
                                <StepHeader title="Brand identity" subtitle="The name and look your customers will see when they scan your QR code." />

                                <Field label="Restaurant name" required error={errors.restaurantName}>
                                        <input
                                                type="text"
                                                value={state.restaurantName}
                                                onChange={(e) => {
                                                        update("restaurantName", e.target.value);
                                                        if (!state.restaurantID || state.restaurantID === slugify(state.restaurantName)) {
                                                                update("restaurantID", slugify(e.target.value));
                                                        }
                                                }}
                                                placeholder="The Spice Route"
                                                className={inputClass(!!errors.restaurantName)}
                                        />
                                </Field>

                                <Field label="Restaurant URL" required error={errors.restaurantID} hint={slugStatus.state === "available" ? undefined : "This is your unique link — yourdomain.com/your-restaurant"}>
                                <div className={`flex items-stretch rounded-xl border bg-card overflow-hidden ${errors.restaurantID || slugStatus.state === "taken" ? "border-destructive" : slugStatus.state === "available" ? "border-emerald-400" : "border-border"}`}>
                                        <span className="px-3 py-3 text-sm text-muted-foreground bg-muted/50 border-r border-border whitespace-nowrap">/</span>
                                        <input
                                                type="text"
                                                value={state.restaurantID}
                                                onChange={(e) => update("restaurantID", slugify(e.target.value))}
                                                placeholder="spice-route"
                                                aria-describedby="slug-status"
                                                className="flex-1 px-3 py-3 bg-card focus:outline-none text-sm"
                                        />
                                        <div id="slug-status" className="flex items-center px-3 text-xs whitespace-nowrap">
                                                {slugStatus.state === "checking" && (
                                                        <span className="flex items-center gap-1 text-muted-foreground">
                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                                Checking
                                                        </span>
                                                )}
                                                {slugStatus.state === "available" && (
                                                        <span className="flex items-center gap-1 font-semibold text-emerald-600">
                                                                <Check className="h-3.5 w-3.5" />
                                                                Available
                                                        </span>
                                                )}
                                                {slugStatus.state === "taken" && (
                                                        <span className="flex items-center gap-1 font-semibold text-destructive">
                                                                <X className="h-3.5 w-3.5" />
                                                                Taken
                                                        </span>
                                                )}
                                        </div>
                                </div>
                        </Field>

                                <Field label="Tagline / description" hint="Shown on your customer menu header. Max 200 chars.">
                                        <textarea
                                                value={state.description}
                                                onChange={(e) => update("description", e.target.value.slice(0, 200))}
                                                rows={3}
                                                placeholder="Authentic North Indian cuisine served in a warm, contemporary setting."
                                                className={inputClass(false)}
                                        />
                                        <div className="text-right text-xs text-muted-foreground mt-1">{state.description.length}/200</div>
                                </Field>

                                <div className="grid sm:grid-cols-2 gap-4">
                                        <ImageUpload
                                                label="Logo"
                                                value={state.logoUrl}
                                                onPick={(d) => update("logoUrl", d)}
                                                inputRef={logoInput}
                                                aspect="aspect-square"
                                                hint="PNG/JPG, square recommended"
                                        />
                                        <ImageUpload
                                                label="Cover photo"
                                                value={state.cover}
                                                onPick={(d) => update("cover", d)}
                                                inputRef={coverInput}
                                                aspect="aspect-video"
                                                hint="Shown at top of your menu"
                                        />
                                </div>
                        </div>

                        {/* Live preview card */}
                        <div className="lg:col-span-2">
                                <div className="sticky top-24">
                                        <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-3">Live preview</p>
                                        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                                                <div className="aspect-video bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 relative">
                                                        {state.cover ? (
                                                                <Image src={state.cover} alt="Cover preview" fill className="object-cover" />
                                                        ) : (
                                                                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">No cover yet</div>
                                                        )}
                                                </div>
                                                <div className="p-4 -mt-8 relative">
                                                        <div className="h-16 w-16 rounded-2xl bg-card border-4 border-card overflow-hidden shadow-md mb-3">
                                                                {state.logoUrl ? (
                                                                        <Image src={state.logoUrl} alt="Logo" width={64} height={64} className="object-cover h-full w-full" />
                                                                ) : (
                                                                        <div className="h-full w-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                                                                                {state.restaurantName.charAt(0).toUpperCase() || "?"}
                                                                        </div>
                                                                )}
                                                        </div>
                                                        <h3 className="font-bold text-base truncate">{state.restaurantName || "Your restaurant"}</h3>
                                                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{state.description || "Tagline appears here"}</p>
                                                        <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                                Live
                                                        </div>
                                                </div>
                                        </div>
                                </div>
                        </div>
                </div>
        );
}

/* ───────────────────────── Step 2: Location ───────────────────────── */

function LocationStep({ state, update, errors }: { state: WizardState; update: <K extends keyof WizardState>(k: K, v: WizardState[K]) => void; errors: Record<string, string> }) {
        const photoInput = useRef<HTMLInputElement>(null);

        const onPickPhotos = async (files: FileList | null) => {
                if (!files) return;
                const remaining = 4 - state.photos.length;
                const toRead = Array.from(files).slice(0, remaining);
                try {
                        const urls = await Promise.all(toRead.map(fileToDataUrl));
                        update("photos", [...state.photos, ...urls]);
                } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Failed to upload photos");
                }
        };

        return (
                <div className="grid lg:grid-cols-2 gap-6">
                        <div className="space-y-6">
                                <StepHeader title="Location & contact" subtitle="Used for invoices, directions, and customer support calls." />

                                <Field label="Full address" required error={errors.address}>
                                        <textarea
                                                value={state.address}
                                                onChange={(e) => update("address", e.target.value)}
                                                rows={3}
                                                placeholder="123 Marine Drive, Nariman Point, Mumbai 400020"
                                                className={inputClass(!!errors.address)}
                                        />
                                </Field>

                                <Field label="Phone number" error={errors.phone} hint="For order confirmations and customer support">
                                        <input
                                                type="tel"
                                                value={state.phone}
                                                onChange={(e) => update("phone", e.target.value)}
                                                placeholder="+91 98765 43210"
                                                className={inputClass(!!errors.phone)}
                                        />
                                </Field>
                        </div>

                        <div>
                                <StepHeader title="Restaurant photos" subtitle="Up to 4 photos shown in the 'Explore' tab of your customer menu." />
                                <div className="grid grid-cols-2 gap-3">
                                        {state.photos.map((p, i) => (
                                                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border group">
                                                        <Image src={p} alt={`Gallery ${i + 1}`} fill className="object-cover" />
                                                        <button
                                                                onClick={() => update("photos", state.photos.filter((_, idx) => idx !== i))}
                                                                className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                                <X className="h-4 w-4" />
                                                        </button>
                                                </div>
                                        ))}
                                        {state.photos.length < 4 && (
                                                <button
                                                        onClick={() => photoInput.current?.click()}
                                                        className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground"
                                                >
                                                        <span className="text-2xl">+</span>
                                                        <span className="text-xs">Add photo</span>
                                                </button>
                                        )}
                                </div>
                                <input ref={photoInput} type="file" accept="image/*" multiple className="hidden" onChange={(e) => onPickPhotos(e.target.files)} />
                                <p className="text-xs text-muted-foreground mt-3">{state.photos.length}/4 photos added</p>
                        </div>
                </div>
        );
}

/* ───────────────────────── Step 3: Theme ───────────────────────── */

function ThemeStep({ state, update }: { state: WizardState; update: <K extends keyof WizardState>(k: K, v: WizardState[K]) => void }) {
        const swatch = `hsl(${state.themeH} ${state.themeS}% ${state.themeL}%)`;
        return (
                <div className="grid lg:grid-cols-2 gap-6">
                        <div className="space-y-6">
                                <StepHeader title="Brand theme" subtitle="Pick a preset or fine-tune. Your customers' menu, KDS, and dashboard all follow this color." />

                                <div>
                                        <p className="text-sm font-semibold mb-3">Presets</p>
                                        <div className="grid grid-cols-5 gap-3">
                                                {THEME_PRESETS.map((p) => {
                                                        const active = state.themeH === p.h && state.themeS === p.s && state.themeL === p.l;
                                                        return (
                                                                <button
                                                                        key={p.name}
                                                                        onClick={() => {
                                                                                update("themeH", p.h);
                                                                                update("themeS", p.s);
                                                                                update("themeL", p.l);
                                                                        }}
                                                                        className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${active ? "border-primary bg-primary/5" : "border-transparent hover:border-border"}`}
                                                                >
                                                                        <span className="h-10 w-10 rounded-full shadow-sm" style={{ background: p.swatch }} />
                                                                        <span className="text-[10px] font-medium">{p.name}</span>
                                                                </button>
                                                        );
                                                })}
                                        </div>
                                </div>

                                <div className="space-y-4 pt-2">
                                        <Slider label="Hue" value={state.themeH} min={0} max={360} onChange={(v) => update("themeH", v)} />
                                        <Slider label="Saturation" value={state.themeS} min={0} max={100} onChange={(v) => update("themeS", v)} />
                                        <Slider label="Lightness" value={state.themeL} min={20} max={80} onChange={(v) => update("themeL", v)} />
                                </div>
                        </div>

                        {/* Live preview */}
                        <div>
                                <StepHeader title="Preview" subtitle="How your customer menu will look." />
                                <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                                        <div className="p-5" style={{ background: `linear-gradient(135deg, ${swatch}, ${swatch}88)` }}>
                                                <div className="flex items-center gap-3">
                                                        <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold">
                                                                {state.restaurantName.charAt(0).toUpperCase() || "R"}
                                                        </div>
                                                        <div>
                                                                <h3 className="font-bold text-white text-lg">{state.restaurantName || "Your restaurant"}</h3>
                                                                <p className="text-xs text-white/80">Now open</p>
                                                        </div>
                                                </div>
                                        </div>
                                        <div className="p-4 space-y-3">
                                                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                                                        <div>
                                                                <p className="font-semibold text-sm">Butter Chicken</p>
                                                                <p className="text-xs text-muted-foreground">Creamy tomato curry</p>
                                                        </div>
                                                        <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: swatch }}>
                                                                ₹320
                                                        </span>
                                                </div>
                                                <button className="w-full py-3 rounded-xl text-white font-semibold text-sm shadow-md" style={{ background: swatch }}>
                                                        Add to cart
                                                </button>
                                        </div>
                                </div>
                        </div>
                </div>
        );
}

/* ───────────────────────── Step 4: Menu ───────────────────────── */

function MenuStep({ state, update, errors }: { state: WizardState; update: <K extends keyof WizardState>(k: K, v: WizardState[K]) => void; errors: Record<string, string> }) {
        const [newCategory, setNewCategory] = useState("");

        const addMenuItem = () => {
                const item: MenuItemDraft = {
                        id: Math.random().toString(36).slice(2, 9),
                        name: "",
                        description: "",
                        price: "",
                        category: state.categories[0] || "main",
                        veg: "veg",
                        foodType: "",
                        station: "",
                        image: "",
                        taxPercent: "5",
                };
                update("menuItems", [...state.menuItems, item]);
        };

        const updateItem = (id: string, patch: Partial<MenuItemDraft>) => {
                update("menuItems", state.menuItems.map((i) => (i.id === id ? { ...i, ...patch } : i)));
        };
        const removeItem = (id: string) => update("menuItems", state.menuItems.filter((i) => i.id !== id));

        const addCategory = () => {
                const cat = newCategory.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                if (cat && !state.categories.includes(cat)) {
                        update("categories", [...state.categories, cat]);
                }
                setNewCategory("");
        };

        return (
                <div className="space-y-6">
                        <StepHeader title="Menu items" subtitle="Add your dishes now or skip and do it from the dashboard later. Each item can have a photo, spice level, and kitchen station." />

                        {/* Categories editor */}
                        <div className="rounded-xl border border-border bg-card p-4">
                                <p className="text-sm font-semibold mb-3">Categories ({state.categories.length})</p>
                                <div className="flex flex-wrap gap-2 mb-3">
                                        {state.categories.map((c) => (
                                                <span key={c} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                                                        {c}
                                                        <button onClick={() => update("categories", state.categories.filter((x) => x !== c))} className="hover:text-primary">
                                                                <X className="h-3 w-3" />
                                                        </button>
                                                </span>
                                        ))}
                                </div>
                                <div className="flex gap-2">
                                        <input
                                                type="text"
                                                value={newCategory}
                                                onChange={(e) => setNewCategory(e.target.value)}
                                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCategory())}
                                                placeholder="Add a category (e.g. pizzas)"
                                                className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                        <button onClick={addCategory} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
                                                Add
                                        </button>
                                </div>
                        </div>

                        {/* Menu items */}
                        <div className="space-y-3">
                                {state.menuItems.map((item) => (
                                        <MenuItemRow key={item.id} item={item} categories={state.categories} onChange={(p) => updateItem(item.id, p)} onRemove={() => removeItem(item.id)} error={errors[`menu-${item.id}`]} />
                                ))}
                        </div>

                        <button
                                onClick={addMenuItem}
                                className="w-full py-4 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors text-sm font-medium text-muted-foreground hover:text-primary"
                        >
                                + Add menu item
                        </button>

                        {state.menuItems.length === 0 && (
                                <p className="text-center text-xs text-muted-foreground">
                                        No items yet — you can add them later from <strong>Dashboard → Settings → Menu editor</strong>
                                </p>
                        )}
                </div>
        );
}

function MenuItemRow({ item, categories, onChange, onRemove, error }: { item: MenuItemDraft; categories: string[]; onChange: (p: Partial<MenuItemDraft>) => void; onRemove: () => void; error?: string }) {
        const imgInput = useRef<HTMLInputElement>(null);
        return (
                <div className={`rounded-xl border bg-card p-4 ${error ? "border-destructive" : "border-border"}`}>
                        <div className="flex items-start gap-4">
                                {/* Image picker */}
                                <button
                                        onClick={() => imgInput.current?.click()}
                                        className="h-20 w-20 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 flex items-center justify-center overflow-hidden flex-shrink-0"
                                >
                                        {item.image ? (
                                                <Image src={item.image} alt="Preview" width={80} height={80} className="h-full w-full object-cover" />
                                        ) : (
                                                <span className="text-xs text-muted-foreground">+ Photo</span>
                                        )}
                                </button>
                                <input ref={imgInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={async (e) => {
                                                        const f = e.target.files?.[0];
                                                        if (!f) return;
                                                        try {
                                                                onChange({ image: await fileToDataUrl(f) });
                                                        } catch (err) {
                                                                toast.error(err instanceof Error ? err.message : "Image upload failed");
                                                        } finally {
                                                                if (imgInput.current) imgInput.current.value = "";
                                                        }
                                                }} />

                                {/* Fields */}
                                <div className="flex-1 grid sm:grid-cols-2 gap-3">
                                        <div className="sm:col-span-2">
                                                <input
                                                        type="text"
                                                        value={item.name}
                                                        onChange={(e) => onChange({ name: e.target.value })}
                                                        placeholder="Item name (e.g. Butter Chicken)"
                                                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                                                />
                                        </div>
                                        <div className="sm:col-span-2">
                                                <input
                                                        type="text"
                                                        value={item.description}
                                                        onChange={(e) => onChange({ description: e.target.value })}
                                                        placeholder="Short description"
                                                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                                                />
                                        </div>
                                        <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                                                <input
                                                        type="number"
                                                        value={item.price}
                                                        onChange={(e) => onChange({ price: e.target.value })}
                                                        placeholder="Price"
                                                        step="0.01"
                                                        className="w-full pl-7 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                                />
                                        </div>
                                        <select value={item.category} onChange={(e) => onChange({ category: e.target.value })} className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                                                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <select value={item.veg} onChange={(e) => onChange({ veg: e.target.value as MenuItemDraft["veg"] })} className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                                                {VEG_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                        </select>
                                        <select value={item.foodType} onChange={(e) => onChange({ foodType: e.target.value as MenuItemDraft["foodType"] })} className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                                                {FOOD_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                        </select>
                                        <select value={item.station} onChange={(e) => onChange({ station: e.target.value as MenuItemDraft["station"] })} className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                                                {STATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                        </select>
                                        <input
                                                type="number"
                                                value={item.taxPercent}
                                                onChange={(e) => onChange({ taxPercent: e.target.value })}
                                                placeholder="Tax %"
                                                step="0.5"
                                                className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                </div>
                                <button onClick={onRemove} className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center flex-shrink-0">
                                        <X className="h-4 w-4" />
                                </button>
                        </div>
                        {error && <p className="text-xs text-destructive mt-2">{error}</p>}
                </div>
        );
}

/* ───────────────────────── Step 5: Tables ───────────────────────── */

function TablesStep({ state, update }: { state: WizardState; update: <K extends keyof WizardState>(k: K, v: WizardState[K]) => void }) {
        const sampleNames = useMemo(() => {
                return Array.from({ length: Math.min(state.tableCount, 6) }, (_, i) => `${state.tablePrefix || "T"}${i + 1}`);
        }, [state.tableCount, state.tablePrefix]);

        return (
                <div className="grid lg:grid-cols-2 gap-6">
                        <div className="space-y-6">
                                <StepHeader title="Tables & QR codes" subtitle="We'll generate a unique QR code for each table. Customers scan it to open your menu — no app needed." />

                                <Field label="Number of tables">
                                        <div className="flex items-center gap-3">
                                                <button onClick={() => update("tableCount", Math.max(1, state.tableCount - 1))} className="h-11 w-11 rounded-xl border border-border bg-card text-xl font-bold hover:bg-muted/50">−</button>
                                                <input
                                                        type="number"
                                                        min={1}
                                                        max={100}
                                                        value={state.tableCount}
                                                        onChange={(e) => update("tableCount", Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
                                                        className="w-20 text-center px-3 py-2 rounded-xl border border-border bg-card text-lg font-bold"
                                                />
                                                <button onClick={() => update("tableCount", Math.min(100, state.tableCount + 1))} className="h-11 w-11 rounded-xl border border-border bg-card text-xl font-bold hover:bg-muted/50">+</button>
                                        </div>
                                </Field>

                                <Field label="Table prefix" hint="Each table will be named [prefix][number], e.g. T1, T2, T3">
                                        <input
                                                type="text"
                                                value={state.tablePrefix}
                                                onChange={(e) => update("tablePrefix", e.target.value.slice(0, 3) || "T")}
                                                className="w-24 px-3 py-2 rounded-xl border border-border bg-card text-sm"
                                        />
                                </Field>

                                <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-sm">
                                        <p className="font-semibold text-primary mb-1">What happens next?</p>
                                        <p className="text-muted-foreground">
                                                After you launch, your dashboard's <strong>Settings → Tables</strong> tab will show every QR code ready to download or print. Place one on each table.
                                        </p>
                                </div>
                        </div>

                        {/* QR preview */}
                        <div>
                                <StepHeader title="Preview" subtitle={`First ${sampleNames.length} of ${state.tableCount} QR codes`} />
                                <div className="grid grid-cols-3 gap-3">
                                        {sampleNames.map((name, i) => (
                                                <div key={name} className="rounded-xl border border-border bg-card p-3 text-center">
                                                        <div className="aspect-square rounded-lg bg-white p-2 mb-2">
                                                                <div className="h-full w-full grid grid-cols-7 gap-px">
                                                                        {Array.from({ length: 49 }).map((_, px) => (
                                                                                <div key={px} className={`rounded-[1px] ${(i + px) % 3 === 0 ? "bg-black" : "bg-white"}`} />
                                                                        ))}
                                                                </div>
                                                        </div>
                                                        <p className="text-xs font-bold">{name}</p>
                                                </div>
                                        ))}
                                </div>
                                {state.tableCount > 6 && <p className="text-xs text-muted-foreground mt-3">+ {state.tableCount - 6} more will be generated</p>}
                        </div>
                </div>
        );
}

/* ───────────────────────── Step 6: Payments ───────────────────────── */

function PaymentsStep({ state, update, errors }: { state: WizardState; update: <K extends keyof WizardState>(k: K, v: WizardState[K]) => void; errors: Record<string, string> }) {
        return (
                <div className="grid lg:grid-cols-2 gap-6">
                        <div className="space-y-6">
                                <StepHeader title="Payments & tax" subtitle="How customers pay you. Razorpay & Stripe are pre-integrated — you just connect them later from Settings." />

                                <Field label="Currency" hint="Used across your menu, cart, invoices, and analytics">
                                        <select value={state.currency} onChange={(e) => update("currency", e.target.value as WizardState["currency"])} className={inputClass(false)}>
                                                {CURRENCY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                                        </select>
                                </Field>

                                <Field label="UPI ID" error={errors.upiId} hint="For UPI Autodebit and pay-at-table flow (optional)">
                                        <input
                                                type="text"
                                                value={state.upiId}
                                                onChange={(e) => update("upiId", e.target.value)}
                                                placeholder="restaurant@upi"
                                                className={inputClass(!!errors.upiId)}
                                        />
                                </Field>

                                <Field label="GSTIN" error={errors.gstNumber} hint="Appears on every invoice. Leave blank if not registered.">
                                        <input
                                                type="text"
                                                value={state.gstNumber}
                                                onChange={(e) => update("gstNumber", e.target.value.toUpperCase())}
                                                placeholder="27ABCDE1234F1Z5"
                                                maxLength={15}
                                                className={inputClass(!!errors.gstNumber)}
                                        />
                                </Field>

                                <label className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card cursor-pointer hover:bg-muted/30">
                                                <input
                                                        type="checkbox"
                                                        checked={state.gstInclusive}
                                                        onChange={(e) => update("gstInclusive", e.target.checked)}
                                                        className="h-5 w-5 rounded mt-0.5 accent-primary"
                                                />
                                                <div>
                                                        <p className="text-sm font-semibold">Prices are GST-inclusive</p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">If on, menu prices already include tax. If off, GST is added at checkout.</p>
                                                </div>
                                </label>
                        </div>

                        <div>
                                <StepHeader title="Payment methods enabled" subtitle="All of these work out of the box once you connect your accounts." />
                                <div className="space-y-3">
                                        {[
                                                { name: "Razorpay", desc: "UPI, cards, netbanking, wallets (India)", icon: "💳" },
                                                { name: "Stripe", desc: "International cards, Apple Pay, Google Pay", icon: "🌍" },
                                                { name: "UPI Autodebit", desc: "Recurring payments for loyalty members", icon: "🔁" },
                                                { name: "Pay at table", desc: "Cash or card directly to staff", icon: "💵" },
                                                { name: "Split payments", desc: "Multiple methods per bill", icon: "➗" },
                                        ].map((m) => (
                                                <div key={m.name} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                                                        <span className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-lg">{m.icon}</span>
                                                        <div className="flex-1">
                                                                <p className="text-sm font-semibold">{m.name}</p>
                                                                <p className="text-xs text-muted-foreground">{m.desc}</p>
                                                        </div>
                                                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>
                                                </div>
                                        ))}
                                </div>
                        </div>
                </div>
        );
}

/* ───────────────────────── Step 7: Account ───────────────────────── */

function AccountStep({ state, update, errors }: { state: WizardState; update: <K extends keyof WizardState>(k: K, v: WizardState[K]) => void; errors: Record<string, string> }) {
        const [showPwd, setShowPwd] = useState(false);
        const strength = passwordStrength(state.password);

        return (
                <div className="grid lg:grid-cols-2 gap-6">
                        <div className="space-y-6">
                                <StepHeader title="Admin account" subtitle="This is your owner login for the dashboard." />

                                <Field label="Email" required error={errors.email}>
                                        <input
                                                type="email"
                                                value={state.email}
                                                onChange={(e) => update("email", e.target.value)}
                                                placeholder="owner@yourrestaurant.com"
                                                className={inputClass(!!errors.email)}
                                        />
                                </Field>

                                <Field label="Password" required error={errors.password}>
                                        <div className="relative">
                                                <input
                                                        type={showPwd ? "text" : "password"}
                                                        value={state.password}
                                                        onChange={(e) => update("password", e.target.value)}
                                                        placeholder="Min 6 characters"
                                                        className={inputClass(!!errors.password)}
                                                />
                                                <button
                                                        type="button"
                                                        onClick={() => setShowPwd(!showPwd)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                                                >
                                                        {showPwd ? "Hide" : "Show"}
                                                </button>
                                        </div>
                                        {state.password && (
                                                <div className="mt-2">
                                                        <div className="flex gap-1">
                                                                {[0, 1, 2, 3].map((i) => (
                                                                        <div key={i} className={`h-1 flex-1 rounded-full ${i <= strength.score ? strength.color : "bg-muted"}`} />
                                                                ))}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-1">Strength: {strength.label}</p>
                                                </div>
                                        )}
                                </Field>

                                <Field label="Confirm password" required error={errors.passwordConfirm}>
                                        <input
                                                type={showPwd ? "text" : "password"}
                                                value={state.passwordConfirm}
                                                onChange={(e) => update("passwordConfirm", e.target.value)}
                                                placeholder="Re-enter password"
                                                className={inputClass(!!errors.passwordConfirm)}
                                        />
                                </Field>
                        </div>

                        <div className="space-y-6">
                                <StepHeader title="Kitchen login (optional)" subtitle="Set a separate password for kitchen staff to access the Kitchen Display only." />

                                <Field label="Kitchen password" hint="If empty, kitchen login is disabled for now (you can set it later)">
                                        <input
                                                type="text"
                                                value={state.kitchenPassword}
                                                onChange={(e) => update("kitchenPassword", e.target.value)}
                                                placeholder="Min 4 characters"
                                                className={inputClass(false)}
                                        />
                                </Field>

                                <div className="rounded-xl border border-border bg-card p-4 space-y-3 text-sm">
                                        <p className="font-semibold">Two roles, one account</p>
                                        <div className="flex items-start gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">A</div>
                                                <div>
                                                        <p className="font-medium">Admin (you)</p>
                                                        <p className="text-xs text-muted-foreground">Full access — orders, menu, analytics, settings, payouts</p>
                                                </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold text-xs flex-shrink-0">K</div>
                                                <div>
                                                        <p className="font-medium">Kitchen staff</p>
                                                        <p className="text-xs text-muted-foreground">Only sees the Kitchen Display — no analytics or payouts</p>
                                                </div>
                                        </div>
                                </div>
                        </div>
                </div>
        );
}

/* ───────────────────────── Step 8: AI Keys ───────────────────────── */

function AIKeysStep({ state, update }: { state: WizardState; update: <K extends keyof WizardState>(k: K, v: WizardState[K]) => void }) {
        const providers = [
                { key: "aiGroq" as const, name: "Groq", desc: "Fastest — Llama 3.1 70B", placeholder: "gsk_...", url: "console.groq.com/keys" },
                { key: "aiCerebras" as const, name: "Cerebras", desc: "Llama 3.1, ultra-low latency", placeholder: "csk-...", url: "cloud.cerebras.ai" },
                { key: "aiGoogle" as const, name: "Gemini", desc: "Google Gemini 1.5 Flash", placeholder: "AIza...", url: "aistudio.google.com" },
                { key: "aiSiliconFlow" as const, name: "SiliconFlow", desc: "Multi-model marketplace", placeholder: "sk-...", url: "siliconflow.cn" },
                { key: "aiHuggingFace" as const, name: "HuggingFace", desc: "Fallback when others rate-limit", placeholder: "hf_...", url: "huggingface.co/settings/tokens" },
        ];

        return (
                <div className="space-y-6">
                        <StepHeader title="AI provider keys (optional)" subtitle="Bring your own keys for the Jarvis AI assistant. If you skip this, we use our shared pool — just slower at peak times." />

                        <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-sm">
                                <p className="font-semibold text-primary mb-1">Multi-provider failover</p>
                                <p className="text-muted-foreground">
                                        We try Groq first → Cerebras → Gemini → SiliconFlow → HuggingFace. If one is down or rate-limited, the next takes over automatically. Keys are AES-256-GCM encrypted at rest.
                                </p>
                        </div>

                        <div className="space-y-3">
                                {providers.map((p) => (
                                        <div key={p.key} className="rounded-xl border border-border bg-card p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                        <div>
                                                                <p className="font-semibold text-sm">{p.name}</p>
                                                                <p className="text-xs text-muted-foreground">{p.desc}</p>
                                                        </div>
                                                        <a href={`https://${p.url}`} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                                                                Get key →
                                                        </a>
                                                </div>
                                                <input
                                                        type="password"
                                                        value={state[p.key]}
                                                        onChange={(e) => update(p.key, e.target.value)}
                                                        placeholder={p.placeholder}
                                                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                                                />
                                        </div>
                                ))}
                        </div>

                        <p className="text-center text-xs text-muted-foreground">
                                You can leave all of these blank and add them later from <strong>Settings → AI Keys</strong>
                        </p>
                </div>
        );
}

/* ───────────────────────── Step 9: Review ───────────────────────── */

function ReviewStep({ state }: { state: WizardState }) {
        const stats = [
                { label: "Menu items", value: state.menuItems.length },
                { label: "Tables", value: state.tableCount },
                { label: "Categories", value: state.categories.length },
                { label: "Photos", value: state.photos.length + (state.cover ? 1 : 0) + (state.logoUrl ? 1 : 0) },
        ];

        return (
                <div className="space-y-6">
                        <StepHeader title="Ready to launch" subtitle="Here's everything you're about to create. Click 'Launch' and your restaurant goes live in under 30 seconds." />

                        {/* Hero card */}
                        <div className="rounded-2xl overflow-hidden border border-border bg-card">
                                <div className="aspect-[3/1] bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 relative">
                                        {state.cover ? <Image src={state.cover} alt="Cover" fill className="object-cover" /> : null}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                        <div className="absolute bottom-4 left-4 right-4 flex items-end gap-3">
                                                <div className="h-16 w-16 rounded-2xl border-4 border-card bg-card overflow-hidden shadow-lg">
                                                        {state.logoUrl ? (
                                                                <Image src={state.logoUrl} alt="Logo" width={64} height={64} className="h-full w-full object-cover" />
                                                        ) : (
                                                                <div className="h-full w-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
                                                                        {state.restaurantName.charAt(0).toUpperCase() || "?"}
                                                                </div>
                                                        )}
                                                </div>
                                                <div className="text-white">
                                                        <h2 className="text-xl font-black">{state.restaurantName || "Your restaurant"}</h2>
                                                        <p className="text-xs opacity-80">orderworder.com/{state.restaurantID || "..."}</p>
                                                </div>
                                        </div>
                                </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {stats.map((s) => (
                                        <div key={s.label} className="rounded-xl border border-border bg-card p-4 text-center">
                                                <div className="text-2xl font-black text-primary">{s.value}</div>
                                                <div className="text-xs text-muted-foreground">{s.label}</div>
                                        </div>
                                ))}
                        </div>

                        {/* Detail list */}
                        <div className="grid sm:grid-cols-2 gap-3">
                                <ReviewItem label="Description" value={state.description || "—"} />
                                <ReviewItem label="Address" value={state.address || "—"} />
                                <ReviewItem label="Phone" value={state.phone || "—"} />
                                <ReviewItem label="Theme" value={`HSL ${state.themeH}° ${state.themeS}% ${state.themeL}%`} swatch={`hsl(${state.themeH} ${state.themeS}% ${state.themeL}%)`} />
                                <ReviewItem label="Currency" value={state.currency} />
                                <ReviewItem label="GSTIN" value={state.gstNumber || "—"} />
                                <ReviewItem label="Admin email" value={state.email || "—"} />
                                <ReviewItem label="AI providers" value={[state.aiGroq && "Groq", state.aiCerebras && "Cerebras", state.aiGoogle && "Gemini", state.aiSiliconFlow && "SiliconFlow", state.aiHuggingFace && "HuggingFace"].filter(Boolean).join(", ") || "Using shared pool"} />
                        </div>

                        {/* What happens next */}
                        <div className="rounded-xl border border-border bg-muted/30 p-5">
                                <p className="font-semibold mb-3">After you click Launch:</p>
                                <ol className="space-y-2 text-sm text-muted-foreground">
                                        {[
                                                "We create your account, profile, theme, and AI config",
                                                "We add your menu items and generate table QR codes",
                                                "You land on your dashboard — Settings → Tables shows every QR ready to print",
                                                "Customers scan any QR code and your menu opens in under 2 seconds",
                                        ].map((s, i) => (
                                                <li key={i} className="flex gap-3">
                                                        <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                                                        {s}
                                                </li>
                                        ))}
                                </ol>
                        </div>
                </div>
        );
}

/* ───────────────────────── Reusable bits ───────────────────────── */

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
        return (
                <div>
                        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
                        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
                </div>
        );
}

function Field({ label, children, error, hint, required }: { label: string; children: React.ReactNode; error?: string; hint?: string; required?: boolean }) {
        return (
                <div>
                        <label className="block text-sm font-semibold mb-1.5">
                                {label} {required && <span className="text-destructive">*</span>}
                        </label>
                        {children}
                        {error ? (
                                <p className="text-xs text-destructive mt-1">{error}</p>
                        ) : hint ? (
                                <p className="text-xs text-muted-foreground mt-1">{hint}</p>
                        ) : null}
                </div>
        );
}

function ImageUpload({ label, value, onPick, inputRef, aspect, hint }: { label: string; value: string; onPick: (d: string) => void; inputRef: React.RefObject<HTMLInputElement | null>; aspect: string; hint?: string }) {
        const [err, setErr] = useState<string | null>(null);
        return (
                <div>
                        <label className="block text-sm font-semibold mb-1.5">{label}</label>
                        <button
                                type="button"
                                onClick={() => inputRef.current?.click()}
                                aria-label={`Upload ${label}`}
                                className={`relative w-full ${aspect} rounded-xl border-2 border-dashed ${err ? "border-destructive" : "border-border"} hover:border-primary hover:bg-primary/5 transition-colors flex items-center justify-center overflow-hidden`}>
                                {value ? (
                                        <Image src={value} alt={label} fill className="object-cover" />
                                ) : (
                                        <div className="text-center text-muted-foreground text-xs px-4">
                                                <div className="text-2xl mb-1">+</div>
                                                Click to upload
                                        </div>
                                )}
                        </button>
                        {err && <p className="text-xs text-destructive mt-1">{err}</p>}
                        {hint && !err && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
                        <input
                                ref={inputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                className="hidden"
                                onChange={async (e) => {
                                        const f = e.target.files?.[0];
                                        if (!f) return;
                                        setErr(null);
                                        try {
                                                const dataUrl = await fileToDataUrl(f);
                                                onPick(dataUrl);
                                        } catch (uploadErr) {
                                                setErr(uploadErr instanceof Error ? uploadErr.message : "Upload failed");
                                        } finally {
                                                if (inputRef.current) inputRef.current.value = "";
                                        }
                                }}
                        />
                </div>
        );
}

function Slider({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
        return (
                <div>
                        <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium">{label}</span>
                                <span className="text-muted-foreground tabular-nums">{value}</span>
                        </div>
                        <input
                                type="range"
                                min={min}
                                max={max}
                                value={value}
                                onChange={(e) => onChange(Number(e.target.value))}
                                className="w-full accent-primary"
                        />
                </div>
        );
}

function ReviewItem({ label, value, swatch }: { label: string; value: string; swatch?: string }) {
        return (
                <div className="rounded-xl border border-border bg-card p-3">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">{label}</p>
                        <div className="flex items-center gap-2">
                                {swatch && <span className="h-4 w-4 rounded-full border border-border" style={{ background: swatch }} />}
                                <p className="text-sm font-medium truncate">{value}</p>
                        </div>
                </div>
        );
}

function inputClass(hasError: boolean): string {
        return `w-full px-4 py-2.5 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${hasError ? "border-destructive" : "border-border"}`;
}

/* ───────────────────────── Success Screen ───────────────────────── */

function SuccessScreen({
        success,
        restaurantName,
        onEnterDashboard,
}: {
        success: { qrCodes: Array<{ name: string; qr: string }>; restaurantUrl: string };
        restaurantName: string;
        onEnterDashboard: () => void;
}) {
        const printAll = () => {
                const w = window.open("", "_blank", "width=800,height=900");
                if (!w) return;
                const items = success.qrCodes
                        .map((t) => `<div class="qr-card"><img src="${t.qr}" alt="${t.name}" /><div class="name">${t.name}</div></div>`)
                        .join("");
                w.document.write(`<html><head><title>${restaurantName} — Table QR codes</title>
                        <style>
                                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; background: #f7f7f7; margin: 0; }
                                h1 { font-size: 20px; text-align: center; margin: 0 0 8px 0; color: #111; }
                                .sub { text-align: center; font-size: 12px; color: #666; margin-bottom: 24px; }
                                .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; max-width: 700px; margin: 0 auto; }
                                .qr-card { background: white; border: 1px solid #e5e5e5; border-radius: 12px; padding: 16px; text-align: center; page-break-inside: avoid; }
                                .qr-card img { width: 200px; height: 200px; object-fit: contain; }
                                .qr-card .name { font-size: 18px; font-weight: 700; margin-top: 8px; color: #111; }
                                .brand { text-align: center; font-size: 11px; color: #999; margin-top: 32px; }
                                @media print { body { background: white; padding: 0; } }
                        </style></head>
                        <body><h1>${restaurantName}</h1><div class="sub">Scan to view menu & place order</div><div class="grid">${items}</div>
                        <div class="brand">Powered by OrderWorder</div></body></html>`);
                w.document.close();
                setTimeout(() => w.print(), 250);
        };

        return (
                <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
                        <div className="text-center mb-10">
                                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                                        <PartyPopper className="h-10 w-10 text-emerald-600" />
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
                                        {restaurantName} is <span className="text-emerald-600">live!</span>
                                </h1>
                                <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                                        Your restaurant is ready. Print the QR codes below, place one on each table, and you're open for business.
                                </p>
                                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-xs">
                                        <span className="text-muted-foreground">Your menu:</span>
                                        <a href={success.restaurantUrl} target="_blank" rel="noopener noreferrer" className="font-mono font-semibold text-primary hover:underline">
                                                {success.restaurantUrl.replace(/^https?:\/\//, "")}
                                        </a>
                                </div>
                        </div>

                        {/* QR grid */}
                        {success.qrCodes.length > 0 && (
                                <div className="mb-8">
                                        <div className="flex items-center justify-between mb-4">
                                                <h2 className="text-base font-semibold">Your table QR codes ({success.qrCodes.length})</h2>
                                                <button
                                                        onClick={printAll}
                                                        className="inline-flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-medium border border-border bg-card hover:bg-muted/50 transition-colors">
                                                        <Printer className="h-4 w-4" />
                                                        Print all
                                                </button>
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
                                                {success.qrCodes.map((t) => (
                                                        <div key={t.name} className="rounded-2xl border bg-white p-4 text-center">
                                                                <Image src={t.qr} alt={`QR for ${t.name}`} width={160} height={160} className="h-32 w-32 mx-auto" unoptimized />
                                                                <p className="mt-2 text-sm font-bold">{t.name}</p>
                                                        </div>
                                                ))}
                                        </div>
                                </div>
                        )}

                        {/* What's next */}
                        <div className="rounded-2xl border border-border bg-card p-6 mb-8">
                                <h3 className="font-semibold mb-3">What's next?</h3>
                                <ol className="space-y-2 text-sm text-muted-foreground">
                                        <li><span className="font-semibold text-foreground">1.</span> Print the QR codes and place one on each table.</li>
                                        <li><span className="font-semibold text-foreground">2.</span> Open your dashboard to add more menu items, edit prices, or change your theme.</li>
                                        <li><span className="font-semibold text-foreground">3.</span> Scan a QR code with your phone to test the customer flow end-to-end.</li>
                                        <li><span className="font-semibold text-foreground">4.</span> The kitchen display at <span className="font-mono">/kitchen</span> shows live orders — bookmark it on a tablet.</li>
                                </ol>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <button
                                        onClick={onEnterDashboard}
                                        className="inline-flex items-center justify-center gap-2 px-6 h-12 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all">
                                        Enter your dashboard
                                        <ArrowRight className="h-4 w-4" />
                                </button>
                                <button
                                        onClick={printAll}
                                        className="inline-flex items-center justify-center gap-2 px-6 h-12 rounded-xl text-sm font-medium border border-border bg-card hover:bg-muted/50 transition-colors">
                                        <Printer className="h-4 w-4" />
                                        Print QR codes now
                                </button>
                        </div>
                </motion.div>
        );
}
