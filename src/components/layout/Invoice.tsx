"use client";

import { usePDF } from "@react-pdf/renderer";
import { Download, Loader2, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import type { TOrder } from "#utils/database/models/order";
import type { TProfile } from "#utils/database/models/profile";
import { Button } from "@/components/ui/button";
import { InvoiceDocument } from "./InvoiceDocument";

export type TInvoiceProps = {
	order: TOrder & { _id: string; createdAt: string | Date; invoiceNumber?: string };
	profile?: TProfile;
};

const Invoice = ({ order, profile }: TInvoiceProps) => {
	const [isClient, setIsClient] = useState(false);
	const [instance, updateInstance] = usePDF({ document: <InvoiceDocument order={order} profile={profile} invoiceNumber={order.invoiceNumber} /> });

	useEffect(() => {
		setIsClient(true);
	}, []);
	useEffect(() => {
		updateInstance(<InvoiceDocument order={order} profile={profile} invoiceNumber={order.invoiceNumber} />);
	}, [order, profile, updateInstance]);

	if (!isClient || !order) return null;

	const handleDownload = () => {
		if (instance.url) {
			const link = document.createElement("a");
			link.href = instance.url;
			link.download = `Invoice-${order.invoiceNumber || order._id.toString().slice(-6).toUpperCase()}.pdf`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
	};

	const handlePrint = () => {
		if (instance.url) {
			const iframe = document.createElement("iframe");
			iframe.style.display = "none";
			iframe.src = instance.url;
			document.body.appendChild(iframe);
			iframe.contentWindow?.focus();
			iframe.contentWindow?.print();
		}
	};

	return (
		<div className="relative w-full h-full min-h-[500px] overflow-hidden rounded-xl">
			{!instance.loading && instance.url ? (
				<iframe
					src={`${instance.url}#toolbar=0&view=FitH&navpanes=0&scrollbar=0`}
					width="100%"
					height="100%"
					className="border-none rounded-xl bg-white"
					title="Invoice PDF"
				/>
			) : (
				<div className="flex items-center justify-center h-full py-20">
					<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					<span className="ml-2 text-sm text-muted-foreground">Generating Invoice...</span>
				</div>
			)}

			<div className="absolute bottom-5 right-5 flex flex-col gap-2.5">
				<Button size="icon" onClick={handleDownload} disabled={instance.loading || !instance.url}>
					<Download className="h-4 w-4" />
				</Button>
				<Button size="icon" variant="secondary" onClick={handlePrint} disabled={instance.loading || !instance.url}>
					<Printer className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
};

export default Invoice;
