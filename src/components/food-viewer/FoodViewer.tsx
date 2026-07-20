"use client";

import dynamic from "next/dynamic";
import { FoodViewerErrorBoundary } from "./ErrorBoundary";
import { FoodViewerSkeleton } from "./Skeleton";

const FoodCanvas = dynamic(() => import("./FoodCanvas").then((m) => m.FoodCanvas), {
	ssr: false,
	loading: () => <FoodViewerSkeleton />,
});

export interface FoodViewerProps {
	src: string;
	alt?: string;
}

export function FoodViewer({ src }: FoodViewerProps) {
	return (
		<div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gradient-to-br from-gray-50 to-gray-100">
			<FoodViewerErrorBoundary fallback={<FoodViewerSkeleton />}>
				<FoodCanvas url={src} />
			</FoodViewerErrorBoundary>
		</div>
	);
}
