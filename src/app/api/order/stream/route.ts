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
	let changeStream: ReturnType<typeof Orders.watch> | null = null;
	let pollingInterval: ReturnType<typeof setInterval> | null = null;
	let usePolling = false;

	const stream = new ReadableStream({
		async start(controller) {
			const sendEvent = (data: unknown) => {
				lastEventId++;
				const message = `id: ${lastEventId}\nevent: order\ndata: ${JSON.stringify(data)}\n\n`;
				try {
					controller.enqueue(encoder.encode(message));
				} catch {}
			};

			const formatOrders = async () => {
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
			};

			const pollAndSend = async () => {
				try {
					await formatOrders();
				} catch {
					sendEvent({ type: "error", message: "Failed to fetch orders" });
				}
			};

			try {
				const db = (await import("mongoose")).default.connection.db;
				if (db) {
					changeStream = Orders.watch(
						[
							{
								$match: {
									operationType: { $in: ["insert", "update", "replace"] },
									"fullDocument.restaurantID": restaurantID,
								},
							},
						],
						{ fullDocument: "updateLookup" },
					);

					changeStream.on("change", async () => {
						try {
							await formatOrders();
						} catch {
							sendEvent({ type: "error", message: "Failed to fetch orders after change" });
						}
					});

					changeStream.on("error", (err: Error) => {
						console.warn("[order/stream] Change Stream error (replica set required?):", err.message);
						console.warn("[order/stream] Falling back to polling mode at 10s interval");
						usePolling = true;
						changeStream?.close();
						changeStream = null;
						pollingInterval = setInterval(pollAndSend, 10000);
					});
				} else {
					throw new Error("No MongoDB connection available");
				}
			} catch (err) {
				console.warn("[order/stream] Change Stream setup failed:", (err as Error).message);
				console.warn("[order/stream] Falling back to polling mode at 10s interval");
				usePolling = true;
				pollingInterval = setInterval(pollAndSend, 10000);
			}

			await pollAndSend();

			if (!usePolling && !pollingInterval) {
				pollingInterval = setInterval(pollAndSend, 10000);
			}

			req.signal.addEventListener("abort", () => {
				if (changeStream) changeStream.close();
				if (pollingInterval) clearInterval(pollingInterval);
				try {
					controller.close();
				} catch {}
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
