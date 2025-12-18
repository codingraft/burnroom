"use client";

import { useUsername } from "@/hooks/use-username";
import { client } from "@/lib/client";
import { useRealtime } from "@/lib/realtime-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  roomId: string;
}

function formatTimeRemaining(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getUrgencyLevel(seconds: number | null): "safe" | "warning" | "danger" | "critical" {
  if (seconds === null) return "safe";
  if (seconds <= 30) return "critical";
  if (seconds <= 60) return "danger";
  if (seconds <= 120) return "warning";
  return "safe";
}

const Page = () => {
  const params = useParams();
  const roomId = params.roomId as string;

  const router = useRouter();
  const queryClient = useQueryClient();

  const { username } = useUsername();

  const [input, setInput] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [copyStatus, setCopyStatus] = useState<string>("COPY");
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const {data: ttlData} = useQuery({
    queryKey: ["ttl", roomId],
    queryFn: async () => {
      const res = await client.room.ttl.get({ query: { roomId } });
      return res.data
    }
  })

  useEffect(() => {
    if (ttlData?.ttl !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimeRemaining(ttlData.ttl);
    }
  }, [ttlData?.ttl]);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;
    
    if(timeRemaining === 0) {
      router.push("/?destroyed=true");
      return;
    }
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) return prev;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, router]);

  const { data: messages, refetch } = useQuery({
    queryKey: ["messages", roomId],
    queryFn: async () => {
      const res = await client.messages.get({ query: { roomId } });
      return res.data;
    },
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      await client.messages.post(
        {
          sender: username,
          text,
        },
        { query: { roomId } }
      );
    },
    onMutate: async ({ text }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["messages", roomId] });

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData(["messages", roomId]);

      // Optimistically update
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        sender: username,
        text,
        timestamp: Date.now(),
        roomId,
      };

      queryClient.setQueryData(
        ["messages", roomId],
        (old: { messages: Message[] } | undefined) => ({
          messages: [...(old?.messages || []), optimisticMessage],
        })
      );

      return { previousMessages };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(["messages", roomId], context.previousMessages);
      }
    },
  });

  useRealtime({
    channels: [roomId],
    events: ["chat.message", "chat.destroy"],
    onData: ({ event }) => {
      if (event === "chat.message") {
        refetch();
      }
      if (event === "chat.destroy") {
        router.push("/?destroyed=true");
      }
    },
  });

  const {mutate: destroyRoom, isPending: isDestroying} = useMutation({
    mutationFn: async () => {
      await client.room.delete(null, { query: { roomId } });
    }
  })

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopyStatus("COPIED!");
    setTimeout(() => setCopyStatus("COPY"), 2000);
  };

  const urgency = getUrgencyLevel(timeRemaining);

  const urgencyStyles = {
    safe: "text-green-400 border-green-500/30",
    warning: "text-amber-400 border-amber-500/30 glow-amber",
    danger: "text-red-400 border-red-500/30 glow-red",
    critical: "text-red-500 border-red-500/50 glow-red urgent-pulse",
  };

  const progressPercent = timeRemaining !== null ? (timeRemaining / 300) * 100 : 100;

  return (
    <main className="flex flex-col h-screen max-h-screen overflow-hidden relative">
      {/* Urgency background overlay */}
      {urgency === "critical" && (
        <div className="absolute inset-0 bg-red-500/5 pointer-events-none animate-pulse" />
      )}
      {urgency === "danger" && (
        <div className="absolute inset-0 bg-red-500/3 pointer-events-none" />
      )}
      
      {/* Header */}
      <header className="border-b border-card-border bg-card/90 backdrop-blur-xl relative z-10">
        {/* Progress bar */}
        <div className="h-1 bg-background relative overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ease-linear ${
              urgency === "critical" ? "bg-red-500 animate-pulse" :
              urgency === "danger" ? "bg-red-500" :
              urgency === "warning" ? "bg-amber-500" :
              "bg-green-500"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        
        <div className="p-2 sm:p-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-6 flex-1 min-w-0">
            {/* Room ID */}
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-muted uppercase tracking-wider mb-1 hidden sm:block">Room</span>
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="font-bold text-green-600 dark:text-green-400 text-xs sm:text-sm tracking-wider truncate max-w-20 sm:max-w-none">{roomId}</span>
                <button
                  onClick={copyLink}
                  className={`text-[10px] px-1.5 sm:px-2 py-0.5 rounded transition-all shrink-0 ${
                    copyStatus === "COPIED!" 
                      ? "bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30" 
                      : "bg-card hover:bg-card-border text-muted hover:text-foreground border border-card-border"
                  }`}
                >
                  {copyStatus}
                </button>
              </div>
            </div>

            <div className="h-8 sm:h-10 w-px bg-card-border shrink-0" />

            {/* Countdown */}
            <div className="flex flex-col">
              <span className="text-[10px] text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
                <span className={urgency === "critical" ? "animate-pulse" : ""}>💣</span>
                <span className="hidden sm:inline">Self-Destruct</span>
              </span>
              <div className={`text-lg sm:text-2xl font-black tracking-wider ${urgencyStyles[urgency]}`}>
                {timeRemaining !== null ? formatTimeRemaining(timeRemaining) : "--:--"}
              </div>
            </div>
          </div>

          {/* Destroy button */}
          <button 
            onClick={() => destroyRoom()}
            disabled={isDestroying}
            className="relative group overflow-hidden rounded disabled:opacity-50 shrink-0 cursor-pointer"
          >
            <div className="absolute inset-0 bg-linear-to-r from-red-600 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center gap-1 sm:gap-2 bg-card group-hover:bg-transparent border border-card-border group-hover:border-red-500/50 px-2 sm:px-4 py-2 transition-all">
              <span className="text-base sm:text-lg group-hover:animate-pulse">🔥</span>
              <span className="text-[10px] sm:text-xs font-bold text-muted group-hover:text-white tracking-wider hidden sm:inline">
                {isDestroying ? "DESTROYING..." : "DESTROY NOW"}
              </span>
            </div>
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4 dark:burn-gradient">
        {messages?.messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 px-4">
            <div className="text-4xl opacity-20">💬</div>
            <div className="space-y-2">
              <p className="text-muted text-sm">No messages yet</p>
              <p className="text-muted text-xs">
                Start the conversation before time runs out
              </p>
            </div>
          </div>
        )}

        {messages?.messages.map((msg) => {
          const isOwn = msg.sender === username;
          return (
            <div 
              key={msg.id} 
              className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[85%] sm:max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium ${isOwn ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
                    {isOwn ? "You" : msg.sender}
                  </span>
                  <span className="text-[10px] text-muted">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className={`relative group ${
                  isOwn 
                    ? "bg-green-500/10 border border-green-500/20" 
                    : "bg-card/50 border border-card-border/50"
                } px-3 sm:px-4 py-2 sm:py-3 rounded-lg`}>
                  <p className="text-foreground text-sm leading-relaxed wrap-break-word">{msg.text}</p>
                  {/* Subtle burning effect on hover */}
                  <div className="absolute inset-0 bg-linear-to-t from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none" />
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-card-border bg-card/90 backdrop-blur-xl p-2 sm:p-4">
        <div className="flex gap-2 sm:gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-green-500 cursor-blink font-bold">
              ›
            </span>
            <input
              type="text"
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              ref={inputRef}
              onKeyDown={(e) => {
                if (e.key === "Enter" && input.trim() !== "") {
                  sendMessage({ text: input.trim() });
                  inputRef.current?.focus();
                  setInput("");
                }
              }}
              placeholder="Type message..."
              className="w-full bg-background/50 pl-7 sm:pl-8 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-card-border focus:border-green-500/50 focus:outline-none focus:ring-1 focus:ring-green-500/20 transition-all text-foreground placeholder:text-muted text-sm rounded-lg"
            />
          </div>
          <button
            disabled={input.trim() === "" || isPending}
            onClick={() => {
              sendMessage({ text: input.trim() });
              inputRef.current?.focus();
              setInput("");
            }}
            className="relative group overflow-hidden rounded-lg disabled:opacity-30 disabled:cursor-not-allowed shrink-0 cursor-pointer"
          >
            <div className="absolute inset-0 bg-linear-to-r from-green-600 to-green-500" />
            <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
            <div className="relative px-4 sm:px-6 py-2.5 sm:py-3 font-bold text-white text-sm tracking-wider flex items-center gap-1 sm:gap-2">
              <span className="hidden sm:inline">SEND</span>
              <span>→</span>
            </div>
          </button>
        </div>
        
        {/* Bottom warning */}
        {urgency !== "safe" && (
          <div className={`mt-3 text-center text-xs ${
            urgency === "critical" ? "text-red-500 dark:text-red-400 animate-pulse" :
            urgency === "danger" ? "text-red-500 dark:text-red-400" :
            "text-amber-500 dark:text-amber-400"
          }`}>
            {urgency === "critical" && "⚠️ Room will self-destruct in less than 30 seconds!"}
            {urgency === "danger" && "⚠️ Less than 1 minute remaining"}
            {urgency === "warning" && "⏱️ Time is running out..."}
          </div>
        )}
      </div>
    </main>
  );
};

export default Page;
