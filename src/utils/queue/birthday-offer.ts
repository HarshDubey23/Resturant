import connectDB from "#utils/database/connect";
import { Customers } from "#utils/database/models/customer";
import { Loyalties } from "#utils/database/models/loyalty";
import { captureError } from "#utils/helper/sentryWrapper";
import { inngest } from "#utils/queue/inngest-client";
import { sendWhatsAppText } from "#utils/whatsapp/index";

const BIRTHDAY_OFFERS: Record<string, string> = {
	silver: "🎂 Celebrate your birthday with us! Get 20% off your next visit. Reply to redeem.",
	gold: "🎂 Happy Birthday! Enjoy a complimentary dessert + 30% off your next meal.",
	platinum: "🎂 Birthday treat: 50% off your entire bill or a free chef's tasting menu. Celebrate with us!",
};

const ANNIVERSARY_OFFERS: Record<string, string> = {
	silver: "💑 Happy Anniversary! Get 15% off your romantic dinner.",
	gold: "💑 Happy Anniversary! Enjoy a free appetizer + 25% off.",
	platinum: "💑 Anniversary special: free champagne toast + 40% off your meal.",
};

function getUpcomingDate(days: number) {
	const now = new Date();
	const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
	return { month: target.getMonth() + 1, date: target.getDate() };
}

export const birthdayOffer = inngest.createFunction(
	{
		id: "birthday-offer",
		name: "Birthday & Anniversary Offer",
		retries: 1,
		triggers: [{ cron: "30 3 * * *" }],
	},
	async ({ step }) => {
		await step.run("send-birthday-anniversary-offers", async () => {
			await connectDB();

			const { month, date } = getUpcomingDate(7);

			const birthdayMatches = await Loyalties.find({
				birthday: { $exists: true, $ne: null },
				$expr: {
					$and: [{ $eq: [{ $month: "$birthday" }, month] }, { $eq: [{ $dayOfMonth: "$birthday" }, date] }],
				},
			}).lean();

			const anniversaryMatches = await Loyalties.find({
				anniversary: { $exists: true, $ne: null },
				$expr: {
					$and: [{ $eq: [{ $month: "$anniversary" }, month] }, { $eq: [{ $dayOfMonth: "$anniversary" }, date] }],
				},
			}).lean();

			const results = { birthdaySent: 0, anniversarySent: 0, errors: 0 };

			for (const match of birthdayMatches) {
				try {
					const customer = await Customers.findById(match.customer).lean();
					if (!customer?.phone) continue;
					const message = BIRTHDAY_OFFERS[match.tier] || BIRTHDAY_OFFERS.silver;
					await sendWhatsAppText(customer.phone as string, message);
					results.birthdaySent++;
				} catch (err) {
					captureError(err, { context: "inngest/birthday-offer" });
					results.errors++;
				}
			}

			for (const match of anniversaryMatches) {
				try {
					const customer = await Customers.findById(match.customer).lean();
					if (!customer?.phone) continue;
					const message = ANNIVERSARY_OFFERS[match.tier] || ANNIVERSARY_OFFERS.silver;
					await sendWhatsAppText(customer.phone as string, message);
					results.anniversarySent++;
				} catch (err) {
					captureError(err, { context: "inngest/anniversary-offer" });
					results.errors++;
				}
			}

			return results;
		});
	},
);
