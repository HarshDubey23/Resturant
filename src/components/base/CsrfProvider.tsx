"use client";

import { useEffect } from "react";

function getCsrfToken(): string | undefined {
	if (typeof document === "undefined") return undefined;
	const match = document.cookie.match(/(?:^|; )csrf-token=([^;]+)/);
	return match ? decodeURIComponent(match[1]) : undefined;
}

function isSameOrigin(input: RequestInfo | URL): boolean {
	if (typeof input === "string") {
		return input.startsWith("/") && !input.startsWith("//");
	}
	if (input instanceof URL) {
		return input.origin === window.location.origin;
	}
	return input.url.startsWith(window.location.origin);
}

export default function CsrfProvider() {
	useEffect(() => {
		const originalFetch = window.fetch;
		window.fetch = async (input, init) => {
			const method = (init?.method ?? "GET").toUpperCase();
			const safeMethods = ["GET", "HEAD", "OPTIONS"];
			if (!safeMethods.includes(method) && isSameOrigin(input)) {
				const token = getCsrfToken();
				if (token) {
					const headers = new Headers(init?.headers);
					headers.set("X-CSRF-Token", token);
					init = { ...init, headers };
				}
			}
			return originalFetch(input, init);
		};
		return () => {
			window.fetch = originalFetch;
		};
	}, []);

	return null;
}
