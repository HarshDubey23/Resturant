/**
 * One-off migration script: converts base64 image data stored in the Menus
 * collection into proper R2 object URLs.
 *
 * Run manually: pnpm exec tsx scripts/migrate-base64-to-r2.ts
 *
 * For every Menus document whose `image` field starts with "data:", this
 * script:
 *   1. Decodes the base64 bytes
 *   2. Uploads to R2 under `menu/{restaurantID}/{slug}.{ext}`
 *   3. Updates the field to the public URL
 */
import mongoose from "mongoose";

// Reuse the project's models by importing the compiled ones
import "../src/utils/database/models/menu";
import "../src/utils/database/models/account";

import { Menus } from "../src/utils/database/models/menu";
import { uploadImage, isR2Configured } from "../src/utils/storage/r2";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
	console.error("MONGODB_URI is required. Set it in your environment or .env.local");
	process.exit(1);
}

async function main() {
	if (!isR2Configured()) {
		console.error("R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_PUBLIC_URL.");
		process.exit(1);
	}

	await mongoose.connect(MONGODB_URI);
	console.log("Connected to MongoDB");

	// Find all menu items with base64 image data
	const items = await Menus.find({ image: /^data:/ }).lean();
	console.log(`Found ${items.length} menu items with base64 images`);

	if (items.length === 0) {
		console.log("No items to migrate. Exiting.");
		await mongoose.disconnect();
		return;
	}

	let migrated = 0;
	let failed = 0;

	for (const item of items) {
		try {
			// Parse the data URL: data:image/png;base64,iVBORw0KGgo...
			const match = (item.image as string).match(/^data:(image\/[a-z+]+);base64,(.+)$/);
			if (!match) {
				console.warn(`Skipping item ${item._id}: cannot parse data URL`);
				failed++;
				continue;
			}

			const contentType = match[1];
			const base64Data = match[2];
			const buffer = Buffer.from(base64Data, "base64");

			// Determine extension from content type
			const extMap: Record<string, string> = {
				"image/jpeg": "jpg",
				"image/png": "png",
				"image/webp": "webp",
				"image/gif": "gif",
				"image/avif": "avif",
			};
			const ext = extMap[contentType] || "jpg";

			// Build the slug from item name
			const slug = (item.name as string)
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/^-|-$/g, "")
				.slice(0, 40);

			const key = `${slug}-${Date.now().toString(36)}.${ext}`;

			// Upload to R2
			const publicUrl = await uploadImage({
				buffer,
				key,
				contentType,
				bucket: "menu",
			});

			if (!publicUrl) {
				console.error(`Failed to upload image for item ${item._id} (${item.name})`);
				failed++;
				continue;
			}

			// Update the document
			await Menus.updateOne({ _id: item._id }, { $set: { image: publicUrl } });
			console.log(`Migrated: ${item.name} → ${publicUrl}`);
			migrated++;
		} catch (err) {
			console.error(`Error migrating item ${item._id}:`, err);
			failed++;
		}
	}

	console.log(`\nMigration complete: ${migrated} migrated, ${failed} failed out of ${items.length} total`);
	await mongoose.disconnect();
}

main().catch((err) => {
	console.error("Migration script failed:", err);
	process.exit(1);
});
