"use client";
import React from "react";

export class FoodViewerErrorBoundary extends React.Component<{ children: React.ReactNode; fallback: React.ReactNode }, { hasError: boolean }> {
	state = { hasError: false };

	static getDerivedStateFromError() {
		return { hasError: true };
	}

	componentDidCatch(error: Error) {
		import("#utils/helper/sentryWrapper").then(({ captureError }) => {
			captureError(error, { component: "FoodViewer" });
		});
	}

	render() {
		return this.state.hasError ? this.props.fallback : this.props.children;
	}
}
