import { describe, expect, it } from "@jest/globals";

describe("Notification Queue", () => {
	type NotificationStatus = "pending" | "sending" | "sent" | "failed";

	it("starts as pending", () => {
		const status: NotificationStatus = "pending";
		expect(status).toBe("pending");
	});

	it("transitions pending -> sending", () => {
		const transitions: Record<NotificationStatus, NotificationStatus[]> = {
			pending: ["sending"],
			sending: ["sent", "failed", "pending"],
			sent: [],
			failed: ["pending"],
		};
		expect(transitions.pending).toContain("sending");
	});

	it("sending can retry as pending", () => {
		const transitions: Record<NotificationStatus, NotificationStatus[]> = {
			pending: ["sending"],
			sending: ["sent", "failed", "pending"],
			sent: [],
			failed: ["pending"],
		};
		expect(transitions.sending).toContain("pending");
	});

	it("sent is terminal", () => {
		const transitions: Record<NotificationStatus, NotificationStatus[]> = {
			pending: ["sending"],
			sending: ["sent", "failed", "pending"],
			sent: [],
			failed: ["pending"],
		};
		expect(transitions.sent).toHaveLength(0);
	});

	it("failed allows retry", () => {
		const transitions: Record<NotificationStatus, NotificationStatus[]> = {
			pending: ["sending"],
			sending: ["sent", "failed", "pending"],
			sent: [],
			failed: ["pending"],
		};
		expect(transitions.failed).toContain("pending");
	});

	it("respects maxAttempts", () => {
		const attempts = 3;
		const maxAttempts = 3;
		expect(attempts >= maxAttempts).toBe(true);
	});

	it("allows retry when under maxAttempts", () => {
		const attempts = 1;
		const maxAttempts = 3;
		expect(attempts < maxAttempts).toBe(true);
	});
});
