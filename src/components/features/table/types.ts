export interface MenuItem {
	_id: string;
	name: string;
	description: string;
	price: number;
	taxPercent: number;
	category: string;
	veg: "veg" | "non-veg" | "contains-egg";
	image: string;
	foodType: string;
	modelUrl?: string;
	model3d?: { url: string };
	isAvailable?: boolean;
	isBestseller?: boolean;
}

export interface CartItem extends MenuItem {
	quantity: number;
	spiceLevel: string;
	specialInstructions: string;
	selectedCustomizations: { name: string; price: number }[];
}

export interface RestaurantData {
	name: string;
	username: string;
	profile: { categories: string[]; address?: string; currency?: string };
	menus: MenuItem[];
}

export interface CartTotal {
	subtotal: number;
	tax: number;
	discount: number;
	total: number;
}
