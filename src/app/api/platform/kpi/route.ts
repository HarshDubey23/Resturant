import { NextResponse } from "next/server";
import connectDB from "#utils/database/connect";
import { Accounts } from "#utils/database/models/account";
import { Orders } from "#utils/database/models/order";
import { CatchNextResponse } from "#utils/helper/common";
import { requirePlatformAdmin } from "#utils/helper/platformAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
	try {
		await requirePlatformAdmin(req);
		await connectDB();

		// Total tenants (active accounts)
		const totalTenants = await Accounts.countDocuments({ accountActive: true });

		// MRR — count of accounts with active Stripe subscriptions
		// This is a simplified calculation; in production, Stripe API would give exact MRR
		const proAccounts = await Accounts.countDocuments({ subscriptionActive: true, plan: "pro" });
		const enterpriseAccounts = await Accounts.countDocuments({ subscriptionActive: true, plan: "enterprise" });
		// Estimated MRR (would be replaced with real Stripe subscription data)
		const mrrPro = proAccounts * 499; // ₹499/month per pro account
		const mrrEnterprise = enterpriseAccounts * 1999; // ₹1999/month per enterprise account
		const mrr = mrrPro + mrrEnterprise;

		// Orders this month
		const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
		const ordersThisMonth = await Orders.countDocuments({ createdAt: { $gte: startOfMonth } });

		// AI spend — placeholder; actual calculation would come from AIConfig + usage tracking
		const aiSpend = 0; // TODO: aggregate from AI usage logs

		// WhatsApp spend — placeholder; would come from Meta API billing
		const whatsappSpend = 0; // TODO: aggregate from WhatsApp usage logs

		return NextResponse.json({
			totalTenants,
			mrr,
			ordersThisMonth,
			aiSpend,
			whatsappSpend,
			planBreakdown: { free: totalTenants - proAccounts - enterpriseAccounts, pro: proAccounts, enterprise: enterpriseAccounts },
		});
	} catch (err) {
		return CatchNextResponse(err);
	}
}
