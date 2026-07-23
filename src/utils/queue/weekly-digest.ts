import connectDB from "#utils/database/connect";
import { Accounts } from "#utils/database/models/account";
import { Customers } from "#utils/database/models/customer";
import { Orders } from "#utils/database/models/order";
import { captureError } from "#utils/helper/sentryWrapper";
import { inngest } from "#utils/queue/inngest-client";

export const weeklyDigest = inngest.createFunction(
	{
		id: "weekly-digest",
		name: "Weekly Analytics Digest",
		retries: 1,
		triggers: [{ cron: "30 3 * * 1" }],
	},
	async ({ step }) => {
		await step.run("send-weekly-digest-emails", async () => {
			await connectDB();

			const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

			// Find all active owner accounts
			const activeAccounts = await Accounts.find({
				accountActive: true,
				subscriptionActive: true,
			})
				.populate("profile")
				.lean();

			const results = { sent: 0, skipped: 0, errors: 0 };

			for (const account of activeAccounts) {
				try {
					const username = account.username;
					if (!username) {
						results.skipped++;
						continue;
					}

					// Aggregate analytics for the previous 7 days
					const orders = await Orders.find({
						restaurantID: username,
						createdAt: { $gte: sevenDaysAgo },
					}).lean();

					const totalOrders = orders.length;
					const completedOrders = orders.filter((o) => o.state === "complete").length;
					const cancelledOrders = orders.filter((o) => o.state === "cancel").length;
					const revenue = orders.filter((o) => o.paymentStatus === "paid" && o.state === "complete").reduce((sum, o) => sum + (o.orderTotal || 0), 0);
					const avgOrderValue = completedOrders > 0 ? Math.round(revenue / completedOrders) : 0;

					const newCustomers = await Customers.countDocuments({
						restaurantID: username,
						createdAt: { $gte: sevenDaysAgo },
					});

					// Build digest summary text
					const profile = account.profile as Record<string, unknown> | null;
					const restaurantName = (profile?.name as string) || username;

					const digestHtml = `
<!DOCTYPE html>
<html>
<head><style>body{font-family:system-ui,sans-serif;color:#1e293b;padding:24px;max-width:600px}h1{color:#7c3aed;font-size:20px;margin-bottom:16px}table{width:100%;border-collapse:collapse;margin:16px 0}td{padding:8px 12px;border-bottom:1px solid #e2e8f0}td:first-child{color:#64748b;font-weight:500}td:last-child{font-weight:700;color:#1e293b}.footer{color:#94a3b8;font-size:12px;margin-top:24px;border-top:1px solid #e2e8f0;padding-top:12px}</style></head>
<body>
<h1>📊 Weekly Digest — ${restaurantName}</h1>
<p>Here's your analytics summary for the past 7 days:</p>
<table>
<tr><td>Total Orders</td><td>${totalOrders}</td></tr>
<tr><td>Completed Orders</td><td>${completedOrders}</td></tr>
<tr><td>Cancelled Orders</td><td>${cancelledOrders}</td></tr>
<tr><td>Revenue</td><td>₹${revenue.toLocaleString()}</td></tr>
<tr><td>Avg. Order Value</td><td>₹${avgOrderValue}</td></tr>
<tr><td>New Customers</td><td>${newCustomers}</td></tr>
</table>
<div class="footer">OrderWorder — Powered by data. Delivered weekly.</div>
</body>
</html>`;

					if (!account.email) {
						results.skipped++;
						continue;
					}

					// Use Resend directly since this isn't a standard template
					const resendModule = await import("resend");
					const Resend = resendModule.Resend;
					const resendClient = new Resend(process.env.RESEND_API_KEY);

					const FROM_ADDRESS = process.env.NODE_ENV === "production" ? "OrderWorder <noreply@orderworder.com>" : "OrderWorder <onboarding@resend.dev>";

					await resendClient.emails.send({
						from: FROM_ADDRESS,
						to: account.email,
						subject: `📊 Weekly Digest — ${restaurantName}`,
						html: digestHtml,
					});

					results.sent++;
				} catch (err) {
					captureError(err, { context: "weekly-digest", account: account.username });
					results.errors++;
				}
			}

			return results;
		});
	},
);
