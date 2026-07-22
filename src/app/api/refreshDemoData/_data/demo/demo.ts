import mongoose from "mongoose";
import { ID_SUFFIX, REF_DEMO, TYPE_ACCOUNT, TYPE_PROFILE, TYPE_TABLE } from "../constants";
import { menus } from "./demoMenu";

const account = {
	_id: new mongoose.Types.ObjectId(`${REF_DEMO}${TYPE_ACCOUNT}${ID_SUFFIX}000001`),
	email: "demo@orderworder.com",
	username: "demo",
	password: "Demo@12345",
	verified: true,
};

const profile = {
	_id: new mongoose.Types.ObjectId(`${REF_DEMO}${TYPE_PROFILE}${ID_SUFFIX}000001`),
	name: "The Spice Kitchen",
	restaurantID: "demo",
	description:
		"Authentic Indian restaurant showcasing the rich and diverse flavors of India's culinary heritage — from North Indian classics to South Indian specialties.",
	address: "Indiranagar, Bengaluru",
	themeColor: { h: 25, s: 90, l: 55 },
	avatar: "https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop",
	cover: "https://images.pexels.com/photos/2664216/pexels-photo-2664216.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&fit=crop",
	photos: [
		"https://images.pexels.com/photos/2664216/pexels-photo-2664216.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
		"https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
		"https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
		"https://images.pexels.com/photos/2135/food-france-morning-breakfast.jpg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
	],
	categories: ["Starters", "Mains", "Breads", "Desserts", "Beverages"],
};

const kitchens: Array<Record<string, unknown>> = [];

const tables = Array.from({ length: 10 }, (_, i) => ({
	_id: new mongoose.Types.ObjectId(`${REF_DEMO}${TYPE_TABLE}${ID_SUFFIX}${(i + 1).toString().padStart(6, "0")}`),
	restaurantID: "demo",
	name: `T${i + 1}`,
	username: `T${i + 1}`,
}));

const demo = {
	account,
	profile,
	menus,
	kitchens,
	tables,
};

export default demo;
