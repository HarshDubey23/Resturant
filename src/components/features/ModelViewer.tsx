"use client";

import "@google/model-viewer";

declare module "react" {
	namespace JSX {
		interface IntrinsicElements {
			"model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
				src?: string;
				alt?: string;
				"auto-rotate"?: boolean;
				"camera-controls"?: boolean;
				style?: React.CSSProperties;
			};
		}
	}
}

export function ModelViewer({ modelUrl, itemName }: { modelUrl: string; itemName: string }) {
	return <model-viewer src={modelUrl} alt={itemName} auto-rotate camera-controls style={{ width: "100%", height: "60vh" }} />;
}
