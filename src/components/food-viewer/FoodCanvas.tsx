"use client";
import { ContactShadows, Environment, Html, OrbitControls, useProgress } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { FoodModel } from "./FoodModel";

function Loader() {
	const { progress } = useProgress();
	return (
		<Html center>
			<div className="rounded-md bg-black/70 px-3 py-1.5 text-white text-xs">{progress.toFixed(0)}%</div>
		</Html>
	);
}

export function FoodCanvas({ url }: { url: string }) {
	return (
		<Canvas camera={{ position: [0, 0, 5], fov: 35 }} dpr={[1, 2]} gl={{ antialias: true, preserveDrawingBuffer: false }}>
			<ambientLight intensity={0.4} />
			<directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />

			<Suspense fallback={<Loader />}>
				<FoodModel url={url} />
				<Environment preset="studio" />
				<ContactShadows position={[0, -1, 0]} opacity={0.6} scale={10} blur={2.4} far={4} />
			</Suspense>

			<OrbitControls
				enablePan={false}
				autoRotate
				autoRotateSpeed={1.2}
				enableZoom
				minDistance={2.5}
				maxDistance={8}
				minPolarAngle={Math.PI / 4}
				maxPolarAngle={Math.PI / 1.8}
			/>
		</Canvas>
	);
}
