"use client";

import { Search } from "lucide-react";
import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TSearchButton {
	placeholder: string;
	setSearchActive: (searchActive: boolean) => void;
	value: string;
	setValue: (searchActive: string) => void;
}

export default function SearchButton({ placeholder, setSearchActive, value, setValue }: TSearchButton) {
	const inputRef = useRef<HTMLInputElement>(null);

	return (
		<div className="relative cursor-text" onClick={() => inputRef.current?.focus()}>
			<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				ref={inputRef}
				type="text"
				placeholder={placeholder}
				value={value}
				onChange={(event) => setValue(event.target.value)}
				onFocus={() => setSearchActive(true)}
				onBlur={() => setSearchActive(false)}
				className="pl-9"
			/>
		</div>
	);
}
