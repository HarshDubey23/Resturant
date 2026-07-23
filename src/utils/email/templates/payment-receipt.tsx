import { Body, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";

export type PaymentReceiptEmail = {
	restaurantName: string;
	orderId: string;
	items: Array<{ name: string; qty: number; price: number }>;
	subtotal: number;
	gstAmount: number;
	total: number;
	currency: string;
	customerName: string;
};

export function subject(params: PaymentReceiptEmail): string {
	return `Payment Receipt from ${params.restaurantName} — Order #${params.orderId}`;
}

function formatAmount(amount: number, currency: string): string {
	const symbols: Record<string, string> = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };
	const sym = symbols[currency] ?? currency;
	return `${sym}${amount.toFixed(2)}`;
}

export default function PaymentReceiptTemplate(params: PaymentReceiptEmail) {
	return (
		<Html>
			<Head />
			<Preview>Payment receipt for your order at {params.restaurantName}</Preview>
			<Body style={{ backgroundColor: "#f9fafb", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
				<Container style={{ maxWidth: "520px", margin: "0 auto", padding: "32px 24px" }}>
					<Section style={{ textAlign: "center", marginBottom: "24px" }}>
						<Heading
							style={{
								fontSize: "24px",
								fontWeight: 700,
								color: "#1e1b4b",
								marginBottom: "4px",
							}}>
							Payment Receipt
						</Heading>
						<Text style={{ fontSize: "14px", color: "#7c3aed", fontWeight: 600, marginBottom: "0" }}>{params.restaurantName}</Text>
					</Section>

					<Section style={{ backgroundColor: "#ffffff", borderRadius: "8px", padding: "16px 24px", marginBottom: "16px" }}>
						<Text style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px" }}>Order #{params.orderId}</Text>
						<Text style={{ fontSize: "13px", color: "#6b7280", marginBottom: "16px" }}>Customer: {params.customerName}</Text>

						<Section style={{ borderTop: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb", padding: "8px 0" }}>
							{params.items.map((item, idx) => (
								<Section key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
									<Text style={{ fontSize: "14px", color: "#1f2937", margin: "0" }}>
										{item.name} × {item.qty}
									</Text>
									<Text style={{ fontSize: "14px", color: "#1f2937", margin: "0", textAlign: "right" }}>
										{formatAmount(item.price * item.qty, params.currency)}
									</Text>
								</Section>
							))}
						</Section>

						<Section style={{ padding: "8px 0" }}>
							<Section style={{ display: "flex", justifyContent: "space-between" }}>
								<Text style={{ fontSize: "13px", color: "#6b7280", margin: "0" }}>Subtotal</Text>
								<Text style={{ fontSize: "13px", color: "#6b7280", margin: "0", textAlign: "right" }}>
									{formatAmount(params.subtotal, params.currency)}
								</Text>
							</Section>
							<Section style={{ display: "flex", justifyContent: "space-between" }}>
								<Text style={{ fontSize: "13px", color: "#6b7280", margin: "0" }}>GST</Text>
								<Text style={{ fontSize: "13px", color: "#6b7280", margin: "0", textAlign: "right" }}>
									{formatAmount(params.gstAmount, params.currency)}
								</Text>
							</Section>
						</Section>

						<Section style={{ backgroundColor: "#7c3aed", borderRadius: "6px", padding: "8px 16px", marginTop: "8px" }}>
							<Section style={{ display: "flex", justifyContent: "space-between" }}>
								<Text style={{ fontSize: "16px", color: "#ffffff", fontWeight: 700, margin: "0" }}>Total</Text>
								<Text style={{ fontSize: "16px", color: "#ffffff", fontWeight: 700, margin: "0", textAlign: "right" }}>
									{formatAmount(params.total, params.currency)}
								</Text>
							</Section>
						</Section>
					</Section>

					<Section style={{ textAlign: "center", marginTop: "16px" }}>
						<Text style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "0" }}>
							This is an automated receipt from {params.restaurantName} via OrderWorder.
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
}
