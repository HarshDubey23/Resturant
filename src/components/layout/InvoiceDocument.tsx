import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { TOrder } from "#utils/database/models/order";
import type { TProfile } from "#utils/database/models/profile";

const styles = StyleSheet.create({
	page: {
		flexDirection: "column",
		backgroundColor: "#FFFFFF",
		padding: 30,
		fontFamily: "Helvetica",
	},
	header: { marginBottom: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
	companyInfo: { flexDirection: "column", maxWidth: "60%" },
	companyName: { fontSize: 20, fontWeight: "bold", marginBottom: 4, textTransform: "uppercase" },
	companyAddress: { fontSize: 10, color: "#555", marginBottom: 2 },
	logo: { width: 60, height: 60, objectFit: "contain" },
	invoiceDetails: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, borderBottomWidth: 1, borderBottomColor: "#EEE", paddingBottom: 10 },
	detailColumn: { flexDirection: "column" },
	detailLabel: { fontSize: 8, color: "#777", textTransform: "uppercase", marginBottom: 2 },
	detailValue: { fontSize: 10, marginBottom: 5 },
	table: { flexDirection: "column", width: "100%", marginBottom: 20 },
	tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#F0F0F0", alignItems: "center", minHeight: 24 },
	tableHeader: { backgroundColor: "#F9F9F9", borderBottomColor: "#DDD", borderBottomWidth: 1 },
	cell: { padding: 5, fontSize: 9 },
	cellIndex: { width: "8%", textAlign: "center", color: "#777" },
	cellDesc: { width: "50%", textAlign: "left" },
	cellQty: { width: "12%", textAlign: "center" },
	cellPrice: { width: "15%", textAlign: "right" },
	cellTotal: { width: "15%", textAlign: "right" },
	totalsSection: { flexDirection: "row", justifyContent: "flex-end", marginTop: 10 },
	totalsTable: { width: "40%", flexDirection: "column" },
	totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
	totalLabel: { fontSize: 9, color: "#555" },
	totalValue: { fontSize: 9, textAlign: "right" },
	grandTotal: { fontSize: 11, fontWeight: "bold", borderTopWidth: 1, borderTopColor: "#DDD", marginTop: 4, paddingTop: 4 },
	footer: { position: "absolute", bottom: 30, left: 30, right: 30, textAlign: "center", borderTopWidth: 1, borderTopColor: "#EEE", paddingTop: 10 },
	footerText: { fontSize: 8, color: "#999" },
});

export type TInvoiceDocProps = {
	order: TOrder & { _id: string; createdAt: string | Date; invoiceNumber?: string };
	profile?: TProfile;
	invoiceNumber?: string;
};

export const InvoiceDocument = ({ order, profile, invoiceNumber }: TInvoiceDocProps) => {
	const companyName = profile?.name || "Restaurant Name";
	const companyAddress = profile?.address || "";
	const logo = profile?.avatar;

	return (
		<Document>
			<Page size="A4" style={styles.page}>
				<View style={styles.header}>
					<View style={styles.companyInfo}>
						<Text style={styles.companyName}>{companyName}</Text>
						<Text style={styles.companyAddress}>{companyAddress}</Text>
						{profile?.gstNumber && <Text style={styles.companyAddress}>GST: {profile.gstNumber}</Text>}
					</View>
					{logo && <Image style={styles.logo} src={logo} />}
				</View>

				<View style={styles.invoiceDetails}>
					<View style={styles.detailColumn}>
						<Text style={styles.detailLabel}>Billed To</Text>
						<Text style={styles.detailValue}>
							{order.customer?.fname} {order.customer?.lname}
						</Text>
						<Text style={styles.detailValue}>{order.customer?.phone}</Text>
						{order.customer?.email && <Text style={styles.detailValue}>{order.customer.email}</Text>}
					</View>
					<View style={styles.detailColumn}>
						<Text style={styles.detailLabel}>Invoice Details</Text>
						<Text style={styles.detailValue}>No: {invoiceNumber || order._id.toString().slice(-6).toUpperCase()}</Text>
						<Text style={styles.detailValue}>Date: {new Date(order.createdAt || Date.now()).toLocaleDateString()}</Text>
						<Text style={styles.detailValue}>Table: {order.table}</Text>
					</View>
				</View>

				<View style={styles.table}>
					<View style={[styles.tableRow, styles.tableHeader]}>
						<Text style={[styles.cell, styles.cellIndex]}>#</Text>
						<Text style={[styles.cell, styles.cellDesc]}>Item</Text>
						<Text style={[styles.cell, styles.cellQty]}>Qty</Text>
						<Text style={[styles.cell, styles.cellPrice]}>Price</Text>
						<Text style={[styles.cell, styles.cellTotal]}>Total</Text>
					</View>
					{(
						(order.products || order.cartSnapshot?.items || []) as Array<{ name?: string; product?: { name?: string }; quantity?: number; price?: number }>
					).map((item, index) => {
						const name = item.name || item.product?.name || "Item";
						const qty = item.quantity || 1;
						const price = item.price || 0;
						return (
							<View key={index} style={styles.tableRow}>
								<Text style={[styles.cell, styles.cellIndex]}>{index + 1}</Text>
								<Text style={[styles.cell, styles.cellDesc]}>{name}</Text>
								<Text style={[styles.cell, styles.cellQty]}>{qty}</Text>
								<Text style={[styles.cell, styles.cellPrice]}>{price.toFixed(2)}</Text>
								<Text style={[styles.cell, styles.cellTotal]}>{(price * qty).toFixed(2)}</Text>
							</View>
						);
					})}
				</View>

				<View style={styles.totalsSection}>
					<View style={styles.totalsTable}>
						<View style={styles.totalRow}>
							<Text style={styles.totalLabel}>Sub Total:</Text>
							<Text style={styles.totalValue}>{order.orderTotal?.toFixed(2)}</Text>
						</View>
						<View style={styles.totalRow}>
							<Text style={styles.totalLabel}>Tax:</Text>
							<Text style={styles.totalValue}>{order.taxTotal?.toFixed(2)}</Text>
						</View>
						<View style={[styles.totalRow, styles.grandTotal]}>
							<Text style={[styles.totalLabel, { fontWeight: "bold", color: "#000" }]}>Grand Total:</Text>
							<Text style={[styles.totalValue, { fontWeight: "bold", fontSize: 11 }]}>{(order.orderTotal ?? 0) + (order.taxTotal ?? 0)}</Text>
						</View>
					</View>
				</View>

				<View style={styles.footer}>
					<Text style={styles.footerText}>Thank you for dining with us. This is a computer-generated invoice.</Text>
				</View>
			</Page>
		</Document>
	);
};
