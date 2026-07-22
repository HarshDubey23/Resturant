"use client";

import { ArrowRight, LogIn } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { usePathname, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import type { ChangeEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const mobilePattern = /^(\+91[-\s]?)?[6-9]\d{9}$/;

interface UserLoginProps {
	setOpen: (open: boolean) => void;
}

export default function UserLogin({ setOpen }: UserLoginProps) {
	const pathname = usePathname();
	const params = useSearchParams();
	const [page, setPage] = useState<"phone" | "details">("phone");
	const [busy, setBusy] = useState(false);
	const [phone, setPhone] = useState("");
	const [fname, setFName] = useState("");
	const [lname, setLName] = useState("");

	const phoneNumber = `+91${phone}`;

	const onNext = async () => {
		if (page === "phone") {
			if (!mobilePattern.test(phoneNumber)) {
				return toast.error("Please enter a valid phone number");
			}
			setBusy(true);
			setTimeout(() => {
				setBusy(false);
				setPage("details");
			}, 300);
			return;
		}

		if (!params.get("table")) {
			return toast.error("Please scan the QR Code");
		}

		setBusy(true);
		const res = await signIn("customer", {
			redirect: false,
			restaurant: pathname.replaceAll("/", ""),
			phone: phoneNumber,
			fname,
			lname,
			table: params.get("table"),
			callbackUrl: `${window.location.origin}`,
		});

		if (res?.error) {
			toast.error(res.error);
		}
		setOpen(false);
		setBusy(false);
	};

	return (
		<div className="space-y-6 py-4">
			<div className="text-center">
				<h2 className="text-lg font-semibold">
					{page === "phone" ? (
						<>
							Let&apos;s <span className="text-primary">start ordering</span>
						</>
					) : (
						<>
							Glad to <span className="text-primary">see you here</span>
						</>
					)}
				</h2>
				<p className="text-sm text-muted-foreground mt-1">{page === "phone" ? "Enter your phone number to continue" : "Tell us your name"}</p>
			</div>

			<AnimatePresence mode="wait">
				{page === "phone" ? (
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
									onKeyDown={(e) => e.key === "Enter" && onNext()}
									className="flex-1"
								/>
							</div>
						</div>
						<Button className="w-full" onClick={onNext} loading={busy}>
							Next
							<ArrowRight className="ml-2 h-4 w-4" />
						</Button>
					</motion.div>
				) : (
					<motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="login-fname">First Name</Label>
							<Input id="login-fname" placeholder="John" value={fname} onChange={(e: ChangeEvent<HTMLInputElement>) => setFName(e.target.value)} />
						</div>
						<div className="space-y-2">
							<Label htmlFor="login-lname">Last Name</Label>
							<Input
								id="login-lname"
								placeholder="Doe"
								value={lname}
								onChange={(e: ChangeEvent<HTMLInputElement>) => setLName(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && onNext()}
							/>
						</div>
						<div className="flex gap-2">
							<Button variant="outline" className="flex-1" onClick={() => setPage("phone")}>
								Back
							</Button>
							<Button className="flex-1" onClick={onNext} loading={busy}>
								<LogIn className="mr-2 h-4 w-4" />
								Order
							</Button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
