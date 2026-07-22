/**
 * Direct DB seed — bypasses the /api/refreshDemoData auth gate so we can
 * seed an empty database. Uses the exact same createData() logic as the
 * API route so the result is identical to a successful admin refresh.
 *
 * Idempotent: deletes any existing demo/spiceroute/empire/brewpoint
 * documents first, then inserts.
 *
 * Run with:
 *   set -a && source .env.local && set +a && npx tsx scripts/seed-demo-direct.ts
 */
import { config } from "dotenv";

config({ path: ".env.local" });

// IMPORTANT: import after dotenv.config so process.env is populated
// for the Mongoose connect + schema pre-save hooks.
import connectDB from "../src/utils/database/connect";
import { Accounts } from "../src/utils/database/models/account";
import { Customers } from "../src/utils/database/models/customer";
import { Kitchens } from "../src/utils/database/models/kitchen";
import { Menus } from "../src/utils/database/models/menu";
import { Profiles } from "../src/utils/database/models/profile";
import { Tables } from "../src/utils/database/models/table";
import brewpointData from "../src/app/api/refreshDemoData/_data/brewpoint/brewpoint";
import demoData from "../src/app/api/refreshDemoData/_data/demo/demo";
import empire from "../src/app/api/refreshDemoData/_data/empire/empire";
import spiceroute from "../src/app/api/refreshDemoData/_data/spiceroute/spiceroute";

type TDocumentData = {
  account: unknown;
  profile: unknown;
  menus: Array<unknown>;
  kitchens: Array<unknown>;
  tables: Array<unknown>;
};

async function deleteData(ids: string[]) {
  const start = performance.now();
  const models = [
    { model: Menus, name: "Menus" },
    { model: Kitchens, name: "Kitchens" },
    { model: Profiles, name: "Profiles" },
    { model: Tables, name: "Tables" },
    { model: Accounts, name: "Accounts", field: "username" },
  ];
  const results = await Promise.all(
    models.map(async ({ model, name, field = "restaurantID" }) => {
      const res = await model.deleteMany({ [field]: { $in: ids } });
      return { model: name, ...res };
    }),
  );
  return { processTime: (performance.now() - start) / 1000, results };
}

async function createData(props: TDocumentData) {
  const { account, profile, menus, kitchens, tables } = props;
  const start = performance.now();
  // 1. Save Account WITHOUT profile — the Profile pre-save hook requires
  //    the Account to exist (it does Accounts.findOne({ username: restaurantID })).
  const newAccount = await new Accounts(account).save();
  // 2. Save Profile — its pre-save hook validates the account exists, and its
  //    post-save hook sets Account.profile = profile._id automatically.
  const newProfile = await new Profiles(profile).save();
  // 3. Now Menus can be saved — their pre-save hook re-fetches the Account
  //    with profile populated (the post-save above already linked them).
  const [newMenus, newKitchen, newTables] = await Promise.all([
    Promise.all(menus.map((m) => new Menus(m).save())),
    Promise.all(kitchens.map((k) => new Kitchens(k).save())),
    Promise.all(tables.map((t) => new Tables(t).save())),
  ]);
  newAccount.menus = newMenus.map((m) => m._id);
  newAccount.kitchens = newKitchen.map((k) => k._id);
  newAccount.tables = newTables.map((t) => t._id);
  await newAccount.save();
  return {
    processTime: (performance.now() - start) / 1000,
    account: newAccount,
    profile: newProfile,
    menus: newMenus,
    kitchens: newKitchen,
    tables: newTables,
  };
}

async function main() {
  await connectDB();
  console.log("Connected. Seeding demo restaurants...");

  const start = performance.now();
  console.log("Step 1/3: deleting existing demo data...");
  const deleteResult = await deleteData(["demo", "empire", "brewpoint", "spiceroute"]);
  await Customers.deleteMany({ restaurantID: "demo" });
  for (const r of deleteResult.results) {
    console.log(`  - ${r.model}: deleted ${r.deletedCount}`);
  }

  console.log("Step 2/3: creating demo restaurants (parallel)...");
  const [empireResult, brewpointResult, spicerouteResult, demoResult] = await Promise.all([
    createData(empire),
    createData(brewpointData),
    createData(spiceroute),
    createData(demoData),
  ]);
  console.log(
    `  empire: ${empireResult.menus.length} menus, ${empireResult.tables.length} tables (${empireResult.processTime.toFixed(2)}s)`,
  );
  console.log(
    `  brewpoint: ${brewpointResult.menus.length} menus, ${brewpointResult.tables.length} tables (${brewpointResult.processTime.toFixed(2)}s)`,
  );
  console.log(
    `  spiceroute: ${spicerouteResult.menus.length} menus, ${spicerouteResult.tables.length} tables (${spicerouteResult.processTime.toFixed(2)}s)`,
  );
  console.log(
    `  demo: ${demoResult.menus.length} menus, ${demoResult.tables.length} tables (${demoResult.processTime.toFixed(2)}s)`,
  );

  console.log("Step 3/3: creating demo customer...");
  const demoCustomer = await new Customers({
    fname: "Demo",
    lname: "User",
    phone: "9999999999",
    restaurantID: "demo",
  }).save();
  console.log(`  demo customer: ${demoCustomer._id}`);

  // Verify enrichment landed
  console.log("\nVerifying enrichment on demo menus...");
  const sample = await Menus.findOne({ restaurantID: "demo" }).lean();
  if (sample) {
    console.log(`  Sample menu item: ${sample.name}`);
    console.log(
      `    rating=${(sample as { rating?: number }).rating}, reviewCount=${(sample as { reviewCount?: number }).reviewCount}, spiceLevel=${(sample as { spiceLevel?: number }).spiceLevel}`,
    );
    console.log(`    tags=${JSON.stringify((sample as { tags?: string[] }).tags)}`);
  }

  console.log(`\n✓ Done in ${((performance.now() - start) / 1000).toFixed(2)}s`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
