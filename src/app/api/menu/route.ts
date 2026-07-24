import crypto from "node:crypto";

import omit from "lodash/omit";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { getRestaurantData } from "#utils/database/helper/account";
import type { TMenu } from "#utils/database/models/menu";
import type { TTable } from "#utils/database/models/table";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";
import { captureError } from "#utils/helper/sentryWrapper";

// FIX (audit C2): the public menu route leaked sensitive profile fields
// (phone, gstNumber, upiId, password, email) to every anonymous visitor.
// Build an explicit public-profile DTO that whitelists only the fields a
// customer needs to see the menu — credential and payment material is
// never sent to the browser.
function buildPublicProfile(profile: Record<string, unknown> | null | undefined): Record<string, unknown> {
	if (!profile) return {};
	// Stripping pin code from the address: the customer needs to know the
	// area/city to confirm they are at the right restaurant, but a full
	// postal address (with pin code) is PII that a public menu endpoint
	// has no reason to expose.
	const address =
		typeof profile.address === "string"
			? profile.address
					.replace(/\b\d{6}\b/g, "")
					.replace(/\s{2,}/g, " ")
					.trim()
			: profile.address;
	return {
		name: profile.name,
		description: profile.description,
		address,
		logoUrl: profile.logoUrl,
		avatar: profile.avatar,
		cover: profile.cover,
		themeColor: profile.themeColor,
		brandColor: profile.brandColor,
		currency: profile.currency,
		gstInclusive: profile.gstInclusive,
		categories: profile.categories,
		photos: profile.photos,
	};
}

export async function GET(req: Request) {
	try {
		let username = new URL(req.url).searchParams.get("id");

		if (!username) {
			const session = await getServerSession(authOptions);
			username = session?.username ?? null;
		}
		if (!username) throw { status: 400, message: "Restaurant id is required to fetch menu" };

		const account = await getRestaurantData(username);
		if (!account) throw { status: 404, message: `Account with restaurant id: ${username} is not found` };

		const payload = {
			...omit(account, [
				"__v",
				"_id",
				"kitchens",
				"password",
				"profile",
				"menus",
				"tables",
				"email",
				"stripeCustomerId",
				"stripeAccountId",
				"razorpayContactId",
				"razorpayFundAccountId",
				"razorpayAccountId",
				"n8nWebhookUrl",
				"platformAdmin",
			]),
			profile: buildPublicProfile(account?.profile as Record<string, unknown> | null | undefined),
			// FIX (audit C1): filter out hidden menu items so a draft /
			// disabled item is never surfaced to customers ordering from
			// the public menu. The admin menu editor still sees them via
			// the /api/admin/menu route.
			menus: (account?.menus ?? []).filter((v: TMenu) => !v?.hidden).map((v: TMenu) => omit(v, ["__v"])),
			tables: account?.tables.map((v: TTable) => omit(v, ["__v", "_id"])),
		};

		const body = JSON.stringify(payload);
		const etag = `"${crypto.createHash("md5").update(body).digest("hex")}"`;
		const ifNoneMatch = req.headers.get("if-none-match");
		if (ifNoneMatch === etag) {
			return new NextResponse(null, { status: 304, headers: { ETag: etag } });
		}

		return NextResponse.json(payload, {
			headers: {
				"Cache-Control": "public, max-age=300, s-maxage=600",
				ETag: etag,
			},
		});
	} catch (err) {
		// FIX (console.log sweep): surface menu-fetch failures to Sentry
		// instead of swallowing them with console.log.
		captureError(err, { route: "/api/menu" });
		return CatchNextResponse(err);
	}
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
