import { describe, expect, it } from "@jest/globals";

describe("Campaign Parallel Send", () => {
	it("calculates concurrency correctly", () => {
		const phones = ["1", "2", "3", "4", "5", "6", "7"];
		const concurrency = 5;
		const workers = Math.min(concurrency, phones.length || 1);
		expect(workers).toBe(5);
	});

	it("handles empty phone list", () => {
		const phones: string[] = [];
		const concurrency = 5;
		const workers = Math.min(concurrency, phones.length || 1);
		expect(workers).toBe(1);
	});

	it("caps concurrency to phone count", () => {
		const phones = ["1", "2"];
		const concurrency = 10;
		const workers = Math.min(concurrency, phones.length || 1);
		expect(workers).toBe(2);
	});

	it("retries up to maxRetries times", async () => {
		let attempts = 0;
		const maxRetries = 2;
		const fn = async () => {
			attempts++;
			if (attempts <= 2) throw new Error("fail");
			return true;
		};
		const runWithRetry = async (max: number): Promise<boolean> => {
			for (let i = 0; i <= max; i++) {
				try {
					return await fn();
				} catch {
					if (i < max) continue;
					return false;
				}
			}
			return false;
		};
		const result = await runWithRetry(maxRetries);
		expect(result).toBe(true);
		expect(attempts).toBe(3);
	});

	it("gives up after exhausting retries", async () => {
		let attempts = 0;
		const maxRetries = 2;
		const runWithRetry = async (max: number): Promise<boolean> => {
			for (let i = 0; i <= max; i++) {
				try {
					attempts++;
					throw new Error("always fail");
				} catch {
					if (i < max) continue;
					return false;
				}
			}
			return false;
		};
		const result = await runWithRetry(maxRetries);
		expect(result).toBe(false);
		expect(attempts).toBe(3);
	});
});

describe("Campaign Status Logic", () => {
	function getCampaignStatus(failed: number, total: number): "failed" | "sent" {
		return failed === total ? "failed" : "sent";
	}

	it("marks as failed when all sends fail", () => {
		expect(getCampaignStatus(10, 10)).toBe("failed");
	});

	it("marks as sent when some succeed", () => {
		expect(getCampaignStatus(3, 10)).toBe("sent");
	});

	it("marks as sent when all succeed", () => {
		expect(getCampaignStatus(0, 10)).toBe("sent");
	});
});
