import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: "standalone",
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
					{
						key: "Permissions-Policy",
						value: "camera=(), microphone=(), geolocation=(), payment=()",
					},
					{
						key: "Content-Security-Policy",
						value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https:; media-src 'self' blob:; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'",
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
		],
		unoptimized: true,
	},
	experimental: {
		serverActions: { bodySizeLimit: "2mb" },
	},
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
