import { NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "#utils/database/connect";
import { Accounts } from "#utils/database/models/account";
import { CatchNextResponse } from "#utils/helper/common";
import { requirePlatformAdmin } from "#utils/helper/platformAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
	try {
		await requirePlatformAdmin(req);
		await connectDB();

		const url = new URL(req.url);
		const page = Number(url.searchParams.get("page") || "1");
		const limit = Number(url.searchParams.get("limit") || "20");
		const search = url.searchParams.get("search") || "";

		const skip = (page - 1) * limit;

		const filter = search
			? {
					$or: [{ username: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }],
				}
			: {};

		const total = await Accounts.countDocuments(filter);
		const tenants = await Accounts.find(filter)
			.select("username email accountActive subscriptionActive plan createdAt platformAdmin")
			.populate("profile", "name avatar")
			.skip(skip)
			.limit(limit)
			.sort({ createdAt: -1 })
			.lean();

		return NextResponse.json({
			tenants,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		});
	} catch (err) {
		return CatchNextResponse(err);
	}
}

// Suspend/unsuspend action
const SuspendSchema = z.object({
	accountId: z.string().min(1),
	suspended: z.boolean(),
});

export async function PATCH(req: Request) {
	try {
		await requirePlatformAdmin(req);
		await connectDB();

		const body = await req.json();
		const parsed = SuspendSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json({ message: "Invalid input", errors: parsed.error.flatten() }, { status: 400 });
		}

		const { accountId, suspended } = parsed.data;
		const account = await Accounts.findByIdAndUpdate(accountId, { $set: { accountActive: !suspended } }, { new: true })
			.select("username accountActive")
			.lean();

		if (!account) {
			return NextResponse.json({ message: "Account not found" }, { status: 404 });
		}

		return NextResponse.json({ account });
	} catch (err) {
		return CatchNextResponse(err);
	}
}
