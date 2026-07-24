"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import { type ChangeEvent, useState } from "react";
import { toast } from "sonner";
import { captureError } from "#utils/helper/sentryWrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PasswordSettings() {
	const [loading, setLoading] = useState(false);
	const [passwordShake, setPasswordShake] = useState(false);
	const [confPasswordShake, setConfPasswordShake] = useState(false);
	const [authenticated, setAuthenticated] = useState(false);
	const [password, setPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [newConfPassword, setNewConfPassword] = useState("");
	const [showPasswords, setShowPasswords] = useState(false);

	const onClear = () => {
		setAuthenticated(false);
		setPassword("");
		setNewPassword("");
		setNewConfPassword("");
	};

	const onSave = async () => {
		if (!authenticated) {
			toast.error("Failed to change password");
			return onClear();
		}
		if (!newPassword) return toast.warning("New password is required");
		if (!newConfPassword) return toast.warning("Confirm new password is required");
		if (newPassword !== newConfPassword) {
			setConfPasswordShake(true);
			setTimeout(() => setConfPasswordShake(false), 600);
			return toast.warning("New and Confirm password should match");
		}

		setLoading(true);
		try {
			// FIX (audit F1): wrap the network call in try/catch/finally so a
			// thrown fetch (offline, DNS failure, aborted request) is surfaced
			// via toast and the loading spinner is always cleared. Previously
			// a network throw skipped setLoading(false), leaving the button
			// in its loading state forever.
			const req = await fetch("/api/admin/password/change", {
				method: "POST",
				body: JSON.stringify({ password, newPassword }),
			});
			const res = await req.json();
			if (res?.status === 200) toast.success(res?.message);
			else toast.error(res?.message);
		} catch (err) {
			captureError(err, { route: "/dashboard/settings/password", context: "change" });
			toast.error("Network error — could not change password. Please retry.");
		} finally {
			setAuthenticated(false);
			setPassword("");
			setNewPassword("");
			setNewConfPassword("");
			setLoading(false);
		}
	};

	const onPasswordKeyPress = async () => {
		if (!authenticated) {
			setLoading(true);
			try {
				// FIX (audit F1): same try/catch/finally guard as onSave — a
				// network throw must not strand the button in its loading state.
				const req = await fetch("/api/admin/password/check", {
					method: "POST",
					body: JSON.stringify({ password }),
				});
				const res = await req.json();
				if (res?.status === 200) setAuthenticated(true);
				else {
					setPasswordShake(true);
					setTimeout(() => setPasswordShake(false), 600);
					toast.error(res?.message);
				}
			} catch (err) {
				captureError(err, { route: "/dashboard/settings/password", context: "check" });
				toast.error("Network error — could not verify password. Please retry.");
			} finally {
				setLoading(false);
			}
		}
	};

	const onNewPasswordKeyPress = () => {
		if (authenticated) onSave();
	};

	const toggleShow = () => setShowPasswords((v) => !v);

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="text-base">
					Change <span className="text-muted-foreground">Password</span>
				</CardTitle>
				{authenticated && (
					<div className="flex items-center gap-2">
						<Button variant="outline" size="sm" disabled={loading} onClick={onClear}>
							Clear
						</Button>
						<Button size="sm" loading={loading} onClick={onSave}>
							Change
						</Button>
					</div>
				)}
			</CardHeader>
			<CardContent>
				{loading ? (
					<div className="flex items-center justify-center py-8">
						<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
						<span className="ml-2 text-sm text-muted-foreground">{authenticated ? "Saving..." : "Authenticating..."}</span>
					</div>
				) : !authenticated ? (
					<div className="space-y-2">
						<Label htmlFor="current-password">Current Password</Label>
						<div className="relative">
							<Input
								id="current-password"
								type={showPasswords ? "text" : "password"}
								placeholder="Enter your password"
								value={password}
								onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && onPasswordKeyPress()}
								className={passwordShake ? "animate-shake" : ""}
							/>
							<button type="button" onClick={toggleShow} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
								{showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
							</button>
						</div>
					</div>
				) : (
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="new-password">New Password</Label>
							<div className="relative">
								<Input
									id="new-password"
									type={showPasswords ? "text" : "password"}
									placeholder="Enter new password"
									value={newPassword}
									onChange={(e: ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && onNewPasswordKeyPress()}
									className={passwordShake ? "animate-shake" : ""}
								/>
								<button
									type="button"
									onClick={toggleShow}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
									{showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
								</button>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="confirm-password">Confirm Password</Label>
							<div className="relative">
								<Input
									id="confirm-password"
									type={showPasswords ? "text" : "password"}
									placeholder="Enter confirm password"
									value={newConfPassword}
									onChange={(e: ChangeEvent<HTMLInputElement>) => setNewConfPassword(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && onNewPasswordKeyPress()}
									className={confPasswordShake ? "animate-shake" : ""}
								/>
								<button
									type="button"
									onClick={toggleShow}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
									{showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
								</button>
							</div>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
