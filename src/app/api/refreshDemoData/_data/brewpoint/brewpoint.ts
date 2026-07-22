/* eslint-disable max-len */
import mongoose from "mongoose";
import { ID_SUFFIX, REF_BREWPOINT, TYPE_ACCOUNT, TYPE_KITCHEN, TYPE_PROFILE, TYPE_TABLE } from "../constants";
import { menus } from "./brewpointMenu";

const account = {
	_id: new mongoose.Types.ObjectId(`${REF_BREWPOINT}${TYPE_ACCOUNT}${ID_SUFFIX}000001`),
	email: "admin@brewpoint.com",
	username: "brewpoint",
	password: "brewpoint@123",
	verified: true,
};

const profile = {
	_id: new mongoose.Types.ObjectId(`${REF_BREWPOINT}${TYPE_PROFILE}${ID_SUFFIX}000001`),
	name: "BrewPoint Coffee",
	restaurantID: "brewpoint",
	description: "Specialty coffee and artisan bakery in the heart of the city. Freshly roasted beans and handcrafted beverages.",
	address: "MG Road, Bengaluru",
	themeColor: { h: 24, s: 85, l: 45 },
	avatar: "https://images.unsplash.com/photo-1509042239860-f23cee9d0b6f?w=200&h=200&fit=crop",
	cover: "https://images.unsplash.com/photo-1509042239860-f23cee9d0b6f?w=1200&h=600&fit=crop",
	photos: [
		"https://images.unsplash.com/photo-1509042239860-f23cee9d0b6f?w=800&h=600&fit=crop",
		"https://images.unsplash.com/photo-1509042239860-f23cee9d0b6f?w=800&h=600&fit=crop",
		"https://images.unsplash.com/photo-1509042239860-f23cee9d0b6f?w=800&h=600&fit=crop",
	],
	categories: ["Coffee", "Tea", "Frappuccino", "Cold Beverages", "Bakery", "Savouries", "Desserts", "Specials"],
};

const kitchens = [
	{
		_id: new mongoose.Types.ObjectId(`${REF_BREWPOINT}${TYPE_KITCHEN}${ID_SUFFIX}000001`),
		restaurantID: "brewpoint",
		username: "brewpointKitchen1",
		password: "123456",
	},
];

const tables = Array.from({ length: 5 }, (_, i) => ({
	_id: new mongoose.Types.ObjectId(`${REF_BREWPOINT}${TYPE_TABLE}${ID_SUFFIX}${i.toString().padStart(6, "0")}`),
	restaurantID: "brewpoint",
	name: `Table ${i}`,
	username: i.toString(),
}));

const brewpoint = {
	account,
	profile,
	menus,
	kitchens,
	tables,
};

export default brewpoint;
