const CURRENCY_MAP: Record<string, { symbol: string; code: string; subunit: number }> = {
	INR: { symbol: "₹", code: "INR", subunit: 100 },
	USD: { symbol: "$", code: "USD", subunit: 100 },
	EUR: { symbol: "€", code: "EUR", subunit: 100 },
	GBP: { symbol: "£", code: "GBP", subunit: 100 },
	AED: { symbol: "د.إ", code: "AED", subunit: 100 },
};

export function currencySymbol(currency = "INR"): string {
	return CURRENCY_MAP[currency]?.symbol ?? "₹";
}

export function formatCurrency(amount: number, currency = "INR"): string {
	const cfg = CURRENCY_MAP[currency];
	if (!cfg) return `₹${amount.toFixed(2)}`;
	return `${cfg.symbol}${amount.toFixed(2)}`;
}

export function currencyCode(currency = "INR"): string {
	return CURRENCY_MAP[currency]?.code ?? "INR";
}
