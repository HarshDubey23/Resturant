import mongoose from "mongoose";
import type { TMenu } from "#utils/database/models/menu";
import { ID_SUFFIX, REF_SPICEROUTE, TYPE_MENU } from "../constants";

// All images verified working (Wikipedia Commons + Unsplash CDN).
const starters = [
	{
		name: "Paneer Tikka",
		description: "Cottage cheese marinated in yogurt and spices, grilled in tandoor until smoky and charred at the edges",
		category: "Starters",
		price: 220,
		foodType: "spicy",
		veg: "veg",
		image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Paneer_tikka.jpg/960px-Paneer_tikka.jpg",
	},
	{
		name: "Chicken Tikka",
		description: "Tender chicken pieces marinated in yogurt and aromatic spices, char-grilled in the clay tandoor",
		category: "Starters",
		price: 280,
		foodType: "spicy",
		veg: "non-veg",
		image: "https://upload.wikimedia.org/wikipedia/commons/b/bd/Tandoorimumbai.jpg",
	},
	{
		name: "Hara Bhara Kebab",
		description: "Green spinach and potato patties stuffed with peas and fresh herbs, pan-seared golden",
		category: "Starters",
		price: 180,
		foodType: null,
		veg: "veg",
		image: "https://images.unsplash.com/photo-1567337710282-00832b415979?w=600&h=600&fit=crop",
	},
	{
		name: "Fish Amritsari",
		description: "Crispy battered fish fillets with Punjabi spice coating, served with mint chutney",
		category: "Starters",
		price: 320,
		foodType: "extra-spicy",
		veg: "non-veg",
		image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=600&fit=crop",
	},
];

const mains = [
	{
		name: "Butter Chicken",
		description: "Creamy tomato-based curry with tender tandoori chicken pieces, finished with butter and cream",
		category: "Mains",
		price: 380,
		foodType: null,
		veg: "non-veg",
		image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Butter_Chicken_%26_Butter_Naan_-_Home_-_Chandigarh_-_India_-_0006.jpg/960px-Butter_Chicken_%26_Butter_Naan_-_Home_-_Chandigarh_-_India_-_0006.jpg",
	},
	{
		name: "Dal Makhani",
		description: "Slow-cooked black lentils in rich buttery creamy gravy, simmered overnight for depth",
		category: "Mains",
		price: 280,
		foodType: null,
		veg: "veg",
		image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Punjabi_style_Dal_Makhani.jpg/960px-Punjabi_style_Dal_Makhani.jpg",
	},
	{
		name: "Rogan Josh",
		description: "Kashmiri lamb curry with aromatic spice blend, slow-braised until fall-apart tender",
		category: "Mains",
		price: 450,
		foodType: "spicy",
		veg: "non-veg",
		image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Rogan_Josh_Kashmiri.jpg/960px-Rogan_Josh_Kashmiri.jpg",
	},
	{
		name: "Palak Paneer",
		description: "Cottage cheese cubes simmered in creamy spinach gravy with ginger and garlic",
		category: "Mains",
		price: 260,
		foodType: null,
		veg: "veg",
		image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Palakpaneer_Rayagada_Odisha_0009.jpg/960px-Palakpaneer_Rayagada_Odisha_0009.jpg",
	},
	{
		name: "Chicken Chettinad",
		description: "Fiery South Indian chicken curry with toasted coconut, peppercorns, and whole spices",
		category: "Mains",
		price: 350,
		foodType: "extra-spicy",
		veg: "non-veg",
		image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&h=600&fit=crop",
	},
	{
		name: "Hyderabadi Biryani",
		description: "Fragrant basmati rice layered with spiced chicken and saffron, sealed and dum-cooked",
		category: "Mains",
		price: 320,
		foodType: "spicy",
		veg: "non-veg",
		image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/%22Hyderabadi_Dum_Biryani%22.jpg/960px-%22Hyderabadi_Dum_Biryani%22.jpg",
	},
];

const breads = [
	{
		name: "Garlic Naan",
		description: "Tandoor-baked leavened bread topped with garlic, coriander, and melted butter",
		category: "Breads",
		price: 80,
		foodType: null,
		veg: "veg",
		image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Annapurna_Naan.jpg/960px-Annapurna_Naan.jpg",
	},
	{
		name: "Laccha Paratha",
		description: "Layered whole wheat flatbread with ghee, flaky and crisp on the outside, soft inside",
		category: "Breads",
		price: 90,
		foodType: null,
		veg: "veg",
		image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Triangle_paratha_%28cropped%29.JPG/960px-Triangle_paratha_%28cropped%29.JPG",
	},
	{
		name: "Tandoori Roti",
		description: "Classic whole wheat bread baked in clay tandoor, lightly charred and chewy",
		category: "Breads",
		price: 60,
		foodType: null,
		veg: "veg",
		image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/2020-05-08_19_34_28_Chapati_being_made_in_a_pan_in_the_Franklin_Farm_section_of_Oak_Hill%2C_Fairfax_County%2C_Virginia.jpg/960px-2020-05-08_19_34_28_Chapati_being_made_in_a_pan_in_the_Franklin_Farm_section_of_Oak_Hill%2C_Fairfax_County%2C_Virginia.jpg",
	},
];

const desserts = [
	{
		name: "Gulab Jamun",
		description: "Deep-fried milk solids dumplings soaked in rose-scented sugar syrup, served warm",
		category: "Desserts",
		price: 120,
		foodType: "sweet",
		veg: "veg",
		image: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Gulab-jamun-wallpaper-1.jpg",
	},
	{
		name: "Rasmalai",
		description: "Soft cottage cheese dumplings in saffron-infused sweet milk, garnished with pistachios",
		category: "Desserts",
		price: 150,
		foodType: "sweet",
		veg: "veg",
		image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Ras_Malai_2.JPG/960px-Ras_Malai_2.JPG",
	},
	{
		name: "Kulfi",
		description: "Traditional Indian ice cream flavored with cardamom and pistachio, dense and creamy",
		category: "Desserts",
		price: 130,
		foodType: "sweet",
		veg: "veg",
		image: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Matka_kulfi.jpg",
	},
];

const beverages = [
	{
		name: "Masala Chai",
		description: "Spiced Indian tea brewed with ginger, cardamom and cinnamon, served piping hot",
		category: "Beverages",
		price: 80,
		foodType: null,
		veg: "veg",
		image: "https://upload.wikimedia.org/wikipedia/commons/8/89/Chai_In_Sakora.jpg",
	},
	{
		name: "Mango Lassi",
		description: "Creamy yogurt blended with ripe Alphonso mango pulp, topped with pistachios",
		category: "Beverages",
		price: 120,
		foodType: "sweet",
		veg: "veg",
		image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Salt_lassi.jpg/960px-Salt_lassi.jpg",
	},
	{
		name: "Jal Jeera",
		description: "Refreshing cumin and mint spiced summer cooler with tamarind and black salt",
		category: "Beverages",
		price: 100,
		foodType: null,
		veg: "veg",
		image: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=600&h=600&fit=crop",
	},
];

let menus = [...starters, ...mains, ...breads, ...desserts, ...beverages] as TMenu[];

menus = menus.map((menu, index) => {
	menu._id = new mongoose.Types.ObjectId(`${REF_SPICEROUTE}${TYPE_MENU}${ID_SUFFIX}${index.toString().padStart(6, "0")}`);
	menu.restaurantID = "spiceroute";
	if (!menu?.taxPercent) menu.taxPercent = 5;
	if (!menu?.hidden) menu.hidden = false;
	return menu;
});

export { menus };
