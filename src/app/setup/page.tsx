import { redirect } from "next/navigation";

// The legacy 3-step setup flow has been replaced by the comprehensive
// 9-step registration wizard at /signup. Anyone landing on /setup
// (e.g. from an old bookmark) is bounced to the new flow.
export default function SetupRedirect() {
	redirect("/signup");
}
