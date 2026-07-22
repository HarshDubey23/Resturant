import connectDB from "#utils/database/connect";
import { Orders } from "#utils/database/models/order";
import { Profiles } from "#utils/database/models/profile";
import { formatCurrency } from "#utils/helper/currency";
import { captureError } from "#utils/helper/sentryWrapper";
import { sendWhatsAppText } from "./index";

type CustomerInfo = { phone?: string; fname?: string };

async function getCurrency(restaurantID: string): Promise<string> {
	try {
		await connectDB();
		const profile = await Profiles.findOne({ restaurantID }).lean().select("currency");
		return profile?.currency ?? "INR";
	} catch {
		return "INR";
	}
}

type OrderInfo = {
	_id?: string;
	table?: string;
	orderTotal?: number;
	taxTotal?: number;
	customer?: CustomerInfo;
	products?: Array<{ quantity?: number; price?: number; name?: string }>;
};

async function getOrder(orderId: string): Promise<OrderInfo | null> {
	try {
		await connectDB();
		const order = await Orders.findById(orderId).populate<{ customer: CustomerInfo }>("customer", "phone fname whatsappOptIn").lean();
		return order as unknown as OrderInfo | null;
	} catch (err) {
		captureError(err, { context: "getOrder" });
		return null;
	}
}

export async function sendOrderConfirmation(orderId: string, restaurantID: string) {
	try {
		const order = await getOrder(orderId);
		if (!order?.customer) return;

		const customer = order.customer as unknown as CustomerInfo & { whatsappOptIn?: boolean };
		if (!customer.phone || !customer.whatsappOptIn) return;

		const table = order.table || "—";
		const itemCount = (order.products || []).reduce((s, p) => s + (p.quantity || 1), 0);
		const total = (order.orderTotal || 0) + (order.taxTotal || 0);
		const currency = await getCurrency(restaurantID);

		const name = customer.fname || "Guest";
		const message = `Hi ${name}! 🙏\n\nYour order at Table ${table} has been received.\n\nItems: ${itemCount} item(s)\nTotal: ${formatCurrency(total, currency)}\n\nWe'll notify you when it's ready!\n\n— Team`;

		await sendWhatsAppText(customer.phone, message);
	} catch (err) {
		captureError(err, { context: "sendOrderConfirmation", orderId, restaurantID });
	}
}

export async function sendProductReadyNotification(orderId: string, restaurantID: string, productName: string) {
	try {
		const order = await getOrder(orderId);
		if (!order?.customer) return;

		const customer = order.customer as unknown as CustomerInfo & { whatsappOptIn?: boolean };
		if (!customer.phone || !customer.whatsappOptIn) return;

		const name = customer.fname || "Guest";
		const message = `Hi ${name}! 🍽️\n\nYour item "${productName}" is ready at Table ${order.table}.\n\nPlease collect from the counter.\n\n— Team`;

		await sendWhatsAppText(customer.phone, message);
	} catch (err) {
		captureError(err, { context: "sendProductReadyNotification", orderId, restaurantID });
	}
}

export async function sendOrderReadyNotification(orderId: string, restaurantID: string) {
	try {
		const order = await getOrder(orderId);
		if (!order?.customer) return;

		const customer = order.customer as unknown as CustomerInfo & { whatsappOptIn?: boolean };
		if (!customer.phone || !customer.whatsappOptIn) return;

		const name = customer.fname || "Guest";
		const total = (order.orderTotal || 0) + (order.taxTotal || 0);
		const currency = await getCurrency(restaurantID);
		const message = `Hi ${name}! 🎉\n\nYour entire order is ready at Table ${order.table}!\n\nTotal: ${formatCurrency(total, currency)}\n\nPlease collect from the counter.\n\nThank you for dining with us!\n— Team`;

		await sendWhatsAppText(customer.phone, message);
	} catch (err) {
		captureError(err, { context: "sendOrderReadyNotification", orderId, restaurantID });
	}
}
