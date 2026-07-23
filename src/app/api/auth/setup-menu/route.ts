import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { invalidateRestaurantCache } from "#utils/database/helper/account";
import { Accounts } from "#utils/database/models/account";
import { Menus } from "#utils/database/models/menu";
import { recordAudit } from "#utils/helper/audit";
import { authOptions } from "#utils/helper/authHelper";
import { rateLimitMiddleware } from "#utils/helper/rateLimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
	const ip = req.headers.get("x-forwarded-for") ?? "unknown";
	const rateLimitResponse = await rateLimitMiddleware(`setup-menu:${ip}`, 30, 60000);
	if (rateLimitResponse) return rateLimitResponse;

	try {
		const session = await getServerSession(authOptions);
		if (!session || session.role !== "admin") {
			return Response.json({ message: "Unauthorized. Admin access required." }, { status: 401 });
		}
		const { restaurantID, name, price, category, image } = await req.json();

		if (!restaurantID || !name || !price || price <= 0) {
			return Response.json({ message: "Invalid request. Name and price are required." }, { status: 400 });
		}

		await connectDB();

		const account = await Accounts.findOne({ username: restaurantID }).populate("profile");
		if (!account) {
			return Response.json({ message: "Restaurant not found" }, { status: 404 });
		}

		// ── Plan enforcement: check menu item limit ──
		const currentMenuCount = account.menus.length;
		if (currentMenuCount >= account.maxMenuItems) {
			return Response.json(
				{
					status: 402,
					message: `You've reached the ${account.maxMenuItems}-menu item limit. Upgrade to add more items.`,
					upgradeUrl: "/dashboard?tab=settings&subTab=billing",
				},
				{ status: 402 },
			);
		}

		const menuItem = await Menus.create({
			name,
			restaurantID,
			price,
			category: category || "main",
			image: image || "",
			taxPercent: 0,
			veg: "veg",
			hidden: false,
		});

		await invalidateRestaurantCache(restaurantID);

		await recordAudit({
			restaurantID,
			session: { username: session.username as string, role: session.role },
			action: "menu_setup",
			targetType: "menu",
			targetId: menuItem._id.toString(),
			ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
			userAgent: req.headers.get("user-agent") ?? undefined,
		});

		return Response.json({ menuItem });
	} catch (error) {
		console.error("Setup menu error:", error);
		return Response.json({ message: "Something went wrong" }, { status: 500 });
	}
}
