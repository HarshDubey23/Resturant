import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import type { ReactNode } from "react";
import { authOptions } from "#utils/helper/authHelper";

interface PlatformLayoutProps {
	children: ReactNode;
}

export default async function PlatformLayout({ children }: PlatformLayoutProps) {
	const session = await getServerSession(authOptions);

	// Check if user is a platform admin
	if (!session || session.role !== "admin" || !(session as unknown as Record<string, unknown>).platformAdmin) {
		redirect("/dashboard");
	}

	return (
		<div className="min-h-screen flex flex-col bg-slate-50">
			{/* Platform-specific nav */}
			<header className="sticky top-0 z-30 bg-violet-900 text-white border-b border-violet-800 shadow-sm">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-14">
						<div className="flex items-center gap-3">
							<span className="text-sm font-bold tracking-tight">OrderWorder</span>
							<span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">Platform Admin</span>
						</div>
						<nav className="flex items-center gap-1">
							<a href="/platform" className="px-3 py-1.5 text-xs font-medium rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all">
								KPIs
							</a>
							<a
								href="/platform/tenants"
								className="px-3 py-1.5 text-xs font-medium rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all">
								Tenants
							</a>
						</nav>
					</div>
				</div>
			</header>

			{/* Main content */}
			<main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">{children}</main>

			{/* Footer */}
			<footer className="mt-auto border-t border-slate-200 bg-white py-4">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400">OrderWorder Platform Admin &mdash; Internal Use Only</div>
			</footer>
		</div>
	);
}
