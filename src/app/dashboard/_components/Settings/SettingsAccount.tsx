"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useAdmin } from "#components/context/useContext";
import { splitStringByFirstWord } from "#utils/helper/common";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import PasswordSettings from "./PasswordSettings";
import ThemeSettings from "./ThemeSettings";

export default function SettingsAccount() {
	const router = useRouter();
	const { profile } = useAdmin();
	const session = useSession();
	const [restaurantName, setRestaurantName] = useState<string[]>([]);

	useEffect(() => {
		if (profile?.name) setRestaurantName(splitStringByFirstWord(profile?.name) ?? []);
	}, [profile?.name]);

	if (session.status === "loading" || !profile) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-24 w-full rounded-lg" />
				<Skeleton className="h-32 w-full rounded-lg" />
			</div>
		);
	}

	return (
		<div className="max-w-lg mx-auto space-y-6">
			<Card>
				<CardContent className="flex items-center gap-4 p-4">
					<Avatar className="h-14 w-14">
						{profile?.avatar ? <AvatarImage src={profile?.avatar} /> : null}
						<AvatarFallback className="text-lg">{profile?.name?.charAt(0)?.toUpperCase() ?? "R"}</AvatarFallback>
					</Avatar>
					<div className="flex-1 min-w-0">
						<h2 className="text-lg font-semibold truncate">
							{restaurantName[0]} <span className="text-muted-foreground">{restaurantName[1]}</span>
						</h2>
						{profile?.address && <p className="text-sm text-muted-foreground truncate">{profile.address}</p>}
					</div>
					<Button variant="outline" size="sm" onClick={() => router.push("/logout")}>
						<LogOut className="h-4 w-4" />
					</Button>
				</CardContent>
			</Card>

			<Separator />

			<PasswordSettings />

			<Separator />

			<ThemeSettings />
		</div>
	);
}
