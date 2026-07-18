import { capitalize } from "lodash";
import { Settings2, ShoppingBag } from "lucide-react";

import { DashboardProvider } from "#components/context";
import NavSideBar from "#components/layout/NavSideBar";

import PageContainer from "./_components/PageContainer";

const navItems = [
	{ label: "orders", icon: <ShoppingBag className="h-5 w-5" />, value: "orders" },
	{ label: "settings", icon: <Settings2 className="h-5 w-5" />, value: "settings" },
];

export async function generateMetadata({ searchParams }: IMetaDataProps) {
	const s = await searchParams;
	return {
		title: `OrderWorder${s.tab ? ` • ${capitalize(s.tab)}` : ""}`,
	};
}

const Dashboard = () => {
	return (
		<DashboardProvider>
			<div className="dashboard">
				<NavSideBar navItems={navItems} defaultTab="orders" foot />
				<PageContainer />
			</div>
		</DashboardProvider>
	);
};

export default Dashboard;

interface IMetaDataProps {
	params: {
		restaurant: string;
	};
	searchParams: {
		tab?: string;
		[key: string]: string | undefined;
	};
}
