import { capitalize } from "lodash";
import { Award, BarChart3, FileText, LayoutDashboard, Megaphone, Settings2, ShoppingBag } from "lucide-react";

import { DashboardProvider } from "#components/context";
import NavSideBar from "#components/layout/NavSideBar";

import PageContainer from "./_components/PageContainer";

const navItems = [
	{ label: "overview", icon: <LayoutDashboard className="h-5 w-5" />, value: "overview" },
	{ label: "orders", icon: <ShoppingBag className="h-5 w-5" />, value: "orders" },
	{ label: "analytics", icon: <BarChart3 className="h-5 w-5" />, value: "analytics" },
	{ label: "campaigns", icon: <Megaphone className="h-5 w-5" />, value: "campaigns" },
	{ label: "invoices", icon: <FileText className="h-5 w-5" />, value: "invoices" },
	{ label: "loyalty", icon: <Award className="h-5 w-5" />, value: "loyalty" },
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
				<NavSideBar navItems={navItems} defaultTab="overview" foot />
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
