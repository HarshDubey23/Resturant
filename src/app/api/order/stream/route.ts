import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import type { TCustomer } from "#utils/database/models/customer";
import type { TMenu } from "#utils/database/models/menu";
import { Orders, type TOrder, type TProduct } from "#utils/database/models/order";
import { authOptions } from "#utils/helper/authHelper";
import { captureError } from "#utils/helper/sentryWrapper";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// FIX (audit D1): cap concurrent SSE streams per restaurant so a single
// restaurant cannot exhaust the server's connection pool. Each stream holds
// a MongoDB change-stream open, which is expensive — a runaway dashboard
// with many open tabs would otherwise degrade the whole deployment.
const MAX_STREAMS_PER_RESTAURANT = 50;
const activeStreams = new Map<string, number>();

function acquireStream(restaurantID: string): boolean {
	const current = activeStreams.get(restaurantID) ?? 0;
	if (current >= MAX_STREAMS_PER_RESTAURANT) return false;
	activeStreams.set(restaurantID, current + 1);
	return true;
}

function releaseStream(restaurantID: string): void {
	const current = activeStreams.get(restaurantID) ?? 0;
	if (current <= 1) activeStreams.delete(restaurantID);
	else activeStreams.set(restaurantID, current - 1);
}

export async function GET(req: Request) {
	const session = await getServerSession(authOptions);
	if (!session) {
		return new Response("Unauthorized", { status: 401 });
	}

	const restaurantID = session?.username || session?.restaurant?.username;
	if (!restaurantID) {
		return new Response("Restaurant ID required", { status: 400 });
	}

	if (!acquireStream(restaurantID)) {
		return new Response("Too many concurrent live streams for this restaurant. Please close other dashboard tabs and retry.", { status: 429 });
	}

	await connectDB();

	const encoder = new TextEncoder();
	let lastEventId = 0;
	let changeStream: ReturnType<typeof Orders.watch> | null = null;
	let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
	let closed = false;

	const stream = new ReadableStream({
		async start(controller) {
			const sendEvent = (data: unknown) => {
				lastEventId++;
				const message = `id: ${lastEventId}\nevent: order\ndata: ${JSON.stringify(data)}\n\n`;
				try {
					controller.enqueue(encoder.encode(message));
				} catch {
					// controller already closed — swallow, the abort handler
					// will tear everything down.
				}
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

			const sendInitialSnapshot = async () => {
				try {
					await formatOrders();
				} catch (err) {
					captureError(err, { route: "/api/order/stream", context: "initial-snapshot" });
					sendEvent({ type: "error", message: "Failed to fetch orders" });
				}
			};

			const cleanup = () => {
				if (closed) return;
				closed = true;
				if (heartbeatInterval) {
					clearInterval(heartbeatInterval);
					heartbeatInterval = null;
				}
				if (changeStream) {
					try {
						changeStream.close();
					} catch {
						// change-stream already closed by MongoDB — ignore.
					}
					changeStream = null;
				}
				try {
					controller.close();
				} catch {
					// controller already closed — ignore.
				}
				releaseStream(restaurantID);
			};

			// FIX (audit D1): use ONE real-time source (change-stream) instead
			// of running BOTH a change-stream AND a 10s polling interval per
			// client. The previous setup doubled the MongoDB load per dashboard
			// tab for zero latency benefit. A 15s heartbeat comment keeps
			// intermediate proxies (nginx, Cloudflare) from closing the idle
			// connection.
			heartbeatInterval = setInterval(() => {
				try {
					controller.enqueue(encoder.encode(": heartbeat\n\n"));
				} catch {
					cleanup();
				}
			}, 15000);

			try {
				const db = (await import("mongoose")).default.connection.db;
				if (!db) throw new Error("No MongoDB connection available");

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
					} catch (err) {
						captureError(err, { route: "/api/order/stream", context: "change-event-fetch" });
						sendEvent({ type: "error", message: "Failed to fetch orders after change" });
					}
				});

				changeStream.on("error", (err: Error) => {
					// Replica set / change-stream unavailable — report and tear
					// down. The client will reconnect and retry; we do NOT
					// silently fall back to polling, which previously created
					// a second long-lived connection per client.
					captureError(err, { route: "/api/order/stream", context: "change-stream-error" });
					sendEvent({ type: "error", message: "Live updates unavailable; reconnecting…" });
					cleanup();
				});
			} catch (err) {
				captureError(err, { route: "/api/order/stream", context: "change-stream-setup" });
				sendEvent({ type: "error", message: "Live updates unavailable; reconnecting…" });
				cleanup();
				return;
			}

			await sendInitialSnapshot();

			// FIX (audit D1): close the stream on client disconnect. The
			// previous code had an abort listener but it did not release the
			// per-restaurant stream slot, so the cap would leak until the
			// process restarted.
			req.signal.addEventListener("abort", cleanup);
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
