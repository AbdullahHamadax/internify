// components/Chatbot.tsx
"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Bot, X, Send, Loader2 } from "lucide-react";
import Image from "next/image";
interface Message {
  role: "user" | "assistant";
  content: string;
}

export type ChatbotRole = "student" | "employer" | "guest";

interface ChatbotProps {
  userRole: ChatbotRole;
}

// Theme configuration for different roles
const roleThemes = {
  employer: {
    headerBg: "bg-purple-600",
    headerText: "text-white",
    headerIconBg: "bg-black text-purple-400",
    headerIconBorder: "border-purple-400",
    userBubbleBg: "bg-purple-600 text-white",
    botBubbleBg:
      "bg-purple-50 dark:bg-purple-900/30 text-black dark:text-purple-100",
    toggleBtnBg: "bg-purple-600",
    toggleBtnHoverBg: "bg-purple-700",
    accent: "text-purple-600 dark:text-purple-400",
    emptyIconBg: "bg-purple-600",
    nameStr: "Dalil ( دليل ) - Employer",
  },
  student: {
    headerBg: "bg-blue-600",
    headerText: "text-white",
    headerIconBg: "bg-black text-blue-400",
    headerIconBorder: "border-blue-400",
    userBubbleBg: "bg-blue-600 text-white",
    botBubbleBg: "bg-blue-50 dark:bg-blue-900/30 text-black dark:text-blue-100",
    toggleBtnBg: "bg-blue-600",
    toggleBtnHoverBg: "bg-blue-700",
    accent: "text-blue-600 dark:text-blue-400",
    emptyIconBg: "bg-blue-600",
    nameStr: "Dalil ( دليل ) - Student",
  },
  guest: {
    headerBg: "bg-black",
    headerText: "text-white",
    headerIconBg: "bg-white text-black",
    headerIconBorder: "border-white",
    userBubbleBg: "bg-black text-white",
    botBubbleBg: "bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white",
    toggleBtnBg: "bg-black",
    toggleBtnHoverBg: "bg-zinc-800",
    accent: "text-black dark:text-white",
    emptyIconBg: "bg-black",
    nameStr: "Dalil ( دليل )",
  },
};

export default function Chatbot({ userRole }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const theme = roleThemes[userRole] || roleThemes.guest;

  // Refs for auto-scrolling and detecting clicks outside
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, isOpen]);

  // Click outside to close logic
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        chatWindowRef.current &&
        !chatWindowRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const sendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    // Client-side validation: cap length
    const sanitizedInput = trimmedInput.slice(0, 500);

    const userMessage: Message = { role: "user", content: sanitizedInput };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send userRole so the backend can enforce role-based access
        body: JSON.stringify({ message: sanitizedInput, userRole }),
      });

      const data = await response.json();

      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "ERROR: INVALID_RESPONSE_PAYLOAD" },
        ]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "SYSTEM ERROR: NETWORK_CONNECTION_FAILED",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-100 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div 
          ref={chatWindowRef}
          className="mb-4 w-80 sm:w-104 h-136 bg-background border-[2.5px] border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] flex flex-col relative overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300"
        >
          {/* Enhanced Themed Header */}
          <div
            className={`${theme.headerBg} border-b-[2.5px] border-black dark:border-white p-5 flex justify-between items-center ${theme.headerText} shrink-0 relative overflow-hidden`}
          >
            <div className="flex items-center gap-3 relative z-10">
              <div className="relative">
                <div
                  className={`w-10 h-10 flex items-center justify-center border-[2.5px] border-black dark:border-white ${theme.headerIconBg} shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] relative z-10 overflow-hidden group`}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity" />
                  <Image
                    src="/dalil.jpg"
                    alt="Dalil Logo"
                    width={512}
                    height={512}
                    className="size-13 group-hover:rotate-12 transition-transform object-cover"
                  />
                </div>
                {/* Status indicator dot */}
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-black rounded-full z-20 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold font-sora tracking-tight text-lg leading-tight flex items-center gap-2">
                  Dalil
                  <span className="text-[10px] font-black bg-black text-white px-1.5 py-0.5 uppercase tracking-wider hidden sm:inline-block border border-white/20">
                    AI
                  </span>
                </h3>
                <span className="text-xs opacity-80 font-medium">
                  Assistant {userRole !== "guest" ? `• ${userRole}` : ""}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 flex items-center justify-center border-[2.5px] border-black dark:border-white bg-white text-black hover:bg-black hover:text-white transition-all relative z-10 shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none"
              aria-label="Close Chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-5 overflow-y-auto bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-zinc-50 dark:bg-zinc-950 flex flex-col gap-5 custom-scrollbar relative">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-70 animate-in fade-in zoom-in duration-500">
                <div
                  className={`w-16 h-16 flex items-center justify-center border-[2.5px] border-black dark:border-white ${theme.emptyIconBg} shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]`}
                >
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <div className="max-w-[85%] space-y-1">
                  <p className="font-bold font-sora tracking-wide text-foreground uppercase">
                    Initiating Session
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {userRole === "student" &&
                      "Ask about applying, tasks, or your profile."}
                    {userRole === "employer" &&
                      "Ask about managing tasks, reviewing candidates, etc."}
                    {userRole === "guest" &&
                      "Ask anything about how the Internify platform works."}
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex flex-col gap-1 max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                    {msg.role === "user" ? "You" : "Dalil"}
                  </span>
                  <div
                    className={`px-4 py-3 text-sm font-bold border-[2.5px] border-black dark:border-white leading-relaxed shadow-[4px_4px_0_0_#111] ${
                      msg.role === "user"
                        ? `${theme.userBubbleBg}`
                        : `${theme.botBubbleBg}`
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex flex-col gap-1 max-w-[85%] items-start">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                    Dalil
                  </span>
                  <div
                    className={`px-4 py-3 border-[2.5px] border-black dark:border-white ${theme.botBubbleBg} shadow-[4px_4px_0_0_#111] flex items-center gap-2`}
                  >
                    <Loader2
                      className={`w-4 h-4 animate-spin ${theme.accent}`}
                    />
                    <span className="text-xs font-bold opacity-80 animate-pulse uppercase">
                      Processing...
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="shrink-0 h-1" />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t-[2.5px] border-black dark:border-white flex gap-3 shrink-0 relative z-10">
            <input
              className="flex-1 p-3 text-sm font-bold border-[2.5px] border-black dark:border-white bg-background text-foreground shadow-[2px_2px_0_0_#111] focus:outline-none focus:ring-0 focus:-translate-y-0.5 focus:-translate-x-0.5 focus:shadow-[4px_4px_0_0_#111] transition-all placeholder:text-muted-foreground placeholder:text-xs placeholder:uppercase"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter command..."
              disabled={loading}
              maxLength={500}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-black text-white dark:bg-white dark:text-black border-[2.5px] border-black dark:border-white w-12 h-12 flex items-center justify-center shadow-[2px_2px_0_0_#111] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0_0_#111] active:translate-y-0 active:translate-x-0 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 group"
              aria-label="Send Message"
            >
              <Send className="w-5 h-5 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`group w-16 h-16 ${theme.toggleBtnBg} text-white border-[2.5px] border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] flex items-center justify-center hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_0_#000] dark:hover:shadow-[6px_6px_0_0_#fff] active:translate-y-0 active:translate-x-0 active:shadow-none transition-all relative overflow-hidden`}
          aria-label="Open AI Assistant"
        >
          {/* Animated Background geometric shape */}
          <div
            className={`absolute inset-0 ${theme.toggleBtnHoverBg} opacity-0 translate-y-full group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-in-out`}
          />

          <Bot
            className="w-8 h-8 relative z-10 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300"
            strokeWidth={2.5}
          />
          {/* Notification ping */}
          <span className="absolute top-2 right-2 flex h-3 w-3 z-20">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white border border-black"></span>
          </span>
        </button>
      )}
    </div>
  );
}
