import type { ReactNode } from "react";
import { themeController } from "xtreme-ui";
import { DEFAULT_THEME_COLOR } from "#utils/constants/common";
import { getThemeColor } from "#utils/database/helper/getThemeColor";

export default async function RootLayout({ children, params }: IRootProps) {
	const themeColor = await getThemeColor((await params).restaurant);
	return (
		<>
			<script dangerouslySetInnerHTML={{ __html: themeController({ color: themeColor ?? DEFAULT_THEME_COLOR }) }} suppressHydrationWarning />
			{children}
		</>
	);
}

interface IRootProps {
	children?: ReactNode;
	params: Promise<{
		restaurant: string;
	}>;
}
