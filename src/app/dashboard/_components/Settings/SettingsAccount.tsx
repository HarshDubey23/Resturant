"use client";

import { LogOut, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "#components/context/useContext";
import { splitStringByFirstWord } from "#utils/helper/common";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import PasswordSettings from "./PasswordSettings";
import ThemeSettings from "./ThemeSettings";

export default function SettingsAccount() {
	const router = useRouter();
	const { profile, profileMutate } = useAdmin();
	const session = useSession();
	const [restaurantName, setRestaurantName] = useState<string[]>([]);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (profile?.name) setRestaurantName(splitStringByFirstWord(profile?.name) ?? []);
		if (profile) {
			setName(profile.name ?? "");
			setDescription(profile.description ?? "");
		}
	}, [profile]);

	const handleSaveProfile = async () => {
		setSaving(true);
		try {
			const res = await fetch("/api/admin", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, description }),
			});
			if (!res.ok) throw new Error("Failed to save");
			toast.success("Profile updated");
			await profileMutate();
		} catch {
			toast.error("Failed to save profile");
		} finally {
			setSaving(false);
		}
	};

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

			<Card>
				<CardContent className="p-4 space-y-4">
					<h3 className="text-sm font-semibold">Profile</h3>
					<div className="space-y-2">
						<Label htmlFor="name" className="text-xs">
							Restaurant Name
						</Label>
						<Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your restaurant name" />
					</div>
					<div className="space-y-2">
						<Label htmlFor="description" className="text-xs">
							Description
						</Label>
						<Textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Brief description of your restaurant"
							rows={2}
						/>
					</div>
					<Button onClick={handleSaveProfile} loading={saving} className="w-full" size="sm">
						<Save className="h-4 w-4 mr-1" />
						Save Profile
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
