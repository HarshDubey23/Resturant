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
