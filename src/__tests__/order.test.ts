import { describe, expect, it } from "@jest/globals";

type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "partially_refunded";
type OrderState = "active" | "reject" | "cancel" | "complete";
type KitchenStatus = "pending" | "preparing" | "ready" | "served";

interface OrderProduct {
	kitchenStatus: KitchenStatus;
	fulfilled: boolean;
	adminApproved: boolean;
}

interface _TestOrder {
	state: OrderState;
	paymentStatus: PaymentStatus;
	products: OrderProduct[];
}

function canTransitionToPayment(current: PaymentStatus, target: PaymentStatus): boolean {
	const transitions: Record<PaymentStatus, PaymentStatus[]> = {
		pending: ["paid", "failed"],
		paid: ["refunded", "partially_refunded"],
		failed: ["paid"],
		refunded: [],
		partially_refunded: ["refunded"],
	};
	return transitions[current]?.includes(target) ?? false;
}

function computeOrderAfterKitchenAction(products: OrderProduct[], action: KitchenStatus): OrderProduct[] {
	return products.map((p) => {
		if (action === "ready") return { ...p, kitchenStatus: "ready", fulfilled: true };
		return { ...p, kitchenStatus: action };
	});
}

function isOrderComplete(products: OrderProduct[]): boolean {
	return products.every((p) => p.fulfilled);
}

describe("Payment State Machine", () => {
	it("allows pending -> paid transition", () => {
		expect(canTransitionToPayment("pending", "paid")).toBe(true);
	});

	it("allows pending -> failed transition", () => {
		expect(canTransitionToPayment("pending", "failed")).toBe(true);
	});

	it("allows paid -> refunded transition", () => {
		expect(canTransitionToPayment("paid", "refunded")).toBe(true);
	});

	it("allows paid -> partially_refunded transition", () => {
		expect(canTransitionToPayment("paid", "partially_refunded")).toBe(true);
	});

	it("allows failed -> paid retry", () => {
		expect(canTransitionToPayment("failed", "paid")).toBe(true);
	});

	it("disallows pending -> refunded (skip paid)", () => {
		expect(canTransitionToPayment("pending", "refunded")).toBe(false);
	});

	it("disallows refunded -> any", () => {
		expect(canTransitionToPayment("refunded", "paid")).toBe(false);
		expect(canTransitionToPayment("refunded", "pending")).toBe(false);
		expect(canTransitionToPayment("refunded", "failed")).toBe(false);
	});

	it("disallows invalid transitions", () => {
		expect(canTransitionToPayment("paid", "pending")).toBe(false);
		expect(canTransitionToPayment("paid", "failed")).toBe(false);
	});
});

describe("Order Completion Logic", () => {
	it("marks order complete when all products fulfilled", () => {
		const products: OrderProduct[] = [
			{ kitchenStatus: "ready", fulfilled: true, adminApproved: true },
			{ kitchenStatus: "served", fulfilled: true, adminApproved: true },
		];
		expect(isOrderComplete(products)).toBe(true);
	});

	it("order not complete when some products unfulfilled", () => {
		const products: OrderProduct[] = [
			{ kitchenStatus: "ready", fulfilled: true, adminApproved: true },
			{ kitchenStatus: "pending", fulfilled: false, adminApproved: false },
		];
		expect(isOrderComplete(products)).toBe(false);
	});

	it("order not complete when all products pending", () => {
		const products: OrderProduct[] = [
			{ kitchenStatus: "pending", fulfilled: false, adminApproved: false },
			{ kitchenStatus: "pending", fulfilled: false, adminApproved: false },
		];
		expect(isOrderComplete(products)).toBe(false);
	});
});

describe("Kitchen Action State Machine", () => {
	it("sets product to preparing", () => {
		const products: OrderProduct[] = [{ kitchenStatus: "pending", fulfilled: false, adminApproved: true }];
		const result = computeOrderAfterKitchenAction(products, "preparing");
		expect(result[0].kitchenStatus).toBe("preparing");
		expect(result[0].fulfilled).toBe(false);
	});

	it("sets product to ready and fulfilled", () => {
		const products: OrderProduct[] = [{ kitchenStatus: "preparing", fulfilled: false, adminApproved: true }];
		const result = computeOrderAfterKitchenAction(products, "ready");
		expect(result[0].kitchenStatus).toBe("ready");
		expect(result[0].fulfilled).toBe(true);
	});
});

describe("Server-side Pricing", () => {
	it("computes correct total from products", () => {
		const products = [
			{ quantity: 2, price: 100, tax: 10 },
			{ quantity: 1, price: 200, tax: 20 },
		];
		const orderTotal = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
		const taxTotal = products.reduce((sum, p) => sum + p.tax, 0);
		expect(orderTotal).toBe(400);
		expect(taxTotal).toBe(30);
	});

	it("handles empty products", () => {
		const products: { quantity: number; price: number; tax: number }[] = [];
		const orderTotal = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
		expect(orderTotal).toBe(0);
	});

	it("computes tax correctly at 5%", () => {
		const price = 200;
		const taxPercent = 5;
		const tax = (price * taxPercent) / 100;
		expect(tax).toBe(10);
	});

	it("computes tax correctly at 18%", () => {
		const price = 500;
		const taxPercent = 18;
		const tax = (price * taxPercent) / 100;
		expect(tax).toBe(90);
	});
});
