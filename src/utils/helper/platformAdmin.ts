import { getServerSession } from "next-auth";
import { authOptions } from "#utils/helper/authHelper";

export async function requirePlatformAdmin(_req: Request) {
	const session = await getServerSession(authOptions);
	if (!session || session.role !== "admin" || !session.platformAdmin) {
		throw { status: 403, message: "Platform admin access required" };
	}
	return session;
}
