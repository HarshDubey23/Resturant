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
	const newAccount = await new Accounts(account).save();
	const newProfile = await new Profiles(profile).save();
	const [newMenus, newKitchen, newTables] = await Promise.all([
		Promise.all(menus.map((m) => new Menus(m).save())),
		Promise.all(kitchens.map((k) => new Kitchens(k).save())),
		Promise.all(tables.map((t) => new Tables(t).save())),
	]);

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
	await connectDB();
	try {
		if (process.env.DEMO_MODE !== "true") {
			return new Response(JSON.stringify({ message: "Demo mode is disabled. Set DEMO_MODE=true to seed demo data." }), { status: 403 });
		}
		const session = await getServerSession(authOptions);
		if (!session || session.role !== "admin") {
			return new Response(JSON.stringify({ message: "Unauthorized. Admin access required." }), { status: 401 });
		}
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
		console.log(err);
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
