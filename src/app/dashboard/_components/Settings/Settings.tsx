import { useSearchParams } from "next/navigation.js";
import type { UIEvent } from "react";
import MenuEditor from "./MenuEditor/MenuEditor";
import SettingsAccount from "./SettingsAccount";

interface SettingsProps {
  onScroll: (event: UIEvent<HTMLDivElement>) => void;
}

export default function Settings({ onScroll }: SettingsProps) {
  const queryParams = useSearchParams();
  const subTab = queryParams.get("subTab") ?? "";

  return (
    <div className="h-full" onScroll={onScroll}>
      {subTab === "account" && <SettingsAccount />}
      {subTab === "menu" && <MenuEditor />}
    </div>
  );
}
