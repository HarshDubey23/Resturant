import { Home, SearchX, Sparkles } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background p-8 text-center bg-mesh">
			<div className="relative">
				<div className="flex h-24 w-24 items-center justify-center rounded-3xl border bg-card/80 shadow-xl">
					<SearchX className="h-12 w-12 text-muted-foreground" />
				</div>
				<div className="absolute -top-2 -right-2 h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
					<Sparkles className="h-4 w-4 text-primary" />
				</div>
			</div>
			<div>
				<h1 className="text-5xl font-black tracking-tight text-foreground mb-3">404</h1>
				<p className="text-xl font-semibold text-foreground mb-2">Page not found</p>
				<p className="max-w-md text-muted-foreground">This restaurant hasn&apos;t joined OrderWorder yet, or the link you followed may be wrong.</p>
			</div>
			<Link
				href="/"
				className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25">
				<Home className="h-4 w-4" />
				Go home
			</Link>
		</div>
	);
}
