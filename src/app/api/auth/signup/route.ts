import connectDB from "#utils/database/connect";
import { Accounts } from "#utils/database/models/account";
import { Profiles } from "#utils/database/models/profile";
import { rateLimitMiddleware } from "#utils/helper/rateLimit";
import { signupSchema } from "#utils/helper/validation";

export async function POST(req: Request) {
	const ip = req.headers.get("x-forwarded-for") ?? "unknown";
	const rateLimitResponse = rateLimitMiddleware(`signup:${ip}`, 5, 60000);
	if (rateLimitResponse) return rateLimitResponse;

	try {
		const body = await req.json();
		const parsed = signupSchema.safeParse(body);
		if (!parsed.success) {
			return Response.json({ message: parsed.error.issues[0].message }, { status: 400 });
		}

		const { email, password, restaurantName, restaurantID } = parsed.data;

		await connectDB();

		const existingEmail = await Accounts.findOne({ email });
		if (existingEmail) {
			return Response.json({ message: "An account with this email already exists" }, { status: 409 });
		}

		const existingUsername = await Accounts.findOne({ username: restaurantID });
		if (existingUsername) {
			return Response.json({ message: "This restaurant URL is already taken" }, { status: 409 });
		}

		await Accounts.create({
			username: restaurantID,
			email,
			password,
			plan: "free",
			maxTables: 5,
			maxMenuItems: 20,
		});

		await Profiles.create({
			name: restaurantName,
			restaurantID,
		});

		return Response.json({
			message: "Account created successfully",
			restaurantID,
		});
	} catch (error) {
		console.error("Signup error:", error);
		return Response.json({ message: "Something went wrong" }, { status: 500 });
	}
}
