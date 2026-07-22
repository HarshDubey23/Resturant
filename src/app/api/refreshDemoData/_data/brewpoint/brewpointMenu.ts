import mongoose from "mongoose";
import type { TMenu } from "#utils/database/models/menu";
import { ID_SUFFIX, REF_BREWPOINT, TYPE_MENU } from "../constants";
import { enrichMenuForPremiumUI } from "../enrichMenu";

const coffees = [
	{
		name: "Classic Espresso",
		description: "Single-origin espresso shot with rich crema and bold finish.",
		category: "Coffee",
		price: 150,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
	},
	{
		name: "Cappuccino",
		description: "Espresso with steamed milk foam and a dusting of cocoa.",
		category: "Coffee",
		price: 200,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.pexels.com/photos/302902/pexels-photo-302902.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
	},
	{
		name: "Caffe Latte",
		description: "Smooth espresso with steamed milk and a light foam top.",
		category: "Coffee",
		price: 220,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.pexels.com/photos/2074130/pexels-photo-2074130.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
	},
	{
		name: "Flat White",
		description: "Double ristretto with microfoam for a velvety texture.",
		category: "Coffee",
		price: 240,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.pexels.com/photos/302896/pexels-photo-302896.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
	},
	{
		name: "Mocha",
		description: "Espresso with steamed milk and house-made chocolate sauce.",
		category: "Coffee",
		price: 260,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
	},
	{
		name: "Cold Brew",
		description: "Slow-steeped 18-hour cold brew, served over ice.",
		category: "Coffee",
		price: 230,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.pexels.com/photos/1024311/pexels-photo-1024311.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
	},
	{
		name: "Filter Coffee",
		description: "Traditional South Indian filter coffee with frothy milk.",
		category: "Coffee",
		price: 160,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.pexels.com/photos/2074122/pexels-photo-2074122.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
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
		image: "https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
		panoramicImage: "/panoramic/masala-chai-360.png",
	},
	{
		name: "Green Tea",
		description: "Japanese sencha green tea, light and refreshing.",
		category: "Tea",
		price: 120,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.pexels.com/photos/1417945/pexels-photo-1417945.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
	},
	{
		name: "Iced Lemon Tea",
		description: "Chilled black tea with fresh lemon and mint.",
		category: "Tea",
		price: 140,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.pexels.com/photos/96374/pexels-photo-96374.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
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
		image: "https://images.pexels.com/photos/3030215/pexels-photo-3030215.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
	},
	{
		name: "Mocha Chip Frappuccino",
		description: "Chocolatey blended beverage with chocolate chips and whipped cream.",
		category: "Frappuccino",
		price: 320,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.pexels.com/photos/235294/pexels-photo-235294.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
	},
	{
		name: "Caramel Frappuccino",
		description: "Sweet caramel blended with coffee, topped with whipped cream and drizzle.",
		category: "Frappuccino",
		price: 310,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
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
		image: "https://images.pexels.com/photos/4110271/pexels-photo-4110271.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
	},
	{
		name: "Mango Smoothie",
		description: "Fresh mango blended with yogurt and a hint of honey.",
		category: "Cold Beverages",
		price: 280,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.pexels.com/photos/1346155/pexels-photo-1346155.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
	},
	{
		name: "Strawberry Lemonade",
		description: "Fresh strawberry purée with lemon juice and sparkling water.",
		category: "Cold Beverages",
		price: 220,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.pexels.com/photos/6347637/pexels-photo-6347637.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
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
		image: "https://images.pexels.com/photos/3892469/pexels-photo-3892469.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
	},
	{
		name: "Cinnamon Roll",
		description: "Soft dough rolled with cinnamon sugar and cream cheese icing.",
		category: "Bakery",
		price: 220,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.pexels.com/photos/4040692/pexels-photo-4040692.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
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
		image: "https://images.pexels.com/photos/539451/pexels-photo-539451.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
	},
	{
		name: "Chicken Puff",
		description: "Spiced chicken filling in crisp puff pastry.",
		category: "Savouries",
		price: 200,
		foodType: "spicy",
		veg: "non-veg",
		image: "https://images.pexels.com/photos/4109136/pexels-photo-4109136.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
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
		image: "https://images.pexels.com/photos/461431/pexels-photo-461431.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
	},
	{
		name: "Chocolate Brownie",
		description: "Fudgy walnut brownie served with a scoop of vanilla ice cream.",
		category: "Desserts",
		price: 280,
		foodType: "sweet",
		veg: "veg",
		image: "https://images.pexels.com/photos/45202/brownie-dessert-cake-sweet-45202.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
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
		image: "https://images.pexels.com/photos/2074130/pexels-photo-2074130.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop",
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

menus = enrichMenuForPremiumUI(menus, "brewpoint");

export { menus };
