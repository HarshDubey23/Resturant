import { NextResponse } from "next/server";

import connectDB from "#utils/database/connect";
import { Customers } from "#utils/database/models/customer";
import { getRedis } from "#utils/database/redis";
import { CatchNextResponse } from "#utils/helper/common";
import { timingSafeStringEqual } from "#utils/helper/crypto";
import { generateVerificationToken } from "#utils/helper/otp";
import { rateLimit } from "#utils/helper/rateLimit";

const MAX_OTP_ATTEMPTS = 5; // per OTP lifetime
const VERIFY_RATE_LIMIT = 10; // per hour per phone
const VERIFY_RATE_WINDOW_MS = 60 * 60 * 1000;

// Demo mode mirrors the guard in authHelper's customer authorize and the
// send-otp route: DEMO_MODE=true AND restaurant="demo" AND non-production.
// In demo mode we short-circuit verification and return a signed token so the
// flow works end-to-end without a real OTP. The client normally skips this
// route in demo mode (send-otp returns demoMode:true → straight to details),
// but we handle it here for defense-in-depth.
function isDemoMode(restaurant: string): boolean {
	return restaurant === "demo" && process.env.NODE_ENV !== "production" && process.env.DEMO_MODE === "true";
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { restaurant, phone, otp, fname, lname } = body;

		if (!restaurant || !phone || !otp) throw { status: 400, message: "restaurant, phone, and otp are required" };

		// Throttle verification attempts to slow brute-force guessing.
		const verifyLimit = await rateLimit(`verify-otp:${restaurant}:${phone}`, VERIFY_RATE_LIMIT, VERIFY_RATE_WINDOW_MS);
		if (!verifyLimit.ok) {
			return NextResponse.json(
				{ status: 429, message: "Too many verification attempts. Please try again later." },
				{ status: 429, headers: { "Retry-After": String(Math.ceil(verifyLimit.resetIn / 1000)) } },
			);
		}

		await connectDB();

		// Demo mode short-circuit: skip OTP check, issue a signed verificationToken
		// so the customer authorize callback (which also skips in demo mode) can
		// proceed. demoMode is ONLY returned under the strict guard above.
		if (isDemoMode(restaurant)) {
			let demoCustomer = await Customers.findOne({ phone, restaurantID: restaurant });
			if (!demoCustomer) {
				demoCustomer = await Customers.create({
					fname: fname?.trim() || "Guest",
					lname: lname?.trim() || "User",
					phone,
					restaurantID: restaurant,
				});
			}
			const verificationToken = generateVerificationToken(demoCustomer._id.toString());
			return NextResponse.json({
				status: 200,
				demoMode: true,
				verificationToken,
				customer: {
					_id: demoCustomer._id,
					fname: demoCustomer.fname,
					lname: demoCustomer.lname,
					phone: demoCustomer.phone,
				},
			});
		}

		const redis = getRedis();
		const storedOtp = await redis.get<string>(`otp:${restaurant}:${phone}`);

		if (!storedOtp) throw { status: 401, message: "OTP expired or not found. Request a new one." };

		// Track attempts against this specific OTP; burn it after too many failures.
		const attemptsKey = `otp-attempts:${restaurant}:${phone}`;
		const attempts = Number((await redis.get<string>(attemptsKey)) ?? "0");
		if (attempts >= MAX_OTP_ATTEMPTS) {
			await redis.del(`otp:${restaurant}:${phone}`);
			await redis.del(attemptsKey);
			throw { status: 401, message: "Too many failed attempts. Request a new OTP." };
		}

		// Constant-time comparison prevents timing side-channel enumeration.
		if (!timingSafeStringEqual(storedOtp, String(otp))) {
			await redis.setex(attemptsKey, 300, String(attempts + 1));
			throw { status: 401, message: "Invalid OTP" };
		}

		await redis.del(`otp:${restaurant}:${phone}`);
		await redis.del(attemptsKey);

		let customer = await Customers.findOne({ phone, restaurantID: restaurant });
		if (!customer) {
			customer = await Customers.create({
				fname: fname?.trim() || "Guest",
				lname: lname?.trim() || "User",
				phone,
				restaurantID: restaurant,
			});
		} else if ((fname?.trim() || lname?.trim()) && (customer.fname === "Guest" || customer.lname === "User")) {
			// Update the placeholder name if the user provided their real name
			customer.fname = fname?.trim() || customer.fname;
			customer.lname = lname?.trim() || customer.lname;
			await customer.save();
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
