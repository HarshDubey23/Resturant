import { z } from "zod";

import connectDB from "#utils/database/connect";
import { Coupons } from "#utils/database/models/coupon";
import { recordAudit } from "#utils/helper/audit";
import { withPermission } from "#utils/helper/rbac";
import { captureError } from "#utils/helper/sentryWrapper";

type SessionWithRole = {
	username?: string;
	email?: string;
	role?: string;
	permissions?: string[];
};

// ─── GET: list coupons (paginated) ────────────────────────────
async function handleGet(req: Request, session: SessionWithRole): Promise<Response> {
	try {
		await connectDB();
		const restaurantID = session.username ?? "";

		const url = new URL(req.url);
		const page = Number(url.searchParams.get("page") ?? "1");
		const limit = Number(url.searchParams.get("limit") ?? "20");
		const skip = (page - 1) * limit;

		const [coupons, total] = await Promise.all([
			Coupons.find({ restaurantID }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
			Coupons.countDocuments({ restaurantID }),
		]);

		return Response.json({ coupons, total, page, limit });
	} catch (err) {
		captureError(err, { route: "/api/admin/coupons GET" });
		return Response.json({ message: "Internal server error" }, { status: 500 });
	}
}

// ─── POST: create coupon ─────────────────────────────────────
const createSchema = z.object({
	code: z.string().min(1, "Coupon code is required").max(30, "Code too long"),
	discountType: z.enum(["percentage", "flat"]),
	discountValue: z.number().positive("Discount value must be positive"),
	validFrom: z.string().transform((v) => new Date(v)),
	validUntil: z.string().transform((v) => new Date(v)),
	usageLimit: z.number().int().positive().nullable().optional(),
	minOrderValue: z.number().positive().optional(),
});

async function handlePost(req: Request, session: SessionWithRole): Promise<Response> {
	try {
		await connectDB();
		const restaurantID = session.username ?? "";

		const body = await req.json();
		const parsed = createSchema.safeParse(body);
		if (!parsed.success) {
			return Response.json({ message: "Validation failed", errors: parsed.error.flatten().fieldErrors }, { status: 400 });
		}

		const data = parsed.data;
		const code = data.code.toUpperCase();

		// Check code uniqueness for the restaurant
		const existing = await Coupons.findOne({ restaurantID, code });
		if (existing) {
			return Response.json({ message: `Coupon code "${code}" already exists for this restaurant` }, { status: 409 });
		}

		// Validate date range
		if (data.validUntil <= data.validFrom) {
			return Response.json({ message: "validUntil must be after validFrom" }, { status: 400 });
		}

		// Validate percentage range
		if (data.discountType === "percentage" && data.discountValue > 100) {
			return Response.json({ message: "Percentage discount cannot exceed 100" }, { status: 400 });
		}

		const coupon = await Coupons.create({
			restaurantID,
			code,
			discountType: data.discountType,
			discountValue: data.discountValue,
			validFrom: data.validFrom,
			validUntil: data.validUntil,
			usageLimit: data.usageLimit ?? null,
			minOrderAmount: data.minOrderValue ?? 0,
			isActive: true,
		});

		await recordAudit({
			restaurantID,
			session: { username: session.username, role: session.role },
			action: "menu_create",
			targetType: "coupon",
			targetId: coupon._id.toString(),
		});

		return Response.json({ coupon }, { status: 201 });
	} catch (err) {
		captureError(err, { route: "/api/admin/coupons POST" });
		return Response.json({ message: "Internal server error" }, { status: 500 });
	}
}

// ─── PATCH: update coupon (only active fields, not code) ─────
const updateSchema = z.object({
	id: z.string().min(1, "Coupon ID is required"),
	discountType: z.enum(["percentage", "flat"]).optional(),
	discountValue: z.number().positive().optional(),
	validFrom: z
		.string()
		.transform((v) => new Date(v))
		.optional(),
	validUntil: z
		.string()
		.transform((v) => new Date(v))
		.optional(),
	usageLimit: z.number().int().positive().nullable().optional(),
	minOrderValue: z.number().positive().optional(),
	isActive: z.boolean().optional(),
});

async function handlePatch(req: Request, session: SessionWithRole): Promise<Response> {
	try {
		await connectDB();
		const restaurantID = session.username ?? "";

		const body = await req.json();
		const parsed = updateSchema.safeParse(body);
		if (!parsed.success) {
			return Response.json({ message: "Validation failed", errors: parsed.error.flatten().fieldErrors }, { status: 400 });
		}

		const data = parsed.data;
		const { id, ...updateFields } = data;

		// Remove undefined fields
		const cleanUpdate: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(updateFields)) {
			if (value !== undefined) {
				cleanUpdate[key === "minOrderValue" ? "minOrderAmount" : key] = value;
			}
		}

		if (Object.keys(cleanUpdate).length === 0) {
			return Response.json({ message: "No fields to update" }, { status: 400 });
		}

		const coupon = await Coupons.findOneAndUpdate({ _id: id, restaurantID }, { $set: cleanUpdate }, { new: true }).lean();
		if (!coupon) {
			return Response.json({ message: "Coupon not found" }, { status: 404 });
		}

		await recordAudit({
			restaurantID,
			session: { username: session.username, role: session.role },
			action: "menu_update",
			targetType: "coupon",
			targetId: id,
		});

		return Response.json({ coupon });
	} catch (err) {
		captureError(err, { route: "/api/admin/coupons PATCH" });
		return Response.json({ message: "Internal server error" }, { status: 500 });
	}
}

// ─── DELETE: soft delete (set isActive=false) ────────────────
const deleteSchema = z.object({
	id: z.string().min(1, "Coupon ID is required"),
});

async function handleDelete(req: Request, session: SessionWithRole): Promise<Response> {
	try {
		await connectDB();
		const restaurantID = session.username ?? "";

		const body = await req.json();
		const parsed = deleteSchema.safeParse(body);
		if (!parsed.success) {
			return Response.json({ message: "Validation failed", errors: parsed.error.flatten().fieldErrors }, { status: 400 });
		}

		const { id } = parsed.data;

		const coupon = await Coupons.findOneAndUpdate({ _id: id, restaurantID }, { $set: { isActive: false } }, { new: true }).lean();
		if (!coupon) {
			return Response.json({ message: "Coupon not found" }, { status: 404 });
		}

		await recordAudit({
			restaurantID,
			session: { username: session.username, role: session.role },
			action: "menu_delete",
			targetType: "coupon",
			targetId: id,
		});

		return Response.json({ coupon });
	} catch (err) {
		captureError(err, { route: "/api/admin/coupons DELETE" });
		return Response.json({ message: "Internal server error" }, { status: 500 });
	}
}

// ─── Route dispatcher ────────────────────────────────────────
export async function GET(req: Request): Promise<Response> {
	return withPermission("menu.read", handleGet)(req);
}

export async function POST(req: Request): Promise<Response> {
	return withPermission("menu.write", handlePost)(req);
}

export async function PATCH(req: Request): Promise<Response> {
	return withPermission("menu.write", handlePatch)(req);
}

export async function DELETE(req: Request): Promise<Response> {
	return withPermission("menu.write", handleDelete)(req);
}
