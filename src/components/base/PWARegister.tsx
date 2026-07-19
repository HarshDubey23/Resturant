"use client";

import { useEffect } from "react";

export default function PWARegister() {
	useEffect(() => {
		if ("serviceWorker" in navigator) {
			navigator.serviceWorker.register("/sw.js").catch(() => {
				/* service worker registration failed */
			});
		}
	}, []);

	return null;
}
