import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Accounts } from "#utils/database/models/account";
import { Customers } from "#utils/database/models/customer";
import { Kitchens } from "#utils/database/models/kitchen";
import { Menus } from "#utils/database/models/menu";
import { Profiles } from "#utils/database/models/profile";
import { Tables } from "#utils/database/models/table";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";
import { captureError } from "#utils/helper/sentryWrapper";
import brewpointData from "./_data/brewpoint/brewpoint";
import demoData from "./_data/demo/demo";
import empire from "./_data/empire/empire";
import spiceroute from "./_data/spiceroute/spiceroute";

const deleteData = async (ids: string[]) => {
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

	return {
		processTime: (performance.now() - start) / 1000,
		results,
	};
};

const createData = async (props: TDocumentData) => {
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

	// After menus are saved, push their IDs onto account.menus so the
	// account payload returned to the client has the full menu list.
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
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
	// FIX (audit C4): hard-disable this route in production. Demo seeding
	// overwrites real customer data and must NEVER be reachable in a live
	// deployment, regardless of how DEMO_MODE is configured.
	if (process.env.NODE_ENV === "production") {
		return new Response(JSON.stringify({ message: "Not Found" }), { status: 404, headers: { "Content-Type": "application/json" } });
	}

	try {
		// FIX (audit C4): authenticate the admin FIRST, before checking
		// DEMO_MODE. Previously the DEMO_MODE check ran before auth, leaking
		// the demo-mode-enabled/disabled state to unauthenticated callers and
		// allowing a 403 (demo disabled) to be distinguished from a 401 (not
		// logged in) — an information-disclosure oracle. Now every
		// unauthenticated caller gets a 401 with no env-state leak.
		const session = await getServerSession(authOptions);
		if (!session || session.role !== "admin") {
			return new Response(JSON.stringify({ message: "Unauthorized. Admin access required." }), { status: 401, headers: { "Content-Type": "application/json" } });
		}

		if (process.env.DEMO_MODE !== "true") {
			return new Response(JSON.stringify({ message: "Demo mode is disabled. Set DEMO_MODE=true to seed demo data." }), { status: 403, headers: { "Content-Type": "application/json" } });
		}

		await connectDB();
		const start = performance.now();
		const deleteResult = await deleteData(["demo", "empire", "brewpoint", "spiceroute"]);

		await Customers.deleteMany({ restaurantID: "demo" });

		const [empireResult, brewpointResult, spicerouteResult, demoResult] = await Promise.all([
			createData(empire),
			createData(brewpointData),
			createData(spiceroute),
			createData(demoData),
		]);

		const demoCustomer = await new Customers({
			fname: "Demo",
			lname: "User",
			phone: "9999999999",
			restaurantID: "demo",
		}).save();

		const res = {
			totalProcessTime: (performance.now() - start) / 1000,
			delete: deleteResult,
			empire: empireResult,
			brewpoint: brewpointResult,
			spiceroute: spicerouteResult,
			demo: { ...demoResult, customer: demoCustomer },
		};
		return new Response(JSON.stringify(res, null, 4));
	} catch (err) {
		captureError(err, { route: "/api/refreshDemoData" });
		return CatchNextResponse(err);
	}
}

type TDocumentData = {
	account: unknown;
	profile: unknown;
	menus: Array<unknown>;
	kitchens: Array<unknown>;
	tables: Array<unknown>;
};
