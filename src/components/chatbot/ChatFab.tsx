import { MessageCircle, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatFabProps {
	isOpen: boolean;
	toggleOpen: () => void;
	resetChat: () => void;
	isAuthenticated: boolean;
}

export const ChatFab = ({ isOpen, toggleOpen, resetChat, isAuthenticated }: ChatFabProps) => {
	return (
		<div className={cn("fixed bottom-6 right-6 z-50 flex items-center gap-2", isOpen && isAuthenticated ? "" : "")}>
			{isOpen && isAuthenticated && (
				<Button size="sm" variant="secondary" onClick={resetChat} className="shadow-lg">
					<Plus className="h-4 w-4 mr-1" />
					New
				</Button>
			)}
			<Button size="icon" onClick={toggleOpen} className={cn("h-12 w-12 rounded-full shadow-lg transition-transform", isOpen ? "rotate-90" : "")}>
				{isOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
			</Button>
		</div>
	);
};
