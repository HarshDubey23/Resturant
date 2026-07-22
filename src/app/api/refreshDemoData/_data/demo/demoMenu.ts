import mongoose from "mongoose";
import type { TMenu } from "#utils/database/models/menu";
import { ID_SUFFIX, REF_DEMO, TYPE_MENU } from "../constants";
import { enrichMenuForPremiumUI } from "../enrichMenu";

const starters = [
	{
		name: "Paneer Tikka",
		description: "Cottage cheese marinated in yogurt and spices, grilled in tandoor",
		category: "starters",
		price: 220,
		foodType: "spicy",
		veg: "veg",
		image: "https://images.pexels.com/photos/9609844/pexels-photo-9609844.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
		panoramicImage: "/panoramic/paneer-tikka-360.png",
	},
	{
		name: "Chicken Tikka",
		description: "Tender chicken pieces marinated in yogurt and aromatic spices",
		category: "starters",
		price: 280,
		foodType: "spicy",
		veg: "non-veg",
		image: "https://images.pexels.com/photos/12737656/pexels-photo-12737656.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
		panoramicImage: "/panoramic/chicken-tikka-360.png",
	},
	{
		name: "Hara Bhara Kebab",
		description: "Green spinach and potato kebabs with fresh herbs",
		category: "starters",
		price: 180,
		foodType: null,
		veg: "veg",
		image: "https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
		panoramicImage: "/panoramic/paneer-tikka-360.png",
	},
	{
		name: "Fish Amritsari",
		description: "Crispy fried fish fillets with Punjabi spice coating",
		category: "starters",
		price: 320,
		foodType: "extra-spicy",
		veg: "non-veg",
		image: "https://images.pexels.com/photos/7525164/pexels-photo-7525164.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
		panoramicImage: "/panoramic/chicken-tikka-360.png",
	},
	{
		name: "Veg Spring Rolls",
		description: "Crispy rolls stuffed with seasoned vegetables",
		category: "starters",
		price: 160,
		foodType: null,
		veg: "veg",
		image: "https://images.pexels.com/photos/6210765/pexels-photo-6210765.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
		panoramicImage: "/panoramic/paneer-tikka-360.png",
	},
];

const mainCourse = [
	{
		name: "Butter Chicken",
		description: "Creamy tomato-based curry with tender tandoori chicken pieces",
		category: "Mains",
		price: 380,
		foodType: null,
		veg: "non-veg",
		image: "https://images.pexels.com/photos/7625056/pexels-photo-7625056.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
		panoramicImage: "/panoramic/butter-chicken-360.png",
	},
	{
		name: "Dal Makhani",
		description: "Slow-cooked black lentils in rich buttery creamy gravy",
		category: "Mains",
		price: 280,
		foodType: null,
		veg: "veg",
		image: "https://images.pexels.com/photos/9646440/pexels-photo-9646440.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
		panoramicImage: "/panoramic/dal-makhani-360.png",
	},
	{
		name: "Rogan Josh",
		description: "Kashmiri lamb curry with aromatic spice blend",
		category: "Mains",
		price: 450,
		foodType: "spicy",
		veg: "non-veg",
		image: "https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
		panoramicImage: "/panoramic/rogan-josh-360.png",
	},
	{
		name: "Palak Paneer",
		description: "Cottage cheese cubes in creamy spinach gravy",
		category: "Mains",
		price: 260,
		foodType: null,
		veg: "veg",
		image: "https://images.pexels.com/photos/9609843/pexels-photo-9609843.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
		panoramicImage: "/panoramic/palak-paneer-360.png",
	},
	{
		name: "Chicken Chettinad",
		description: "Fiery South Indian chicken curry with coconut and spices",
		category: "Mains",
		price: 350,
		foodType: "extra-spicy",
		veg: "non-veg",
		image: "https://images.pexels.com/photos/9538585/pexels-photo-9538585.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
		panoramicImage: "/panoramic/butter-chicken-360.png",
	},
	{
		name: "Biryani",
		description: "Fragrant basmati rice layered with spiced meat and saffron",
		category: "Mains",
		price: 320,
		foodType: "spicy",
		veg: "non-veg",
		image: "https://images.pexels.com/photos/12737668/pexels-photo-12737668.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
		panoramicImage: "/panoramic/biryani-360.png",
	},
];

const breads = [
	{
		name: "Garlic Naan",
		description: "Tandoor-baked leavened bread topped with garlic and butter",
		category: "breads",
		price: 80,
		foodType: null,
		veg: "veg",
		image: "https://images.pexels.com/photos/2474660/pexels-photo-2474660.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
		panoramicImage: "/panoramic/garlic-naan-360.png",
	},
	{
		name: "Laccha Paratha",
		description: "Layered whole wheat flatbread with ghee",
		category: "breads",
		price: 90,
		foodType: null,
		veg: "veg",
		image: "https://images.pexels.com/photos/4198015/pexels-photo-4198015.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
		panoramicImage: "/panoramic/garlic-naan-360.png",
	},
	{
		name: "Tandoori Roti",
		description: "Classic whole wheat bread baked in clay tandoor",
		category: "breads",
		price: 60,
		foodType: null,
		veg: "veg",
		image: "https://images.pexels.com/photos/9609853/pexels-photo-9609853.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
		panoramicImage: "/panoramic/garlic-naan-360.png",
	},
	{
		name: "Butter Naan",
		description: "Soft leavened bread brushed with melted butter",
		category: "breads",
		price: 70,
		foodType: null,
		veg: "veg",
		image: "https://images.pexels.com/photos/2474660/pexels-photo-2474660.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
		panoramicImage: "/panoramic/garlic-naan-360.png",
	},
];

const beverages = [
	{
		name: "Masala Chai",
		description: "Spiced Indian tea brewed with ginger, cardamom and cinnamon",
		category: "beverages",
		price: 80,
		foodType: null,
		veg: "veg",
		image: "https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
		panoramicImage: "/panoramic/masala-chai-360.png",
	},
	{
		name: "Mango Lassi",
		description: "Creamy yogurt blended with ripe Alphonso mango pulp",
		category: "beverages",
		price: 120,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.pexels.com/photos/1337825/pexels-photo-1337825.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
		panoramicImage: "/panoramic/mango-lassi-360.png",
	},
	{
		name: "Jal Jeera",
		description: "Refreshing cumin and mint spiced summer cooler",
		category: "beverages",
		price: 100,
		foodType: null,
		veg: "veg",
		image: "https://images.pexels.com/photos/6199186/pexels-photo-6199186.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
		panoramicImage: "/panoramic/masala-chai-360.png",
	},
	{
		name: "Sweet Lassi",
		description: "Creamy sweetened yogurt drink with cardamom",
		category: "beverages",
		price: 110,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.pexels.com/photos/1337825/pexels-photo-1337825.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
		panoramicImage: "/panoramic/mango-lassi-360.png",
	},
];

const desserts = [
	{
		name: "Gulab Jamun",
		description: "Deep-fried milk solids soaked in rose-scented sugar syrup",
		category: "desserts",
		price: 120,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.pexels.com/photos/8951562/pexels-photo-8951562.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
		panoramicImage: "/panoramic/gulab-jamun-360.png",
	},
	{
		name: "Rasmalai",
		description: "Soft cottage cheese dumplings in saffron-infused sweet milk",
		category: "desserts",
		price: 150,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.pexels.com/photos/8951562/pexels-photo-8951562.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
		panoramicImage: "/panoramic/gulab-jamun-360.png",
	},
	{
		name: "Kulfi",
		description: "Traditional Indian ice cream flavored with cardamom and pistachio",
		category: "desserts",
		price: 130,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.pexels.com/photos/128402/pexels-photo-128402.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
		panoramicImage: "/panoramic/gulab-jamun-360.png",
	},
	{
		name: "Gajar Ka Halwa",
		description: "Warm carrot pudding with nuts and cardamom",
		category: "desserts",
		price: 140,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.pexels.com/photos/8951562/pexels-photo-8951562.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
		panoramicImage: "/panoramic/gulab-jamun-360.png",
	},
];

let menus = [...starters, ...mainCourse, ...breads, ...beverages, ...desserts] as unknown as TMenu[];

menus = menus.map((menu, index) => {
	menu._id = new mongoose.Types.ObjectId(`${REF_DEMO}${TYPE_MENU}${ID_SUFFIX}${index.toString().padStart(6, "0")}`);
	menu.restaurantID = "demo";
	if (!menu?.taxPercent) menu.taxPercent = 5;
	if (!menu?.hidden) menu.hidden = false;
	return menu;
});

menus = enrichMenuForPremiumUI(menus, "demo");

export { menus };
