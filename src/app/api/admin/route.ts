import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Accounts, type TAccount } from "#utils/database/models/account";
import { Profiles } from "#utils/database/models/profile";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";

export async function GET() {
	try {
		await connectDB();
		const session = await getServerSession(authOptions);
		if (!session || session.role !== "admin") throw { status: 401, message: "Admin access required" };

		const account = await Accounts.findOne<TAccount>({ username: session?.username }).populate("profile").populate("tables").populate("menus").lean();

		if (!account) throw { status: 500, message: "Unable to fetch data" };

		return NextResponse.json({
			profile: account.profile,
			menus: account.menus,
			tables: account.tables,
		});
	} catch (err) {
		return CatchNextResponse(err);
	}
}

export async function POST(req: Request) {
	try {
		await connectDB();
		const session = await getServerSession(authOptions);
		if (!session || session.role !== "admin") throw { status: 401, message: "Admin access required" };

		const body = await req.json();
		const account = await Accounts.findOne<TAccount>({ username: session?.username }).populate("profile");
		if (!account) throw { status: 404, message: "Account not found" };

		const profileData = account.profile as { _id: string } | null;
		if (!profileData) throw { status: 404, message: "Profile not found" };

		const updateFields: Record<string, unknown> = {};
		if (body.name !== undefined) updateFields.name = body.name;
		if (body.description !== undefined) updateFields.description = body.description;
		if (body.address !== undefined) updateFields.address = body.address;
		if (body.phone !== undefined) updateFields.phone = body.phone;
		if (body.gstInclusive !== undefined) updateFields.gstInclusive = body.gstInclusive;
		if (body.gstNumber !== undefined) updateFields.gstNumber = body.gstNumber;
		if (body.upiId !== undefined) updateFields.upiId = body.upiId;
		if (body.currency !== undefined) updateFields.currency = body.currency;

		if (Object.keys(updateFields).length > 0) {
			await Profiles.findByIdAndUpdate(profileData._id, { $set: updateFields });
		}

		return NextResponse.json({ status: 200, message: "Profile updated" });
	} catch (err) {
		return CatchNextResponse(err);
	}
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
