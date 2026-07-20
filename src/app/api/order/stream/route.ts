import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import type { TCustomer } from "#utils/database/models/customer";
import type { TMenu } from "#utils/database/models/menu";
import { Orders, type TOrder, type TProduct } from "#utils/database/models/order";
import { authOptions } from "#utils/helper/authHelper";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
	const session = await getServerSession(authOptions);
	if (!session) {
		return new Response("Unauthorized", { status: 401 });
	}

	const restaurantID = session?.username || session?.restaurant?.username;
	if (!restaurantID) {
		return new Response("Restaurant ID required", { status: 400 });
	}

	await connectDB();

	const encoder = new TextEncoder();
	let lastEventId = 0;

	const stream = new ReadableStream({
		async start(controller) {
			const sendEvent = (data: unknown) => {
				lastEventId++;
				const message = `id: ${lastEventId}\nevent: order\ndata: ${JSON.stringify(data)}\n\n`;
				controller.enqueue(encoder.encode(message));
			};

			const pollAndSend = async () => {
				try {
					const orders = await Orders.find({ restaurantID })
						.populate<{ customer: TCustomer }>("customer")
						.populate<{ products: { product: TMenu }[] }>("products.product")
						.sort({ updatedAt: -1 })
						.limit(50)
						.lean();

					const formattedOrders = (orders as unknown as TOrder[]).map((order) => {
						if (order?.products) {
							const products = order.products.map((p) => {
								const product = p as unknown as TProduct;
								const menu = product.product as unknown as TMenu;
								return { ...product, ...menu, product: menu?._id };
							});
							return { ...order, products };
						}
						return order;
					});

					sendEvent({ type: "orders", data: formattedOrders, timestamp: Date.now() });
				} catch {
					sendEvent({ type: "error", message: "Failed to fetch orders" });
				}
			};

			await pollAndSend();

			const interval = setInterval(pollAndSend, 3000);

			req.signal.addEventListener("abort", () => {
				clearInterval(interval);
				controller.close();
			});
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache, no-transform",
			Connection: "keep-alive",
		},
	});
}
