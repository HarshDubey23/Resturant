/* eslint-disable react/no-danger */
import type { ReactNode } from "react";

import { themeController } from "xtreme-ui";

import { getThemeColor } from "#utils/database/helper/getThemeColor";

export const metadata = {
	title: "OrderWorder ⌘ Admin",
};
export default async function RootLayout({ children }: IRootProps) {
	const themeColor = await getThemeColor();
	return (
		<>
			<script dangerouslySetInnerHTML={{ __html: themeController({ color: themeColor }) }} suppressHydrationWarning />
			{children}
		</>
	);
}

interface IRootProps {
	children?: ReactNode;
}
