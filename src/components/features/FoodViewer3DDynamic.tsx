import dynamic from "next/dynamic";

const FoodViewer3D = dynamic(() => import("./FoodViewer3D"), { ssr: false });

export default FoodViewer3D;
