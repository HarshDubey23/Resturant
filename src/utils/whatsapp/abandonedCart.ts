import connectDB from "#utils/database/connect";
import { CartSessions } from "#utils/database/models/cartSession";
import { Customers } from "#utils/database/models/customer";
import { enqueueNotification } from "./notificationQueue";

const ABANDON_TIMEOUT_MS = 15 * 60 * 1000;

export async function detectAbandonedCarts(): Promise<number> {
	try {
		await connectDB();
		const cutoff = new Date(Date.now() - ABANDON_TIMEOUT_MS);

		const abandoned = await CartSessions.find({
			abandonedAt: { $exists: false },
			convertedToOrder: { $exists: false },
			updatedAt: { $lte: cutoff },
		}).lean();

		let count = 0;
		for (const cart of abandoned) {
			await CartSessions.updateOne({ _id: cart._id }, { $set: { abandonedAt: new Date() } });

			const customer = await Customers.findById(cart.customer).lean();
			if (customer?.phone && customer.whatsappOptIn) {
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
				count++;
			}
		}
		return count;
	} catch {
		return 0;
	}
}

export async function recoverCart(customerId: string, restaurantID: string): Promise<void> {
	await CartSessions.updateOne(
		{ customer: customerId, restaurantID, abandonedAt: { $exists: true } },
		{ $set: { recoveredAt: new Date() }, $unset: { abandonedAt: "" } },
	);
}
