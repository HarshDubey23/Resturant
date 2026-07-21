import { NextResponse } from "next/server";

import connectDB from "#utils/database/connect";
import { Customers } from "#utils/database/models/customer";
import { getRedis } from "#utils/database/redis";
import { CatchNextResponse } from "#utils/helper/common";
import { generateVerificationToken } from "#utils/helper/otp";

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { restaurant, phone, otp } = body;

		if (!restaurant || !phone || !otp) throw { status: 400, message: "restaurant, phone, and otp are required" };

		await connectDB();

		const redis = getRedis();
		const storedOtp = await redis.get<string>(`otp:${restaurant}:${phone}`);

		if (!storedOtp) throw { status: 401, message: "OTP expired or not found. Request a new one." };
		if (storedOtp !== otp) throw { status: 401, message: "Invalid OTP" };

		await redis.del(`otp:${restaurant}:${phone}`);

		let customer = await Customers.findOne({ phone, restaurantID: restaurant });
		if (!customer) {
			customer = await Customers.create({
				fname: "Guest",
				lname: "User",
				phone,
				restaurantID: restaurant,
			});
		}

		const verificationToken = generateVerificationToken(customer._id.toString());

		return NextResponse.json({
			status: 200,
			verificationToken,
			customer: {
				_id: customer._id,
				fname: customer.fname,
				lname: customer.lname,
				phone: customer.phone,
			},
		});
	} catch (err) {
		return CatchNextResponse(err);
	}
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
