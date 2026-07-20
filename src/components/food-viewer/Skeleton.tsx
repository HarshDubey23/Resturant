export function FoodViewerSkeleton() {
	return (
		<div className="flex aspect-square w-full animate-pulse items-center justify-center rounded-lg bg-gray-100">
			<div className="text-gray-400 text-sm">Loading 3D model...</div>
		</div>
	);
}
