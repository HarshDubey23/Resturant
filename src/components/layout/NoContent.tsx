import { PackageOpen } from "lucide-react";

interface TNoContentProps {
	animationName?: string;
	label: string;
	size?: number;
	speed?: number;
}

export default function NoContent({ label }: TNoContentProps) {
	return (
		<div className="flex items-center justify-center py-16">
			<div className="text-center">
				<PackageOpen className="mx-auto h-16 w-16 text-muted-foreground/50" />
				{label && <p className="mt-3 text-sm text-muted-foreground">{label}</p>}
			</div>
		</div>
	);
}
