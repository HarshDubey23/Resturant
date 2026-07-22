import { redirect } from "next/navigation";

/**
 * Table QR scan target. We redirect to the premium OrderPage at
 * `/{restaurant}?tab=menu&table={tableId}` so that the same React
 * component (`/components/features/OrderPage.tsx`) renders for every
 * customer entry point — search bar, hero, ratings, spice indicators,
 * chef-special ribbons, floating cart, etc. — instead of the older
 * MenuGrid UI that used to live here.
 *
 * The `table` query param is what OrderPage reads to pre-select the
 * table for the customer-facing order flow.
 */
export default async function TableRedirect({ params }: { params: Promise<{ restaurant: string; tableId: string }> }) {
	const { restaurant, tableId } = await params;
	redirect(`/${restaurant}?tab=menu&table=${encodeURIComponent(tableId)}`);
}
