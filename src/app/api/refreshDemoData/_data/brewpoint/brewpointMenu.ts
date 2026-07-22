import mongoose from "mongoose";
import type { TMenu } from "#utils/database/models/menu";
import { ID_SUFFIX, REF_BREWPOINT, TYPE_MENU } from "../constants";

// All images verified working Unsplash CDN URLs.
const coffees = [
	{
		name: "Classic Espresso",
		description: "Single-origin espresso shot with rich crema and bold finish.",
		category: "Coffee",
		price: 150,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=600&h=600&fit=crop",
	},
	{
		name: "Cappuccino",
		description: "Espresso with steamed milk foam and a dusting of cocoa.",
		category: "Coffee",
		price: 200,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.unsplash.com/photo-1561047029-3000c68339ca?w=600&h=600&fit=crop",
	},
	{
		name: "Caffe Latte",
		description: "Smooth espresso with steamed milk and a light foam top, beautiful latte art.",
		category: "Coffee",
		price: 220,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=600&h=600&fit=crop",
	},
	{
		name: "Flat White",
		description: "Double ristretto with microfoam for a velvety texture.",
		category: "Coffee",
		price: 240,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&h=600&fit=crop",
	},
	{
		name: "Mocha",
		description: "Espresso with steamed milk and house-made chocolate sauce.",
		category: "Coffee",
		price: 260,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&h=600&fit=crop",
	},
	{
		name: "Cold Brew",
		description: "Slow-steeped 18-hour cold brew, served over ice.",
		category: "Coffee",
		price: 230,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&h=600&fit=crop",
	},
	{
		name: "Filter Coffee",
		description: "Traditional South Indian filter coffee with frothy milk.",
		category: "Coffee",
		price: 160,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=600&fit=crop",
	},
];

const teas = [
	{
		name: "Masala Chai",
		description: "Spiced tea brewed with ginger, cardamom, and cinnamon.",
		category: "Tea",
		price: 150,
		foodType: "sweet",
		veg: "veg",
		image: "https://upload.wikimedia.org/wikipedia/commons/8/89/Chai_In_Sakora.jpg",
	},
	{
		name: "Green Tea",
		description: "Japanese sencha green tea, light and refreshing.",
		category: "Tea",
		price: 120,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.unsplash.com/photo-1432139509613-5c4255815697?w=600&h=600&fit=crop",
	},
	{
		name: "Iced Lemon Tea",
		description: "Chilled black tea with fresh lemon and mint.",
		category: "Tea",
		price: 140,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&h=600&fit=crop",
	},
];

const frappuccinos = [
	{
		name: "Coffee Frappuccino",
		description: "Blended coffee with milk and ice, topped with whipped cream.",
		category: "Frappuccino",
		price: 290,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&h=600&fit=crop",
	},
	{
		name: "Mocha Chip Frappuccino",
		description: "Chocolatey blended beverage with chocolate chips and whipped cream.",
		category: "Frappuccino",
		price: 320,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&h=600&fit=crop",
	},
	{
		name: "Caramel Frappuccino",
		description: "Sweet caramel blended with coffee, topped with whipped cream and drizzle.",
		category: "Frappuccino",
		price: 310,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&h=600&fit=crop",
	},
];

const coldBeverages = [
	{
		name: "Iced Matcha Latte",
		description: "Premium matcha whisked with chilled milk over ice.",
		category: "Cold Beverages",
		price: 250,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=600&h=600&fit=crop",
	},
	{
		name: "Mango Smoothie",
		description: "Fresh mango blended with yogurt and a hint of honey.",
		category: "Cold Beverages",
		price: 280,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.unsplash.com/photo-1546173159-315724a31696?w=600&h=600&fit=crop",
	},
	{
		name: "Strawberry Lemonade",
		description: "Fresh strawberry purée with lemon juice and sparkling water.",
		category: "Cold Beverages",
		price: 220,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&h=600&fit=crop",
	},
];

const bakery = [
	{
		name: "Butter Croissant",
		description: "Flaky, golden-baked French butter croissant.",
		category: "Bakery",
		price: 180,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&h=600&fit=crop",
	},
	{
		name: "Cinnamon Roll",
		description: "Soft dough rolled with cinnamon sugar and cream cheese icing.",
		category: "Bakery",
		price: 220,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=600&h=600&fit=crop",
	},
];

const savouries = [
	{
		name: "Grilled Cheese Sandwich",
		description: "Melted cheddar and mozzarella on toasted sourdough.",
		category: "Savouries",
		price: 280,
		foodType: "spicy",
		veg: "veg",
		image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&h=600&fit=crop",
	},
	{
		name: "Chicken Puff",
		description: "Spiced chicken filling in crisp puff pastry.",
		category: "Savouries",
		price: 200,
		foodType: "spicy",
		veg: "non-veg",
		image: "https://images.unsplash.com/photo-1565299543923-37dd37887442?w=600&h=600&fit=crop",
	},
];

const desserts = [
	{
		name: "Belgian Waffle",
		description: "Crisp waffle with whipped cream, chocolate sauce, and fresh berries.",
		category: "Desserts",
		price: 320,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&h=600&fit=crop",
	},
	{
		name: "Chocolate Brownie",
		description: "Fudgy walnut brownie served with a scoop of vanilla ice cream.",
		category: "Desserts",
		price: 280,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&h=600&fit=crop",
	},
];

const specials = [
	{
		name: "Seasonal Special Latte",
		description: "Rotating seasonal flavour — ask your barista for today's selection.",
		category: "Specials",
		price: 300,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=600&h=600&fit=crop",
	},
];

let menus = [...coffees, ...teas, ...frappuccinos, ...coldBeverages, ...bakery, ...savouries, ...desserts, ...specials] as TMenu[];

menus = menus.map((menu, index) => {
	menu._id = new mongoose.Types.ObjectId(`${REF_BREWPOINT}${TYPE_MENU}${ID_SUFFIX}${index.toString().padStart(6, "0")}`);
	menu.restaurantID = "brewpoint";
	if (!menu?.taxPercent) menu.taxPercent = 5;
	if (!menu?.hidden) menu.hidden = false;
	return menu;
});

export { menus };
