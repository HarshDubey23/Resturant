import mongoose from "mongoose";
import { ID_SUFFIX, REF_SPICEROUTE, TYPE_ACCOUNT, TYPE_KITCHEN, TYPE_PROFILE, TYPE_TABLE } from "../constants";
import { menus } from "./spicerouteMenu";

const account = {
	_id: new mongoose.Types.ObjectId(`${REF_SPICEROUTE}${TYPE_ACCOUNT}${ID_SUFFIX}000001`),
	email: "admin@spiceroute.com",
	username: "spiceroute",
	password: "spiceroute@demo123",
	verified: true,
};

const profile = {
	_id: new mongoose.Types.ObjectId(`${REF_SPICEROUTE}${TYPE_PROFILE}${ID_SUFFIX}000001`),
	name: "Spice Route Demo",
	restaurantID: "spiceroute",
	description:
		"Authentic Indian restaurant showcasing the rich and diverse flavors of India's culinary heritage — from North Indian classics to South Indian specialties.",
	address: "Indiranagar, Bengaluru",
	themeColor: { h: 30, s: 100, l: 40 },
	avatar: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&h=200&fit=crop",
	cover: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=1200&h=600&fit=crop",
	photos: [
		"https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&h=600&fit=crop",
		"https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop",
		"https://images.unsplash.com/photo-1555398404-5a9f8e7d6c5b?w=800&h=600&fit=crop",
		"https://images.unsplash.com/photo-1606491956687-2752420bbd1b?w=800&h=600&fit=crop",
		"https://images.unsplash.com/photo-1601050690597-d2d841a401d6?w=800&h=600&fit=crop",
	],
	categories: ["Starters", "Mains", "Breads", "Desserts", "Beverages"],
};

const kitchens: Array<Record<string, unknown>> = [];

const tables = Array.from({ length: 5 }, (_, i) => ({
	_id: new mongoose.Types.ObjectId(`${REF_SPICEROUTE}${TYPE_TABLE}${ID_SUFFIX}${(i + 1).toString().padStart(6, "0")}`),
	restaurantID: "spiceroute",
	name: `T${i + 1}`,
	username: (i + 1).toString(),
}));

const spiceroute = {
	account,
	profile,
	menus,
	kitchens,
	tables,
};

export default spiceroute;
