"use client";
import { useGLTF } from "@react-three/drei";

export function FoodModel({ url }: { url: string }) {
	useGLTF.preload(url);
	const { scene } = useGLTF(url);
	const cloned = scene.clone(true);
	return <primitive object={cloned} dispose={null} />;
}
