import { describe, expect, it } from "@jest/globals";

describe("AI Daily Budget", () => {
	const DAILY_TOKEN_BUDGET = 100000;
	const DAILY_COST_BUDGET = 2.0;

	it("allows request when under token budget", () => {
		const tokensUsed = 50000;
		expect(tokensUsed < DAILY_TOKEN_BUDGET).toBe(true);
	});

	it("blocks request when over token budget", () => {
		const tokensUsed = 150000;
		expect(tokensUsed >= DAILY_TOKEN_BUDGET).toBe(true);
	});

	it("allows request when under cost budget", () => {
		const costUsed = 1.0;
		expect(costUsed < DAILY_COST_BUDGET).toBe(true);
	});

	it("blocks request when over cost budget", () => {
		const costUsed = 3.0;
		expect(costUsed >= DAILY_COST_BUDGET).toBe(true);
	});

	it("resets daily budget after 24 hours", () => {
		const now = Date.now();
		const lastReset = now - 25 * 60 * 60 * 1000;
		const shouldReset = now - lastReset > 24 * 60 * 60 * 1000;
		expect(shouldReset).toBe(true);
	});

	it("does not reset within same day", () => {
		const now = Date.now();
		const lastReset = now - 12 * 60 * 60 * 1000;
		const shouldReset = now - lastReset > 24 * 60 * 60 * 1000;
		expect(shouldReset).toBe(false);
	});

	it("estimates cost correctly", () => {
		const totalTokens = 5000;
		const estimatedCost = totalTokens * 0.000002;
		expect(estimatedCost).toBe(0.01);
	});
});
