import {
	adminActionSchema,
	authCustomerSchema,
	authRestaurantSchema,
	chatSchema,
	orderPlaceSchema,
	passwordChangeSchema,
	signupSchema,
	themeUpdateSchema,
} from "#utils/helper/validation";

describe("orderPlaceSchema", () => {
	it("accepts valid product list", () => {
		const result = orderPlaceSchema.safeParse({
			products: [{ _id: "abc123", quantity: 2 }],
		});
		expect(result.success).toBe(true);
	});

	it("rejects empty products array", () => {
		const result = orderPlaceSchema.safeParse({ products: [] });
		expect(result.success).toBe(false);
	});

	it("rejects negative quantity", () => {
		const result = orderPlaceSchema.safeParse({
			products: [{ _id: "abc123", quantity: -1 }],
		});
		expect(result.success).toBe(false);
	});

	it("rejects zero quantity", () => {
		const result = orderPlaceSchema.safeParse({
			products: [{ _id: "abc123", quantity: 0 }],
		});
		expect(result.success).toBe(false);
	});

	it("rejects missing _id", () => {
		const result = orderPlaceSchema.safeParse({
			products: [{ quantity: 2 }],
		});
		expect(result.success).toBe(false);
	});
});

describe("chatSchema", () => {
	it("accepts valid chat message", () => {
		const result = chatSchema.safeParse({
			messages: [{ role: "user", content: "Hello" }],
			restaurantId: "empire",
		});
		expect(result.success).toBe(true);
	});

	it("rejects empty messages", () => {
		const result = chatSchema.safeParse({
			messages: [],
			restaurantId: "empire",
		});
		expect(result.success).toBe(false);
	});

	it("rejects invalid role", () => {
		const result = chatSchema.safeParse({
			messages: [{ role: "admin", content: "Hello" }],
			restaurantId: "empire",
		});
		expect(result.success).toBe(false);
	});

	it("rejects missing restaurantId", () => {
		const result = chatSchema.safeParse({
			messages: [{ role: "user", content: "Hello" }],
		});
		expect(result.success).toBe(false);
	});
});

describe("signupSchema", () => {
	it("accepts valid signup data", () => {
		const result = signupSchema.safeParse({
			email: "owner@test.com",
			password: "password123",
			restaurantName: "My Restaurant",
			restaurantID: "my-restaurant",
		});
		expect(result.success).toBe(true);
	});

	it("rejects invalid email", () => {
		const result = signupSchema.safeParse({
			email: "not-an-email",
			password: "password123",
			restaurantName: "My Restaurant",
			restaurantID: "my-restaurant",
		});
		expect(result.success).toBe(false);
	});

	it("rejects short password", () => {
		const result = signupSchema.safeParse({
			email: "owner@test.com",
			password: "12345",
			restaurantName: "My Restaurant",
			restaurantID: "my-restaurant",
		});
		expect(result.success).toBe(false);
	});

	it("rejects short restaurantID", () => {
		const result = signupSchema.safeParse({
			email: "owner@test.com",
			password: "password123",
			restaurantName: "My Restaurant",
			restaurantID: "ab",
		});
		expect(result.success).toBe(false);
	});

	it("rejects restaurantID with uppercase", () => {
		const result = signupSchema.safeParse({
			email: "owner@test.com",
			password: "password123",
			restaurantName: "My Restaurant",
			restaurantID: "My-Restaurant",
		});
		expect(result.success).toBe(false);
	});
});

describe("adminActionSchema", () => {
	it("accepts valid accept action", () => {
		const result = adminActionSchema.safeParse({
			orderID: "order123",
			action: "accept",
		});
		expect(result.success).toBe(true);
	});

	it("accepts valid complete action", () => {
		const result = adminActionSchema.safeParse({
			orderID: "order123",
			action: "complete",
		});
		expect(result.success).toBe(true);
	});

	it("rejects invalid action", () => {
		const result = adminActionSchema.safeParse({
			orderID: "order123",
			action: "invalid",
		});
		expect(result.success).toBe(false);
	});
});

describe("authRestaurantSchema", () => {
	it("accepts valid credentials", () => {
		const result = authRestaurantSchema.safeParse({
			username: "empire",
			password: "empire@123",
		});
		expect(result.success).toBe(true);
	});

	it("rejects missing password", () => {
		const result = authRestaurantSchema.safeParse({
			username: "empire",
		});
		expect(result.success).toBe(false);
	});
});

describe("authCustomerSchema", () => {
	it("accepts valid customer login", () => {
		const result = authCustomerSchema.safeParse({
			restaurant: "empire",
			table: "T1",
			phone: "9876543210",
			fname: "John",
			lname: "Doe",
		});
		expect(result.success).toBe(true);
	});

	it("rejects short phone", () => {
		const result = authCustomerSchema.safeParse({
			restaurant: "empire",
			table: "T1",
			phone: "123",
			fname: "John",
			lname: "Doe",
		});
		expect(result.success).toBe(false);
	});
});

describe("themeUpdateSchema", () => {
	it("accepts valid theme colors", () => {
		const result = themeUpdateSchema.safeParse({
			themeColor: { h: 200, s: 50, l: 50 },
		});
		expect(result.success).toBe(true);
	});

	it("rejects hue out of range", () => {
		const result = themeUpdateSchema.safeParse({
			themeColor: { h: 400, s: 50, l: 50 },
		});
		expect(result.success).toBe(false);
	});
});

describe("passwordChangeSchema", () => {
	it("accepts valid password change", () => {
		const result = passwordChangeSchema.safeParse({
			password: "old",
			newPassword: "newpassword",
		});
		expect(result.success).toBe(true);
	});

	it("rejects short new password", () => {
		const result = passwordChangeSchema.safeParse({
			password: "old",
			newPassword: "12345",
		});
		expect(result.success).toBe(false);
	});
});
