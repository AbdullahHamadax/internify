// components/Chatbot.tsx
"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Bot, X, Send, TerminalSquare, Loader2, Sparkles } from "lucide-react";

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
    headerBg: "bg-gradient-to-r from-purple-700 via-purple-600 to-fuchsia-600",
    headerIconBg: "bg-black text-[#E879F9]",
    headerIconBorder: "border-[#E879F9]",
    userBubbleBg: "bg-purple-600 text-white",
    botBubbleBg: "bg-purple-100 dark:bg-purple-950/40 text-black dark:text-purple-100",
    toggleBtnBg: "bg-purple-400",
    toggleBtnHoverBg: "bg-purple-500",
    accent: "text-purple-600 dark:text-purple-400",
    nameStr: "Dalil ( دليل ) - Employer",
  },
  student: {
    headerBg: "bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-600",
    headerIconBg: "bg-black text-[#60A5FA]",
    headerIconBorder: "border-[#60A5FA]",
    userBubbleBg: "bg-blue-600 text-white",
    botBubbleBg: "bg-blue-100 dark:bg-blue-950/40 text-black dark:text-blue-100",
    toggleBtnBg: "bg-blue-400",
    toggleBtnHoverBg: "bg-blue-500",
    accent: "text-blue-600 dark:text-blue-400",
    nameStr: "Dalil ( دليل ) - Student",
  },
  guest: {
    headerBg: "bg-gradient-to-r from-slate-700 via-slate-600 to-gray-600",
    headerIconBg: "bg-black text-[#94A3B8]",
    headerIconBorder: "border-[#94A3B8]",
    userBubbleBg: "bg-slate-700 text-white",
    botBubbleBg: "bg-slate-200 dark:bg-slate-900/60 text-black dark:text-slate-200",
    toggleBtnBg: "bg-[#FDE68A]",
    toggleBtnHoverBg: "bg-[#F59E0B]",
    accent: "text-slate-600 dark:text-slate-400",
    nameStr: "Dalil ( دليل )",
  },
};

export default function Chatbot({ userRole }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const theme = roleThemes[userRole] || roleThemes.guest;

  // Ref for auto-scrolling to the bottom of the chat
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, isOpen]);

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
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-80 sm:w-[26rem] h-[34rem] bg-background border-4 border-black dark:border-white shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff] flex flex-col relative overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300 rounded-lg">
          
          {/* Enhanced Themed Header */}
          <div className={`${theme.headerBg} border-b-4 border-black dark:border-white p-5 flex justify-between items-center text-white shrink-0 relative overflow-hidden`}>
            {/* Subtle animated background shapes for the header */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl animate-pulse delay-150 pointer-events-none" />
            <div className="absolute bottom-0 left-10 w-16 h-16 bg-black opacity-10 rounded-full blur-lg animate-pulse pointer-events-none" />

            <div className="flex items-center gap-3 relative z-10">
              <div className="relative">
                <div className={`w-10 h-10 flex items-center justify-center rounded-xl border-2 border-black dark:border-white ${theme.headerIconBg} shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] relative z-10 overflow-hidden group`}>
                   <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
                   <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </div>
                {/* Status indicator dot */}
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-black rounded-full z-20 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold font-sora tracking-tight text-lg leading-tight flex items-center gap-2">
                  Dalil 
                  <span className="text-xs font-normal opacity-90 px-1.5 py-0.5 bg-black/20 rounded-md uppercase tracking-wider hidden sm:inline-block">AI</span>
                </h3>
                <span className="text-xs opacity-80 font-medium">Assistant {userRole !== 'guest' ? `• ${userRole}` : ''}</span>
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 border-2 border-black dark:border-white bg-black/20 hover:bg-black dark:hover:bg-white dark:hover:text-black hover:text-white rounded-lg transition-all relative z-10 shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none"
              aria-label="Close Chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-5 overflow-y-auto bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-zinc-50 dark:bg-zinc-950 flex flex-col gap-5 custom-scrollbar relative">
            
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-70 animate-in fade-in zoom-in duration-500">
                <div className={`p-4 rounded-full bg-black/5 dark:bg-white/5 border-2 border-dashed ${theme.accent} border-opacity-30`}>
                  <Bot className={`w-12 h-12 ${theme.accent}`} />
                </div>
                <div className="max-w-[85%] space-y-1">
                  <p className="font-bold font-sora tracking-wide text-foreground">
                    HOW CAN I HELP YOU?
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {userRole === "student" && "Ask about applying, tasks, or your profile."}
                    {userRole === "employer" && "Ask about managing tasks, reviewing candidates, etc."}
                    {userRole === "guest" && "Ask anything about how the Internify platform works."}
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex flex-col gap-1 max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                    {msg.role === "user" ? "You" : "Dalil"}
                  </span>
                  <div
                    className={`px-4 py-3 text-sm font-medium border-2 border-black dark:border-white leading-relaxed rounded-xl shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] ${
                      msg.role === "user"
                        ? `${theme.userBubbleBg} rounded-tr-none`
                        : `${theme.botBubbleBg} rounded-tl-none`
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
                   <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">Dalil</span>
                   <div className={`px-4 py-3 border-2 border-black dark:border-white ${theme.botBubbleBg} rounded-xl rounded-tl-none shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] flex items-center gap-2`}>
                    <Loader2 className={`w-4 h-4 animate-spin ${theme.accent}`} />
                    <span className="text-xs font-medium opacity-80 animate-pulse">Thinking...</span>
                   </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="shrink-0 h-1" />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-card border-t-4 border-black dark:border-white flex gap-3 shrink-0 relative z-10">
            <input
              className="flex-1 p-3 text-sm font-medium border-2 border-black dark:border-white bg-background text-foreground shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] focus:outline-none focus:ring-0 focus:-translate-y-0.5 focus:-translate-x-0.5 focus:shadow-[4px_4px_0_0_#000] dark:focus:shadow-[4px_4px_0_0_#fff] transition-all placeholder:text-muted-foreground placeholder:text-sm rounded-lg"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={loading}
              maxLength={500}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-black text-white dark:bg-white dark:text-black border-2 border-black dark:border-white w-12 h-12 rounded-lg flex items-center justify-center shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0_0_#000] dark:hover:shadow-[4px_4px_0_0_#fff] active:translate-y-0 active:translate-x-0 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 group"
              aria-label="Send Message"
            >
              <Send className="w-5 h-5 shrink-0 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`group w-16 h-16 ${theme.toggleBtnBg} text-black border-4 border-black dark:border-white shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#fff] flex items-center justify-center hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0_0_#000] dark:hover:shadow-[8px_8px_0_0_#fff] active:translate-y-0 active:translate-x-0 active:shadow-none transition-all relative overflow-hidden rounded-2xl`}
          aria-label="Open AI Assistant"
        >
          {/* Animated Background geometric shape */}
          <div className={`absolute inset-0 ${theme.toggleBtnHoverBg} opacity-0 translate-y-full group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-in-out`} />

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

