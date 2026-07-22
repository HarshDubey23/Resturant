export type WebGLTier = "r3f" | "model-viewer" | "parallax";

export function getWebGLTier(): WebGLTier {
	if (typeof window === "undefined") return "parallax";

	const canvas = document.createElement("canvas");
	const gl2 = canvas.getContext("webgl2");
	if (gl2) return "r3f";

	const gl1 = canvas.getContext("webgl");
	if (gl1) return "model-viewer";

	return "parallax";
}

export function getStoredWebGLTier(): WebGLTier {
	if (typeof window === "undefined") return "parallax";
	try {
		const raw = localStorage.getItem("webgl-tier");
		if (raw === "r3f" || raw === "model-viewer" || raw === "parallax") return raw;
	} catch {}
	const tier = getWebGLTier();
	try {
		localStorage.setItem("webgl-tier", tier);
	} catch {}
	return tier;
}
