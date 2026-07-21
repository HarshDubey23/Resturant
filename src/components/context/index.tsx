"use client";

import { SessionProvider } from "next-auth/react";
import { type ReactNode, Suspense } from "react";
import { XProvider } from "xtreme-ui";

import { AdminProvider } from "./Admin";
import { OrderProvider } from "./Order";
import { RestaurantProvider } from "./Restaurant";

export const GlobalProvider = ({ children }: ProviderProps) => {
	return (
		<XProvider>
			<SessionProvider>
				<Suspense>{children}</Suspense>
			</SessionProvider>
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
