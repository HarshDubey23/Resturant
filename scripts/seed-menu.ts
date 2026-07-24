import { db } from "../src/lib/db";

const MENU_ITEMS = [
	{ name: "Samosa", slug: "samosa", category: "starters", price: 80, veg: true, description: "Crispy golden pastry filled with spiced potatoes, peas, and cumin. A classic Indian street food snack.", spiceLevel: 2, rating: 4.7, tags: "starter,veg,street-food", image: "/food-images/dishes/samosa.png", popular: true },
	{ name: "Paneer Tikka", slug: "paneer-tikka", category: "starters", price: 220, veg: true, description: "Marinated cottage cheese cubes grilled in tandoor with bell peppers and onions. Served with mint chutney.", spiceLevel: 2, rating: 4.6, tags: "starter,veg,tandoor", image: "/food-images/dishes/paneer-masala.png", popular: true },
	{ name: "Chicken Tikka", slug: "chicken-tikka", category: "starters", price: 260, veg: false, description: "Boneless chicken pieces marinated in yogurt and spices, chargrilled in the tandoor.", spiceLevel: 2, rating: 4.8, tags: "starter,non-veg,tandoor", image: "/food-images/dishes/chicken-tikka.png", popular: true },
	{ name: "Chole Bhature", slug: "chole-bhature", category: "starters", price: 140, veg: true, description: "Spicy chickpea curry paired with deep-fried fluffy bread. A North Indian classic.", spiceLevel: 2, rating: 4.5, tags: "starter,veg,north-indian", image: "/food-images/dishes/chole-bhature.png", popular: false },
	{ name: "Tandoori Chicken", slug: "tandoori-chicken", category: "starters", price: 300, veg: false, description: "Whole chicken leg marinated in tandoori spices, slow-cooked in clay oven. Juicy and smoky.", spiceLevel: 3, rating: 4.9, tags: "starter,non-veg,tandoor", image: "/food-images/dishes/tandoori-chicken.png", popular: true },
	{ name: "Butter Chicken", slug: "butter-chicken", category: "mains", price: 320, veg: false, description: "Creamy tomato-butter gravy with tender chicken pieces. India's most beloved curry.", spiceLevel: 1, rating: 4.9, tags: "main,non-veg,curry,popular", image: "/food-images/dishes/butter-chicken.png", popular: true },
	{ name: "Hyderabadi Biryani", slug: "hyderabadi-biryani", category: "mains", price: 280, veg: false, description: "Layered rice and spiced lamb dum-cooked with saffron, fried onions, and aromatic herbs.", spiceLevel: 2, rating: 4.8, tags: "main,non-veg,biryani", image: "/food-images/dishes/biryani.png", popular: true },
	{ name: "Dal Makhani", slug: "dal-makhani", category: "mains", price: 180, veg: true, description: "Slow-cooked black lentils simmered overnight with butter and cream. Rich, velvety comfort food.", spiceLevel: 1, rating: 4.6, tags: "main,veg,lentil", image: "/food-images/dishes/dal-makhani.png", popular: false },
	{ name: "Palak Paneer", slug: "palak-paneer", category: "mains", price: 200, veg: true, description: "Cottage cheese cubes in a vibrant spinach gravy with garlic and fenugreek.", spiceLevel: 1, rating: 4.5, tags: "main,veg,paneer", image: "/food-images/dishes/palak-paneer.png", popular: false },
	{ name: "Rogan Josh", slug: "rogan-josh", category: "mains", price: 350, veg: false, description: "Aromatic Kashmiri lamb curry with deep red chili, fennel, and ginger. Slow-cooked perfection.", spiceLevel: 3, rating: 4.7, tags: "main,non-veg,kashmiri", image: "/food-images/dishes/rogan-josh.png", popular: false },
	{ name: "Veg Fried Rice", slug: "veg-fried-rice", category: "mains", price: 160, veg: true, description: "Stir-fried basmati rice with mixed vegetables, soy sauce, and Indian spices.", spiceLevel: 1, rating: 4.2, tags: "main,veg,rice", image: "/food-images/dishes/veg-fried-rice.png", popular: false },
	{ name: "Garlic Naan", slug: "garlic-naan", category: "breads", price: 60, veg: true, description: "Soft leavened bread brushed with garlic butter, baked fresh in the tandoor.", spiceLevel: 0, rating: 4.5, tags: "bread,veg,naan", image: "/food-images/dishes/naan.png", popular: true },
	{ name: "Pani Puri", slug: "pani-puri", category: "street-food", price: 60, veg: true, description: "Crispy hollow puris filled with spiced potato and dunked in tangy mint water. Burst of flavors!", spiceLevel: 2, rating: 4.7, tags: "street-food,veg,snack", image: "/food-images/dishes/pani-puri.png", popular: true },
	{ name: "Mango Lassi", slug: "mango-lassi", category: "beverages", price: 100, veg: true, description: "Chilled yogurt smoothie blended with fresh mango pulp and a hint of cardamom.", spiceLevel: 0, rating: 4.6, tags: "beverage,veg,sweet", image: "/food-images/dishes/mango-lassi.png", popular: true },
	{ name: "Masala Chai", slug: "masala-chai", category: "beverages", price: 40, veg: true, description: "Traditional spiced tea simmered with cardamom, cinnamon, ginger, and cloves.", spiceLevel: 0, rating: 4.5, tags: "beverage,veg,tea", image: "/food-images/dishes/masala-chai.png", popular: true },
	{ name: "Gulab Jamun", slug: "gulab-jamun", category: "desserts", price: 80, veg: true, description: "Deep-fried milk-solid balls soaked in rose-cardamom sugar syrup. Sweet and indulgent.", spiceLevel: 0, rating: 4.7, tags: "dessert,veg,sweet", image: "/food-images/dishes/gulab-jamun.png", popular: true },
	{ name: "Dosa", slug: "dosa", category: "street-food", price: 120, veg: true, description: "Thin crispy rice-lentil crepe served with coconut chutney and sambar. South Indian staple.", spiceLevel: 1, rating: 4.4, tags: "street-food,veg,south-indian", image: "/food-images/dishes/dosa.png", popular: false },
	{ name: "Jalebi", slug: "jalebi", category: "desserts", price: 60, veg: true, description: "Crispy spirals of fermented batter drenched in saffron sugar syrup. Sweet, sticky, and golden.", spiceLevel: 0, rating: 4.3, tags: "dessert,veg,sweet", image: "/food-images/dishes/jalebi.png", popular: false },
];

async function main() {
	console.log("Seeding menu items...");
	
	// Clear existing items
	await db.menuItem.deleteMany();
	
	// Insert all items
	for (const item of MENU_ITEMS) {
		await db.menuItem.create({ data: item });
	}
	
	console.log(`Seeded ${MENU_ITEMS.length} menu items`);
}

main()
	.catch(console.error)
	.finally(() => db.$disconnect());
