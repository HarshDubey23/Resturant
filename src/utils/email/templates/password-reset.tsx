import { Body, Button, Container, Head, Heading, Html, Link, Preview, Section, Text } from "@react-email/components";

export type PasswordResetEmail = {
	token: string;
	name: string;
};

const APP_BASE_URL = process.env.NEXT_PUBLIC_URL ?? "https://orderworder.com";

export function subject(params: PasswordResetEmail): string {
	return `Reset your OrderWorder password — ${params.name}`;
}

export default function PasswordResetTemplate(params: PasswordResetEmail) {
	const resetUrl = `${APP_BASE_URL}/dashboard?tab=settings&subTab=account&resetToken=${params.token}`;

	return (
		<Html>
			<Head />
			<Preview>Reset your OrderWorder password — link expires in 30 minutes</Preview>
			<Body style={{ backgroundColor: "#f9fafb", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
				<Container style={{ maxWidth: "480px", margin: "0 auto", padding: "32px 24px" }}>
					<Section style={{ textAlign: "center", marginBottom: "24px" }}>
						<Heading
							style={{
								fontSize: "24px",
								fontWeight: 700,
								color: "#1e1b4b",
								marginBottom: "8px",
							}}>
							Password Reset Request
						</Heading>
						<Text style={{ fontSize: "16px", color: "#4b5563", marginBottom: "0" }}>
							Hi {params.name}, we received a request to reset your password for your OrderWorder account.
						</Text>
					</Section>

					<Section style={{ textAlign: "center", marginBottom: "32px" }}>
						<Button
							style={{
								backgroundColor: "#7c3aed",
								borderRadius: "8px",
								color: "#ffffff",
								fontSize: "16px",
								fontWeight: 600,
								padding: "12px 32px",
								textDecoration: "none",
							}}
							href={resetUrl}>
							Reset My Password
						</Button>
					</Section>

					<Section style={{ backgroundColor: "#fef3c7", borderRadius: "8px", padding: "12px 16px", marginBottom: "24px" }}>
						<Text style={{ fontSize: "13px", color: "#92400e", marginBottom: "0" }}>
							⚠️ This link expires in 30 minutes. If it expires, you can request a new one from your dashboard.
						</Text>
					</Section>

					<Section style={{ borderTop: "1px solid #e5e7eb", paddingTop: "16px" }}>
						<Text style={{ fontSize: "13px", color: "#6b7280" }}>If the button above doesn't work, copy and paste this link into your browser:</Text>
						<Link href={resetUrl} style={{ fontSize: "13px", color: "#7c3aed" }}>
							{resetUrl}
						</Link>
					</Section>

					<Section style={{ marginTop: "24px" }}>
						<Text style={{ fontSize: "12px", color: "#9ca3af", textAlign: "center" }}>
							If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
}
