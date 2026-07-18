import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

type WelcomeProps = {
  onLogin: () => void;
};

export const Welcome = ({ onLogin }: WelcomeProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Bot className="h-8 w-8 text-primary" />
      </div>
      <h4 className="text-lg font-semibold">Hey, I&apos;m Jarvis!</h4>
      <p className="text-sm text-muted-foreground max-w-[200px]">You need to be logged in to chat with me</p>
      <Button onClick={onLogin}>Login</Button>
    </div>
  );
};
