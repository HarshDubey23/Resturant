"use client";

import { GitFork } from "lucide-react";

export default function FooterSection() {
	return (
		<footer className="border-t py-12">
			<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
					<div className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} OrderWorder, Inc. All rights reserved.</div>
					<div className="flex items-center gap-6">
						<a
							href="https://github.com/itzzritik/OrderWorder"
							target="_blank"
							rel="noopener noreferrer"
							className="text-muted-foreground hover:text-foreground transition-colors"
							aria-label="View source on GitHub">
							<GitFork className="h-5 w-5" />
						</a>
						<button
							onClick={() => document.getElementById("homepage")?.scrollIntoView({ behavior: "smooth" })}
							className="text-sm text-muted-foreground hover:text-foreground transition-colors">
							Back to top
						</button>
					</div>
				</div>
			</div>
		</footer>
	);
}
