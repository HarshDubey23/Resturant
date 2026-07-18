import { z } from "zod";

export const orderPlaceSchema = z.object({
	products: z
		.array(
			z.object({
				_id: z.string().min(1),
				quantity: z.number().int().positive(),
			}),
		)
		.min(1, "At least one product is required"),
});

export const chatSchema = z.object({
	messages: z
		.array(
			z.object({
				role: z.enum(["user", "assistant"]),
				content: z.string(),
			}),
		)
		.min(1, "At least one message is required"),
	restaurantId: z.string().min(1, "Restaurant ID is required"),
});

export const authRestaurantSchema = z.object({
	username: z.string().min(1, "Username or email is required"),
	password: z.string().min(1, "Password is required"),
	kitchen: z.string().optional(),
});

export const authCustomerSchema = z.object({
	restaurant: z.string().min(1, "Restaurant ID is required"),
	table: z.string().min(1, "Table ID is required"),
	phone: z.string().min(10, "Valid phone number is required"),
	fname: z.string().min(1, "First name is required"),
	lname: z.string().min(1, "Last name is required"),
});

export const menuHiddenSchema = z.object({
	itemId: z.string().min(1),
	hidden: z.boolean(),
});

export const adminActionSchema = z.object({
	orderID: z.string().min(1),
	action: z.enum(["accept", "reject", "rejectOnActive", "complete"]),
});

export const themeUpdateSchema = z.object({
	themeColor: z.object({
		h: z.number().min(0).max(360),
		s: z.number().min(0).max(100),
		l: z.number().min(0).max(100),
	}),
});

export const passwordChangeSchema = z.object({
	password: z.string().min(1),
	newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export const passwordCheckSchema = z.object({
	password: z.string().min(1),
});

export const baseProfileSchema = z.object({
	email: z.string().email(),
});
