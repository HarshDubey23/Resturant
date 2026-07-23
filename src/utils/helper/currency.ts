export const CURRENCY_MAP: Record<string, { symbol: string; code: string; name: string; locale: string; subunit: number }> = {
	INR: { symbol: "₹", code: "INR", name: "Indian Rupee", locale: "en-IN", subunit: 100 },
	USD: { symbol: "$", code: "USD", name: "US Dollar", locale: "en-US", subunit: 100 },
	EUR: { symbol: "€", code: "EUR", name: "Euro", locale: "en-IE", subunit: 100 },
	GBP: { symbol: "£", code: "GBP", name: "British Pound", locale: "en-GB", subunit: 100 },
	AED: { symbol: "AED", code: "AED", name: "UAE Dirham", locale: "en-AE", subunit: 100 },
};

export function currencySymbol(currency = "INR"): string {
	return CURRENCY_MAP[currency]?.symbol ?? "₹";
}

/**
 * Format a monetary amount using locale-aware grouping.
 * INR → Indian lakh/crore grouping (₹1,23,456.00)
 * Others → international grouping ($1,234.00)
 */
export function formatCurrency(amount: number, currency = "INR"): string {
	const cfg = CURRENCY_MAP[currency];
	if (!cfg) return `${currencySymbol(currency)}${(amount ?? 0).toFixed(2)}`;
	try {
		// Use Intl for proper grouping. Display as "symbol + grouped number" (no currency code prefix)
		// to match the existing visual style across the app.
		const formatted = new Intl.NumberFormat(cfg.locale, {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(Number(amount ?? 0) || 0);
		return `${cfg.symbol}${formatted}`;
	} catch {
		return `${cfg.symbol}${(amount ?? 0).toFixed(2)}`;
	}
}

export function currencyCode(currency = "INR"): string {
	return CURRENCY_MAP[currency]?.code ?? "INR";
}

export function currencyName(currency = "INR"): string {
	return CURRENCY_MAP[currency]?.name ?? "Indian Rupee";
}

export const SUPPORTED_CURRENCIES = Object.keys(CURRENCY_MAP);
