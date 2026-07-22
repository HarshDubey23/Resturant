import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// output: "standalone", // disabled for preview — enables `next start`
	// Keep Three.js / React Three Fiber out of the server bundle — they are
	// only ever used by the lazily-imported 3D viewer on the client.
	serverExternalPackages: ["three", "@react-three/fiber", "@react-three/drei", "@google/model-viewer"],
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{
						key: "X-Robots-Tag",
						value: "index, follow",
					},
					{
						key: "X-Frame-Options",
						value: "DENY",
					},
					{
						key: "X-Content-Type-Options",
						value: "nosniff",
					},
					{
						key: "Referrer-Policy",
						value: "strict-origin-when-cross-origin",
					},
					{
						key: "Strict-Transport-Security",
						value: "max-age=63072000; includeSubDomains; preload",
					},
				],
			},
		];
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "*.githubusercontent.com",
			},
			{
				protocol: "https",
				hostname: "**.googleusercontent.com",
			},
			{
				protocol: "https",
				hostname: "**.zmtcdn.com",
			},
			{
				protocol: "https",
				hostname: "**.r2.dev",
			},
			{
				protocol: "https",
				hostname: "images.unsplash.com",
			},
			{
				protocol: "https",
				hostname: "images.pexels.com",
			},
		],
		// Image optimization enabled: automatic WebP/AVIF conversion, responsive
		// srcsets and lazy loading for menu photography on mobile networks.
		formats: ["image/avif", "image/webp"],
	},
	experimental: {
		serverActions: { bodySizeLimit: "2mb" },
	},
	// Type errors are checked separately via `tsc --noEmit` to avoid OOM during build.
	// Re-enable when running on a host with more memory.
	typescript: { ignoreBuildErrors: true },
	turbopack: {
		rules: {
			"*.svg": {
				loaders: ["@svgr/webpack"],
				as: "*.js",
			},
		},
	},
	webpack(config) {
		config.module.rules.push({
			test: /\.svg$/i,
			issuer: /\.[jt]sx?$/,
			use: ["@svgr/webpack"],
		});
		return config;
	},
};

export default nextConfig;
