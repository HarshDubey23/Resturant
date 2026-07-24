"use client";

/**
 * @file ShiftOpen — modal that opens a new cashier shift.
 * @phase 2
 * @audit-finding n/a
 *
 * Requires the cashier to enter opening cash (> 0) before the cashier screen
 * unlocks. On success, the parent CashierBilling component receives the new
 * shift via `onOpened` and unlocks the screen.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Wallet } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const shiftOpenSchema = z.object({
	openingCash: z
		.number({ invalid_type_error: "Enter a numeric amount" })
		.min(0.01, "Opening cash must be greater than 0"),
});
type ShiftOpenValues = z.infer<typeof shiftOpenSchema>;

export interface ShiftOpenProps {
	/** When true, the dialog is shown (no shift open). */
	open: boolean;
	/** Called after a successful open — parent refetches shift + unlocks. */
	onOpened: (shift: unknown) => void;
	/** Allow the cashier to dismiss the modal (only used in non-forced context). */
	onCancel?: () => void;
	/** Whether dismissal is allowed (defaults to false — shift-open is mandatory). */
	dismissable?: boolean;
}

export default function ShiftOpen({ open, onOpened, onCancel, dismissable = false }: ShiftOpenProps) {
	const [submitting, setSubmitting] = useState(false);
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<ShiftOpenValues>({
		resolver: zodResolver(shiftOpenSchema),
		defaultValues: { openingCash: 0 },
	});

	const onSubmit = async (values: ShiftOpenValues) => {
		setSubmitting(true);
		try {
			const res = await fetch("/api/cashier/shift/open", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ openingCash: values.openingCash }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data?.message ?? "Failed to open shift");
			toast.success("Shift opened");
			reset({ openingCash: 0 });
			onOpened(data.shift);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to open shift");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (!next && dismissable) onCancel?.();
			}}>
			<DialogContent showCloseButton={dismissable} className="sm:max-w-md">
				<DialogHeader>
					<div className="flex items-center gap-2">
						<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600/10 text-violet-600">
							<Lock className="h-4 w-4" />
						</div>
						<div>
							<DialogTitle>Open Cashier Shift</DialogTitle>
							<DialogDescription>Enter the opening cash float to unlock billing.</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="openingCash">Opening Cash</Label>
						<div className="relative">
							<Wallet className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								id="openingCash"
								type="number"
								step="0.01"
								min="0"
								placeholder="0.00"
								className="pl-9"
								aria-invalid={!!errors.openingCash}
								{...register("openingCash", { valueAsNumber: true })}
							/>
						</div>
						{errors.openingCash && <p className="text-xs text-destructive">{errors.openingCash.message}</p>}
					</div>

					<motion.div whileHover={{ scale: submitting ? 1 : 1.01 }} whileTap={{ scale: submitting ? 1 : 0.99 }}>
						<Button type="submit" loading={submitting} className="w-full" size="lg">
							Open Shift
						</Button>
					</motion.div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
