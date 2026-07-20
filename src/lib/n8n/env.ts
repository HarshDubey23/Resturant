import { z } from "zod";

const EnvSchema = z.object({
	N8N_WEBHOOK_URL: z.string().optional().default(""),
	N8N_WEBHOOK_SECRET: z.string().optional().default(""),
	N8N_WEBHOOK_TOKEN: z.string().optional().default(""),
	N8N_API_KEY: z.string().optional().default(""),
	N8N_INBOUND_ALLOWED_IPS: z.string().optional().default(""),
});

const parsed = EnvSchema.safeParse({
	N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL,
	N8N_WEBHOOK_SECRET: process.env.N8N_WEBHOOK_SECRET,
	N8N_WEBHOOK_TOKEN: process.env.N8N_WEBHOOK_TOKEN,
	N8N_API_KEY: process.env.N8N_API_KEY,
	N8N_INBOUND_ALLOWED_IPS: process.env.N8N_INBOUND_ALLOWED_IPS,
});

export const env = parsed.success ? parsed.data : {} as z.infer<typeof EnvSchema>;

export function isN8nConfigured(): boolean {
	return !!(env.N8N_WEBHOOK_URL && env.N8N_WEBHOOK_SECRET);
}

