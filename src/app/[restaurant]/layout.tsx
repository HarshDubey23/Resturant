import type { ReactNode } from "react";
import { themeController } from "xtreme-ui";
import { DEFAULT_THEME_COLOR } from "#utils/constants/common";
import { getThemeColor } from "#utils/database/helper/getThemeColor";

export const dynamic = "force-dynamic";

export default async function RootLayout({ children, params }: IRootProps) {
	let themeColor = DEFAULT_THEME_COLOR;
	try {
		themeColor = (await getThemeColor((await params).restaurant)) ?? DEFAULT_THEME_COLOR;
	} catch {
		// DB unavailable during build — use default
	}
	return (
		<>
			<script dangerouslySetInnerHTML={{ __html: themeController({ color: themeColor }) }} suppressHydrationWarning />
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
