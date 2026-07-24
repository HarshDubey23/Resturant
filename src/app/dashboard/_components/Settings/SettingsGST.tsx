"use client";

/** @file SettingsGST — GSTR-1 / GSTR-3B / E-Invoice / Audit Chain tabs. Month
 *    picker drives the preview JSON; download buttons emit JSON or CSV blobs.
 *    Reconciliation card shows doc count vs chain count with a green/red badge.
 *    The Audit Chain tab embeds SettingsAuditChain.
 * @phase 2
 * @audit-finding n/a
 */
import { motion } from "motion/react";
import {
        AlertTriangle,
        Download,
        FileJson,
        Loader2,
        RefreshCw,
        ShieldCheck,
        Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import SettingsAuditChain from "./SettingsAuditChain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdmin } from "#components/context/useContext";

interface Reconciliation {
        matched: boolean;
        docCount: number;
        chainCount: number;
        discrepancy: number;
}

interface GstrResponse {
        type: "gstr1" | "gstr3b";
        month: string;
        payload: Record<string, unknown>;
        reconciliation: Reconciliation;
}

function currentMonth(): string {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function syntaxHighlight(json: string): string {
        return json
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(
                        /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
                        (match) => {
                                let cls = "text-amber-600 dark:text-amber-400"; // number
                                if (/^"/.test(match)) {
                                        cls = /:$/.test(match) ? "text-foreground font-semibold" : "text-emerald-600 dark:text-emerald-400"; // key vs string
                                } else if (/true|false/.test(match)) {
                                        cls = "text-violet-600 dark:text-violet-400";
                                } else if (/null/.test(match)) {
                                        cls = "text-muted-foreground";
                                }
                                return `<span class="${cls}">${match}</span>`;
                        },
                );
}

export default function SettingsGST() {
        const { profile } = useAdmin();
        const [tab, setTab] = useState("gstr1");
        const [month, setMonth] = useState(currentMonth());
        const [data, setData] = useState<GstrResponse | null>(null);
        const [loading, setLoading] = useState(false);

        const gstEnabled = (profile as unknown as { settings?: { gstEnabled?: boolean } })?.settings?.gstEnabled ?? false;
        const einvoiceEnabled = (profile as unknown as { settings?: { einvoiceEnabled?: boolean } })?.settings?.einvoiceEnabled ?? false;

        const fetchPreview = useCallback(async () => {
                setLoading(true);
                try {
                        const res = await fetch("/api/gstr/export", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ month, type: tab === "gstr3b" ? "gstr3b" : "gstr1" }),
                        });
                        const json = (await res.json()) as GstrResponse | { message?: string };
                        if (!res.ok) throw new Error((json as { message?: string }).message ?? "Export failed");
                        setData(json as GstrResponse);
                } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Export failed");
                        setData(null);
                } finally {
                        setLoading(false);
                }
        }, [month, tab]);

        useEffect(() => {
                fetchPreview();
        }, [fetchPreview]);

        const downloadJson = () => {
                if (!data) return;
                const blob = new Blob([JSON.stringify(data.payload, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${tab}-${month}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
        };

        const downloadCsv = async () => {
                try {
                        const res = await fetch(`/api/gstr/export?format=csv`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ month, type: tab === "gstr3b" ? "gstr3b" : "gstr1" }),
                        });
                        if (!res.ok) throw new Error("CSV export failed");
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `${tab}-${month}.csv`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                } catch (err) {
                        toast.error(err instanceof Error ? err.message : "CSV export failed");
                }
        };

        const downloadPdf = () => {
                // Phase 2 limitation: real PDF generation requires a server-side render
                // of the JSON shape via the existing invoice PDF utility. We emit a
                // minimal human-readable text PDF blob as a placeholder so the button
                // is functional end-to-end. Full PDF integration is a Phase 3 task.
                const lines = [
                        "OrderWorder — GSTR Export",
                        `Type: ${tab}`,
                        `Month: ${month}`,
                        `Generated: ${new Date().toISOString()}`,
                        "",
                        JSON.stringify(data?.payload ?? {}, null, 2),
                ];
                const text = lines.join("\n");
                // Minimal PDF wrapper (single-page text dump) — works in any PDF viewer.
                const pdf = [
                        "%PDF-1.4",
                        "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
                        "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
                        `3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj`,
                        "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Courier >> endobj",
                        `5 0 obj << /Length ${text.length + 20} >> stream\nBT /F1 8 Tf 50 750 Td (${text.replace(/[()\\]/g, "\\$&")}) Tj ET\nendstream endobj`,
                        "trailer << /Root 1 0 R >>",
                        "%%EOF",
                ].join("\n");
                const blob = new Blob([pdf], { type: "application/pdf" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${tab}-${month}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
        };

        const reconciliation = data?.reconciliation;
        const prettyJson = useMemo(() => (data ? JSON.stringify(data.payload, null, 2) : ""), [data]);

        return (
                <div className="space-y-4 p-4">
                        <div>
                                <h2 className="text-lg font-bold tracking-tight">GST & E-Invoice</h2>
                                <p className="text-sm text-muted-foreground">
                                        GSTR-1 / GSTR-3B JSON exports, NIC e-invoice status and the tamper-proof audit chain.
                                </p>
                                {!gstEnabled && (
                                        <div className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                                                <AlertTriangle className="h-3.5 w-3.5" />
                                                GST is currently disabled in your profile settings — exports are still generated from existing invoices.
                                        </div>
                                )}
                        </div>

                        <Tabs value={tab} onValueChange={setTab}>
                                <TabsList className="flex w-full max-w-xl flex-wrap">
                                        <TabsTrigger value="gstr1">GSTR-1</TabsTrigger>
                                        <TabsTrigger value="gstr3b">GSTR-3B</TabsTrigger>
                                        <TabsTrigger value="einvoice">E-Invoice</TabsTrigger>
                                        <TabsTrigger value="audit">Audit Chain</TabsTrigger>
                                </TabsList>

                                <TabsContent value="gstr1">
                                        <GstrPreview
                                                month={month}
                                                setMonth={setMonth}
                                                loading={loading}
                                                prettyJson={prettyJson}
                                                reconciliation={reconciliation}
                                                onRefresh={fetchPreview}
                                                onDownloadJson={downloadJson}
                                                onDownloadCsv={downloadCsv}
                                                onDownloadPdf={downloadPdf}
                                        />
                                </TabsContent>

                                <TabsContent value="gstr3b">
                                        <GstrPreview
                                                month={month}
                                                setMonth={setMonth}
                                                loading={loading}
                                                prettyJson={prettyJson}
                                                reconciliation={reconciliation}
                                                onRefresh={fetchPreview}
                                                onDownloadJson={downloadJson}
                                                onDownloadCsv={downloadCsv}
                                                onDownloadPdf={downloadPdf}
                                        />
                                </TabsContent>

                                <TabsContent value="einvoice">
                                        <Card>
                                                <CardHeader className="pb-3">
                                                        <CardTitle className="text-sm flex items-center gap-2">
                                                                <Sparkles className="h-4 w-4" />
                                                                NIC E-Invoice
                                                        </CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-3">
                                                        <div className="flex items-center justify-between rounded-lg border bg-card p-3">
                                                                <div>
                                                                        <p className="text-sm font-semibold">Status</p>
                                                                        <p className="text-xs text-muted-foreground">
                                                                                {einvoiceEnabled
                                                                                        ? "Enabled — IRN generation is active."
                                                                                        : "Disabled — IRN generation runs in mock mode."}
                                                                        </p>
                                                                </div>
                                                                <Badge variant={einvoiceEnabled ? "default" : "secondary"}>
                                                                        {einvoiceEnabled ? "Live" : "Mock"}
                                                                </Badge>
                                                        </div>

                                                        <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
                                                                <p>
                                                                        <span className="font-semibold text-foreground">How to go live:</span>
                                                                </p>
                                                                <ol className="ml-4 list-decimal space-y-1">
                                                                        <li>Register on the NIC e-invoice portal and obtain your ASN, user, password and GSTIN.</li>
                                                                        <li>
                                                                                Set <code>EINVOICE_ENABLED=true</code>, <code>NIC_ASN</code>, <code>NIC_USER</code>,{" "}
                                                                                <code>NIC_PASSWORD</code>, <code>NIC_GSTIN</code> and <code>NIC_ENV=prod</code> in your environment.
                                                                        </li>
                                                                        <li>Enable e-invoice in Business settings (toggles <code>profile.settings.einvoiceEnabled</code>).</li>
                                                                        <li>Test with a single invoice before enabling for all bills.</li>
                                                                </ol>
                                                        </div>

                                                        <p className="text-xs text-muted-foreground">
                                                                See <code>docs/EINVOICE_GO_LIVE.md</code> for the full checklist. When <code>EINVOICE_ENABLED</code> is
                                                                not <code>true</code>, the NIC client returns mock IRNs so the order/invoice UI is fully testable
                                                                end-to-end without burning live NIC quota.
                                                        </p>
                                                </CardContent>
                                        </Card>
                                </TabsContent>

                                <TabsContent value="audit">
                                        <SettingsAuditChain />
                                </TabsContent>
                        </Tabs>
                </div>
        );
}

function GstrPreview({
        month,
        setMonth,
        loading,
        prettyJson,
        reconciliation,
        onRefresh,
        onDownloadJson,
        onDownloadCsv,
        onDownloadPdf,
}: {
        month: string;
        setMonth: (v: string) => void;
        loading: boolean;
        prettyJson: string;
        reconciliation?: Reconciliation;
        onRefresh: () => void;
        onDownloadJson: () => void;
        onDownloadCsv: () => void;
        onDownloadPdf: () => void;
}) {
        return (
                <div className="space-y-4">
                        <Card>
                                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:justify-between">
                                        <div className="space-y-1.5">
                                                <Label htmlFor="gst-month" className="text-xs font-medium text-muted-foreground">
                                                        Month (YYYY-MM)
                                                </Label>
                                                <Input
                                                        id="gst-month"
                                                        type="month"
                                                        value={month}
                                                        onChange={(e) => setMonth(e.target.value || currentMonth())}
                                                        className="w-[200px]"
                                                />
                                        </div>
                                        <div className="flex items-end gap-2">
                                                <Button variant="outline" size="sm" onClick={onRefresh} loading={loading}>
                                                        <RefreshCw className="h-4 w-4 mr-1" />
                                                        Refresh
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={onDownloadJson} disabled={loading || !prettyJson}>
                                                        <FileJson className="h-4 w-4 mr-1" />
                                                        JSON
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={onDownloadCsv} disabled={loading}>
                                                        <Download className="h-4 w-4 mr-1" />
                                                        CSV
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={onDownloadPdf} disabled={loading || !prettyJson}>
                                                        <Download className="h-4 w-4 mr-1" />
                                                        PDF
                                                </Button>
                                        </div>
                                </CardContent>
                        </Card>

                        {reconciliation && (
                                <motion.div
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={
                                                reconciliation.matched
                                                        ? "rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-3"
                                                        : "rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-3"
                                        }>
                                        {reconciliation.matched ? (
                                                <ShieldCheck className="h-5 w-5 shrink-0" />
                                        ) : (
                                                <AlertTriangle className="h-5 w-5 shrink-0" />
                                        )}
                                        <div className="flex-1">
                                                <p className="font-semibold">
                                                        {reconciliation.matched
                                                                ? "Reconciled — invoices match audit chain"
                                                                : `Discrepancy of ${reconciliation.discrepancy} detected`}
                                                </p>
                                                <p className="text-xs opacity-80">
                                                        Documents issued: <span className="font-semibold tabular-nums">{reconciliation.docCount}</span>
                                                        {" • "}
                                                        Chain entries (create): <span className="font-semibold tabular-nums">{reconciliation.chainCount}</span>
                                                </p>
                                        </div>
                                </motion.div>
                        )}

                        <Card>
                                <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Preview JSON</CardTitle>
                                </CardHeader>
                                <CardContent>
                                        {loading ? (
                                                <div className="flex items-center justify-center py-12 text-muted-foreground">
                                                        <Loader2 className="h-5 w-5 animate-spin" />
                                                </div>
                                        ) : prettyJson ? (
                                                <pre
                                                        className="max-h-[480px] overflow-auto rounded-lg border bg-muted/30 p-3 text-xs leading-relaxed"
                                                        // biome-ignore lint/security/noDangerouslySetInnerHtml: output is escaped via syntaxHighlight
                                                        dangerouslySetInnerHTML={{ __html: syntaxHighlight(prettyJson) }}
                                                />
                                        ) : (
                                                <div className="py-8 text-center text-xs text-muted-foreground">No data for {month}.</div>
                                        )}
                                </CardContent>
                        </Card>
                </div>
        );
}
