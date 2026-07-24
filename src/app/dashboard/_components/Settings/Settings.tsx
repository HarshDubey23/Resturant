import { useSearchParams } from "next/navigation.js";
import type { UIEvent } from "react";
import AIKeysSettings from "./AIKeysSettings";
import MenuEditor from "./MenuEditor/MenuEditor";
import SettingsAccount from "./SettingsAccount";
import SettingsAuditChain from "./SettingsAuditChain";
import SettingsAuditLog from "./SettingsAuditLog";
import SettingsBilling from "./SettingsBilling";
import SettingsBusiness from "./SettingsBusiness";
import SettingsCoupons from "./SettingsCoupons";
import SettingsDomain from "./SettingsDomain";
import SettingsGST from "./SettingsGST";
import SettingsInventory from "./SettingsInventory";
import SettingsTables from "./SettingsTables";

interface SettingsProps {
        onScroll: (event: UIEvent<HTMLDivElement>) => void;
}

export default function Settings({ onScroll }: SettingsProps) {
        const queryParams = useSearchParams();
        const subTab = queryParams.get("subTab") ?? "";

        return (
                <div className="h-full" onScroll={onScroll}>
                        {subTab === "account" && <SettingsAccount />}
                        {subTab === "business" && <SettingsBusiness />}
                        {subTab === "menu" && <MenuEditor />}
                        {subTab === "ai-keys" && <AIKeysSettings />}
                        {subTab === "tables" && <SettingsTables />}
                        {subTab === "billing" && <SettingsBilling />}
                        {subTab === "audit-log" && <SettingsAuditLog />}
                        {subTab === "coupons" && <SettingsCoupons />}
                        {subTab === "domain" && <SettingsDomain />}
                        {subTab === "inventory" && <SettingsInventory />}
                        {subTab === "gst" && <SettingsGST />}
                        {subTab === "audit-chain" && <SettingsAuditChain />}
                </div>
        );
}
