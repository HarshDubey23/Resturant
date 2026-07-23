"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { type ReactNode, Suspense } from "react";
import { SWRConfig } from "swr";
import { XProvider } from "xtreme-ui";

import { AdminProvider } from "./Admin";
import { OrderProvider } from "./Order";
import { RestaurantProvider } from "./Restaurant";

const swrConfig = {
	refreshInterval: 0,
	revalidateOnFocus: true,
	dedupingInterval: 5000,
	errorRetryCount: 3,
	fetcher: (url: string) => fetch(url).then((r) => r.json()),
};

export const GlobalProvider = ({ children }: ProviderProps) => {
	return (
		<XProvider>
			<ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
				<SessionProvider>
					<SWRConfig value={swrConfig}>
						<Suspense>{children}</Suspense>
					</SWRConfig>
				</SessionProvider>
			</ThemeProvider>
		</XProvider>
	);
};

export const CustomerProvider = ({ children }: ProviderProps) => {
	return (
		<RestaurantProvider>
			<OrderProvider>{children}</OrderProvider>
		</RestaurantProvider>
	);
};

export const DashboardProvider = ({ children }: ProviderProps) => {
	return <AdminProvider>{children}</AdminProvider>;
};
interface ProviderProps {
	children?: ReactNode;
}
