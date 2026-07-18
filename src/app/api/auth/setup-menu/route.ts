import connectDB from "#utils/database/connect";
import { Accounts } from "#utils/database/models/account";
import { Menus } from "#utils/database/models/menu";
import { rateLimitMiddleware } from "#utils/helper/rateLimit";

export async function POST(req: Request) {
	const ip = req.headers.get("x-forwarded-for") ?? "unknown";
	const rateLimitResponse = rateLimitMiddleware(`setup-menu:${ip}`, 30, 60000);
	if (rateLimitResponse) return rateLimitResponse;

	try {
		const { restaurantID, name, price, category } = await req.json();

		if (!restaurantID || !name || !price || price <= 0) {
			return Response.json({ message: "Invalid request. Name and price are required." }, { status: 400 });
		}

		await connectDB();

		const account = await Accounts.findOne({ username: restaurantID }).populate("profile");
		if (!account) {
			return Response.json({ message: "Restaurant not found" }, { status: 404 });
		}

		if (account.menus.length >= account.maxMenuItems) {
			return Response.json({ message: `Menu item limit reached (${account.maxMenuItems})` }, { status: 403 });
		}

		const menuItem = await Menus.create({
			name,
			restaurantID,
			price,
			category: category || "main",
			taxPercent: 0,
			veg: "veg",
			hidden: false,
		});

		return Response.json({ menuItem });
	} catch (error) {
		console.error("Setup menu error:", error);
		return Response.json({ message: "Something went wrong" }, { status: 500 });
	}
}
