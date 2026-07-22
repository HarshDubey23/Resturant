"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
	prompt(): Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWARegister() {
	const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
	const [showBanner, setShowBanner] = useState(false);

	useEffect(() => {
		if ("serviceWorker" in navigator) {
			navigator.serviceWorker.register("/sw.js").catch(() => {
				/* service worker registration failed */
			});
		}

		const onBeforeInstall = (e: Event) => {
			e.preventDefault();
			setInstallPrompt(e as BeforeInstallPromptEvent);
		};

		const visits = Number.parseInt(localStorage.getItem("ow-visits") || "0", 10);
		localStorage.setItem("ow-visits", String(visits + 1));

		window.addEventListener("beforeinstallprompt", onBeforeInstall);

		if (visits + 1 >= 3 && !localStorage.getItem("ow-install-dismissed") && !window.matchMedia("(display-mode: standalone)").matches) {
			const timer = setTimeout(() => setShowBanner(true), 2000);
			return () => {
				window.removeEventListener("beforeinstallprompt", onBeforeInstall);
				clearTimeout(timer);
			};
		}

		return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
	}, []);

	const handleInstall = async () => {
		if (!installPrompt) return;
		installPrompt.prompt();
		const choice = await installPrompt.userChoice;
		if (choice.outcome === "accepted") {
			setShowBanner(false);
		}
		setInstallPrompt(null);
	};

	const dismiss = () => {
		localStorage.setItem("ow-install-dismissed", "true");
		setShowBanner(false);
	};

	if (!showBanner) return null;

	return (
		<div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:hidden">
			<div className="mx-auto max-w-md rounded-xl border bg-background/95 p-4 shadow-lg backdrop-blur">
				<div className="flex items-center justify-between gap-4">
					<div className="space-y-1">
						<p className="text-sm font-medium">Install OrderWorder</p>
						<p className="text-xs text-muted-foreground">Get offline access and faster ordering.</p>
					</div>
					<div className="flex items-center gap-2">
						<Button size="sm" variant="ghost" onClick={dismiss}>
							Dismiss
						</Button>
						<Button size="sm" onClick={handleInstall}>
							Install
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
