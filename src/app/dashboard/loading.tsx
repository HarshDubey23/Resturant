export default function DashboardLoading() {
	return (
		<div className="flex h-screen items-center justify-center bg-background">
			<div className="flex flex-col items-center gap-3">
				<div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
				<p className="text-sm text-muted-foreground">Loading dashboard...</p>
			</div>
		</div>
	);
}
