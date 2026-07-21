"use client";

import { Environment, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";

function Model({ url }: { url: string }) {
	const gltf = useGLTF(url);
	return <primitive object={gltf.scene} />;
}

export function R3FViewer({ modelUrl, itemName }: { modelUrl: string; itemName: string }) {
	return (
		<div className="w-full h-[60vh]">
			<Canvas camera={{ position: [0, 0, 3] }}>
				<Suspense fallback={<div className="text-sm text-muted-foreground">Loading {itemName}...</div>}>
					<Environment preset="studio" />
					<OrbitControls autoRotate enableDamping />
					<Model url={modelUrl} />
				</Suspense>
			</Canvas>
		</div>
	);
}
