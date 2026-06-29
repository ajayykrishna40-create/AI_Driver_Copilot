import { Avatar, AvatarFallback } from "./ui/avatar";
import { Car, User } from "lucide-react";

interface ChatMessageProps {
  message: string;
  sender: "user" | "assistant";
  timestamp: string;
}

export function ChatMessage({ message, sender, timestamp }: ChatMessageProps) {
  const isUser = sender === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className={isUser ? "bg-blue-500" : "bg-green-600"}>
          {isUser ? <User className="h-4 w-4 text-white" /> : <Car className="h-4 w-4 text-white" />}
        </AvatarFallback>
      </Avatar>
      
      <div className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"} max-w-[80%]`}>
        <div
          className={`rounded-2xl px-4 py-2 ${
            isUser
              ? "bg-blue-500 text-white rounded-tr-sm"
              : "bg-gray-100 text-gray-900 rounded-tl-sm"
          }`}
        >
          <p className="text-sm leading-relaxed">{message}</p>
        </div>
        <span className="text-xs text-gray-500 px-1">{timestamp}</span>
      </div>
    </div>
  );
}
