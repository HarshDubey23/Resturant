import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Feedbacks } from "#utils/database/models/feedback";
import { Orders } from "#utils/database/models/order";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: "Authentication Required" };

		await connectDB();

		const { orderId, rating, review, foodQuality, serviceSpeed, taste } = await req.json();
		if (!orderId || !rating) throw { status: 400, message: "orderId and rating are required" };
		if (rating < 1 || rating > 5) throw { status: 400, message: "Rating must be between 1 and 5" };

		const restaurantID = session.restaurant?.username || session.username;
		const customerId = session.customer?._id;
		if (!customerId) throw { status: 403, message: "Customer access required" };

		const order = await Orders.findOne({ _id: orderId, restaurantID, customer: customerId });
		if (!order) throw { status: 404, message: "Order not found" };
		if (order.state !== "complete") throw { status: 400, message: "Can only review completed orders" };

		const existing = await Feedbacks.findOne({ order: orderId });
		if (existing) throw { status: 409, message: "Already reviewed this order" };

		const feedback = await Feedbacks.create({
			restaurantID,
			order: orderId,
			customer: customerId,
			rating,
			review,
			foodQuality,
			serviceSpeed,
			taste,
		});

		return NextResponse.json(feedback, { status: 201 });
	} catch (err) {
		return CatchNextResponse(err);
	}
}

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);

		// Public reviews for a restaurant's page — ratings and reviews are
		// meant to be read by prospective diners (Swiggy/Zomato pattern).
		// Only non-sensitive fields are exposed.
		if (searchParams.get("public") === "true") {
			const restaurantID = searchParams.get("restaurant")?.toLowerCase();
			if (!restaurantID) throw { status: 400, message: "restaurant is required" };

			await connectDB();

			const [feedbacks, stats] = await Promise.all([
				Feedbacks.find({ restaurantID })
					.sort({ createdAt: -1 })
					.limit(30)
					.populate("customer", "fname")
					.select("rating review foodQuality serviceSpeed taste createdAt customer")
					.lean(),
				Feedbacks.aggregate([
					{ $match: { restaurantID } },
					{
						$group: {
							_id: null,
							averageRating: { $avg: "$rating" },
							totalReviews: { $sum: 1 },
							five: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
							four: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
							three: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
							two: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
							one: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
						},
					},
				]),
			]);

			const summary = stats[0] ?? { averageRating: 0, totalReviews: 0, five: 0, four: 0, three: 0, two: 0, one: 0 };
			return NextResponse.json({ feedbacks, summary });
		}

		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: "Authentication Required" };

		await connectDB();

		const orderId = searchParams.get("orderId");
		const restaurantID = session.restaurant?.username || session.username;

		if (orderId) {
			const feedback = await Feedbacks.findOne({ order: orderId }).populate("customer", "fname lname").lean();
			return NextResponse.json(feedback || null);
		}

		if (session.role === "admin") {
			const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
			const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
			const skip = (page - 1) * limit;
			const [feedbacks, total] = await Promise.all([
				Feedbacks.find({ restaurantID }).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("customer", "fname lname").lean(),
				Feedbacks.countDocuments({ restaurantID }),
			]);
			return NextResponse.json({ feedbacks, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
		}

		throw { status: 403, message: "Access denied" };
	} catch (err) {
		return CatchNextResponse(err);
	}
}
