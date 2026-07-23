import connectDB from "#utils/database/connect";
import { CartSessions } from "#utils/database/models/cartSession";
import { Customers } from "#utils/database/models/customer";
import { captureError } from "#utils/helper/sentryWrapper";
import { inngest } from "#utils/queue/inngest-client";
import { enqueueNotification } from "#utils/whatsapp/notificationQueue";

const ABANDON_TIMEOUT_MS = 15 * 60 * 1000; // 15 min

export const abandonedCartReminder = inngest.createFunction(
	{
		id: "abandoned-cart-reminder",
		name: "Abandoned Cart Reminder",
		retries: 1,
		triggers: [{ cron: "*/5 * * * *" }],
	},
	async ({ step }) => {
		await step.run("find-and-remind-abandoned-carts", async () => {
			await connectDB();
			const cutoff = new Date(Date.now() - ABANDON_TIMEOUT_MS);

			const abandoned = await CartSessions.find({
				abandonedAt: { $lte: cutoff },
				convertedToOrder: null,
				recoveredAt: null,
			}).lean();

			let reminded = 0;

			for (const cart of abandoned) {
				try {
					const customer = await Customers.findById(cart.customer).lean();
					if (!customer?.phone) continue;

					await enqueueNotification({
						restaurantID: cart.restaurantID,
						channel: "whatsapp",
						recipient: customer.phone,
						template: "abandoned_cart",
						params: {
							name: customer.fname || "Guest",
							items: cart.items.length.toString(),
						},
						priority: 5,
					});

					await CartSessions.updateOne({ _id: cart._id }, { $set: { recoveredAt: new Date() } });
					reminded++;
				} catch (err) {
					captureError(err, { context: "abandoned-cart-reminder", cartId: cart._id.toString() });
				}
			}

			return { reminded };
		});
	},
);
