import { Home, SearchX } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8 text-center">
			<div className="flex h-20 w-20 items-center justify-center rounded-2xl border bg-muted/50">
				<SearchX className="h-10 w-10 text-muted-foreground" />
			</div>
			<h1 className="text-3xl font-semibold tracking-tight text-foreground">Page not found</h1>
			<p className="max-w-md text-muted-foreground">This restaurant hasn&apos;t joined OrderWorder yet, or the link you followed may be wrong.</p>
			<Link
				href="/"
				className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
				<Home className="h-4 w-4" />
				Go home
			</Link>
		</div>
	);
}
