/**
 * Direct DB seed script — refreshes all 4 demo restaurants with the
 * newly enriched menu data (rating, tags, spiceLevel, originalPrice).
 * Run with: npx tsx scripts/refresh-demo-data-direct.ts
 */
import mongoose from "mongoose";
import "dotenv/config";

import { Accounts } from "../src/utils/database/models/account";
import { Customers } from "../src/utils/database/models/customer";
import { Kitchens } from "../src/utils/database/models/kitchen";
import { Menus } from "../src/utils/database/models/menu";
import { Profiles } from "../src/utils/database/models/profile";
import { Tables } from "../src/utils/database/models/table";
import brewpointData from "../src/app/api/refreshDemoData/_data/brewpoint/brewpoint";
import demoData from "../src/app/api/refreshDemoData/_data/demo/demo";
import empireData from "../src/app/api/refreshDemoData/_data/empire/empire";
import spicerouteData from "../src/app/api/refreshDemoData/_data/spiceroute/spiceroute";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
        console.error("MONGODB_URI env var is required");
        process.exit(1);
}

async function main() {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URI);
        console.log("Connected.");

        const allData = [spicerouteData, empireData, brewpointData, demoData];
        const ids = allData.map((d) => d.account.username);

        console.log(`Refreshing demo data for: ${ids.join(", ")}`);

        // Wipe existing demo data
        await Promise.all([
                Menus.deleteMany({ restaurantID: { $in: ids } }),
                Kitchens.deleteMany({ restaurantID: { $in: ids } }),
                Profiles.deleteMany({ restaurantID: { $in: ids } }),
                Tables.deleteMany({ restaurantID: { $in: ids } }),
                Accounts.deleteMany({ username: { $in: ids } }),
                Customers.deleteMany({ restaurantID: { $in: ids } }),
        ]);
        console.log("Old demo data wiped.");

        // Insert fresh
        for (const data of allData) {
                await Accounts.create(data.account);
                await Profiles.create(data.profile);
                await Tables.insertMany(data.tables);
                await Menus.insertMany(data.menus);
                if ((data as { kitchens?: unknown[] }).kitchens?.length) await Kitchens.insertMany((data as { kitchens: unknown[] }).kitchens);
                console.log(`  ✓ ${data.account.username} — ${data.menus.length} menu items`);
        }

        // Verify enrichment
        const sample = await Menus.findOne({ restaurantID: "spiceroute" }).lean();
        console.log("\nSample enriched item:");
        console.log(`  Name: ${sample?.name}`);
        console.log(`  Rating: ${sample?.rating}`);
        console.log(`  Tags: ${JSON.stringify(sample?.tags)}`);
        console.log(`  SpiceLevel: ${sample?.spiceLevel}`);
        console.log(`  OriginalPrice: ${sample?.originalPrice ?? "—"}`);

        await mongoose.disconnect();
        console.log("\nDone. Demo data refreshed with premium UI fields.");
}

main().catch((err) => {
        console.error("Failed:", err);
        process.exit(1);
});
