import { Body, Button, Container, Head, Heading, Html, Link, Preview, Section, Text } from "@react-email/components";

export type SignupVerifyEmail = {
	token: string;
	name: string;
};

const VERIFY_BASE_URL = process.env.NEXT_PUBLIC_URL ?? "https://orderworder.com";

export function subject(params: SignupVerifyEmail): string {
	return `Verify your OrderWorder account — ${params.name}`;
}

export default function SignupVerifyTemplate(params: SignupVerifyEmail) {
	const verifyUrl = `${VERIFY_BASE_URL}/api/auth/verify?token=${params.token}`;

	return (
		<Html>
			<Head />
			<Preview>Verify your OrderWorder account to get started</Preview>
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
							Welcome to OrderWorder 🍽️
						</Heading>
						<Text style={{ fontSize: "16px", color: "#4b5563", marginBottom: "0" }}>
							Hi {params.name}, please verify your email to activate your restaurant dashboard.
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
							href={verifyUrl}>
							Verify My Account
						</Button>
					</Section>

					<Section style={{ borderTop: "1px solid #e5e7eb", paddingTop: "16px" }}>
						<Text style={{ fontSize: "13px", color: "#6b7280" }}>If the button above doesn't work, copy and paste this link into your browser:</Text>
						<Link href={verifyUrl} style={{ fontSize: "13px", color: "#7c3aed" }}>
							{verifyUrl}
						</Link>
					</Section>

					<Section style={{ marginTop: "24px" }}>
						<Text style={{ fontSize: "12px", color: "#9ca3af", textAlign: "center" }}>
							If you didn't create an OrderWorder account, you can safely ignore this email.
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
}
