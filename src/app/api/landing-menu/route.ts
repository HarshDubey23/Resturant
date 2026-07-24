import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
	try {
		const category = req.nextUrl.searchParams.get("category");

		if (category) {
			const items = await db.menuItem.findMany({
				where: { category, available: true },
			 orderBy: { createdAt: "asc" },
			});
			return NextResponse.json({ items });
		}

		const items = await db.menuItem.findMany({
			where: { available: true },
		 orderBy: { createdAt: "asc" },
		});
		return NextResponse.json({ items });
	} catch (error) {
		console.error("Menu API error:", error);
		// Return mock data if database is empty
		return NextResponse.json({
			items: MOCK_MENU_ITEMS,
		});
	}
}

// Mock menu data for fallback when DB is empty
const MOCK_MENU_ITEMS = [
	{ id: "1", name: "Hyderabadi Biryani", slug: "hyderabadi-biryani", category: "mains", price: 320, veg: false, description: "Fragrant basmati rice layered with tender chicken", spiceLevel: 3, rating: 4.8, popular: true, tags: "biryani,rice,chicken", image: "/food-images/dishes/biryani.png" },
	{ id: "2", name: "Butter Chicken", slug: "butter-chicken", category: "mains", price: 280, veg: false, description: "Creamy tomato-based curry with tender chicken pieces", spiceLevel: 2, rating: 4.7, popular: true, tags: "curry,chicken,cream", image: "/food-images/dishes/butter-chicken.png" },
	{ id: "3", name: "Paneer Tikka Masala", slug: "paneer-tikka-masala", category: "mains", price: 260, veg: true, description: "Grilled paneer cubes in rich masala gravy", spiceLevel: 2, rating: 4.5, popular: false, tags: "paneer,curry,veg", image: "/food-images/dishes/paneer-masala.png" },
	{ id: "4", name: "Dal Makhani", slug: "dal-makhani", category: "mains", price: 180, veg: true, description: "Slow-cooked black lentils in creamy butter sauce", spiceLevel: 1, rating: 4.3, popular: false, tags: "dal,lentil,veg", image: "/food-images/dishes/rajma-chawal.png" },
	{ id: "5", name: "Chicken Tikka", slug: "chicken-tikka", category: "starters", price: 220, veg: false, description: "Smoky tandoor-grilled chicken chunks with mint chutney", spiceLevel: 3, rating: 4.6, popular: false, tags: "chicken,tandoor,starters", image: "/food-images/dishes/chicken-tikka.png" },
	{ id: "6", name: "Samosa", slug: "samosa", category: "starters", price: 60, veg: true, description: "Crispy pastry filled with spiced potato and peas", spiceLevel: 2, rating: 4.9, popular: true, tags: "samosa,snack,veg", image: "/food-images/dishes/samosa.png" },
	{ id: "7", name: "Masala Papad", slug: "masala-papad", category: "starters", price: 50, veg: true, description: "Crispy papad topped with spiced onion-tomato mixture", spiceLevel: 1, rating: 4.0, popular: false, tags: "papad,snack,veg", image: "/food-images/dishes/naan.png" },
	{ id: "8", name: "Garlic Naan", slug: "garlic-naan", category: "breads", price: 60, veg: true, description: "Soft flatbread brushed with garlic butter from the tandoor", spiceLevel: 1, rating: 4.4, popular: false, tags: "naan,bread,garlic", image: "/food-images/dishes/naan.png" },
	{ id: "9", name: "Tandoori Roti", slug: "tandoori-roti", category: "breads", price: 30, veg: true, description: "Whole wheat bread baked in the clay tandoor", spiceLevel: 0, rating: 4.1, popular: false, tags: "roti,bread,whole-wheat", image: "/food-images/dishes/naan.png" },
	{ id: "10", name: "Laccha Paratha", slug: "laccha-paratha", category: "breads", price: 50, veg: true, description: "Flaky layered paratha crispy on the outside soft inside", spiceLevel: 0, rating: 4.2, popular: false, tags: "paratha,bread,layered", image: "/food-images/dishes/naan.png" },
	{ id: "11", name: "Gulab Jamun", slug: "gulab-jamun", category: "desserts", price: 80, veg: true, description: "Deep-fried milk dumplings soaked in rose-cardamom syrup", spiceLevel: 0, rating: 4.7, popular: false, tags: "dessert,sweet,milk", image: "/food-images/dishes/gulab-jamun.png" },
	{ id: "12", name: "Rasgulla", slug: "rasgulla", category: "desserts", price: 70, veg: true, description: "Soft spongy cottage cheese balls in light sugar syrup", spiceLevel: 0, rating: 4.4, popular: false, tags: "dessert,sweet,cottage-cheese", image: "/food-images/dishes/gulab-jamun.png" },
	{ id: "13", name: "Kulfi", slug: "kulfi", category: "desserts", price: 90, veg: true, description: "Traditional Indian dense frozen dessert with cardamom and pistachios", spiceLevel: 0, rating: 4.8, popular: true, tags: "dessert,ice-cream,traditional", image: "/food-images/dishes/gulab-jamun.png" },
	{ id: "14", name: "Masala Chai", slug: "masala-chai", category: "beverages", price: 40, veg: true, description: "Spiced Indian tea with ginger cardamom and cloves", spiceLevel: 1, rating: 4.6, popular: false, tags: "tea,spiced,beverage", image: "/food-images/dishes/masala-chai.png" },
	{ id: "15", name: "Mango Lassi", slug: "mango-lassi", category: "beverages", price: 60, veg: true, description: "Thick creamy yogurt drink blended with sweet mango pulp", spiceLevel: 0, rating: 4.9, popular: true, tags: "lassi,mango,yogurt", image: "/food-images/dishes/masala-chai.png" },
	{ id: "16", name: "Filter Coffee", slug: "filter-coffee", category: "beverages", price: 50, veg: true, description: "South Indian style strong decoction coffee served in a steel tumbler", spiceLevel: 0, rating: 4.5, popular: false, tags: "coffee,south-indian,beverage", image: "/food-images/dishes/masala-chai.png" },
	{ id: "17", name: "Pani Puri", slug: "pani-puri", category: "street-food", price: 50, veg: true, description: "Crispy hollow puris filled with spiced tangy water and chickpeas", spiceLevel: 3, rating: 4.9, popular: true, tags: "pani-puri,street-food,chaat", image: "/food-images/dishes/pani-puri.png" },
	{ id: "18", name: "Vada Pav", slug: "vada-pav", category: "street-food", price: 40, veg: true, description: "Mumbai's iconic spicy potato fritter in a soft bun with chutneys", spiceLevel: 2, rating: 4.7, popular: false, tags: "vada-pav,street-food,mumbai", image: "/food-images/dishes/chole-bhature.png" },
];
