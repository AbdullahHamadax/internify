// components/Chatbot.tsx
"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Bot, X, Send, TerminalSquare, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  // Ref for auto-scrolling to the bottom of the chat
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, isOpen]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content }),
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
        <div className="mb-4 w-80 sm:w-96 h-[32rem] bg-background border-4 border-black dark:border-white shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff] flex flex-col relative overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200">
          {/* Header */}
          <div className="bg-[#AB47BC] border-b-4 border-black dark:border-white p-4 flex justify-between items-center text-white shrink-0">
            <h3 className="font-black flex items-center gap-2 uppercase tracking-widest text-sm">
              <TerminalSquare className="w-5 h-5 shadow-[2px_2px_0_0_#000] bg-black text-[#AB47BC] p-0.5" />
              Dalil ( دليل )
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 border-2 border-transparent hover:border-black dark:hover:border-white hover:bg-black hover:text-[#AB47BC] transition-colors"
              aria-label="Close Chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-5 overflow-y-auto bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-zinc-50 dark:bg-zinc-950 flex flex-col gap-4 custom-scrollbar">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-70">
                <Bot className="w-12 h-12 text-muted-foreground" />
                <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground max-w-[80%]">
                  INITIATE QUERY SEQUENCE... ASK ME ANYTHING ABOUT THE PLATFORM.
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-4 py-3 text-sm font-bold border-2 border-black dark:border-white max-w-[85%] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#2563EB] text-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]"
                      : "bg-[#A7F3D0] text-black shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="px-4 py-3 border-2 border-black dark:border-white bg-[#A7F3D0] text-black shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]">
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="shrink-0 h-1" />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-card border-t-4 border-black dark:border-white flex gap-3 shrink-0">
            <input
              className="flex-1 p-3 text-sm font-bold border-2 border-black dark:border-white bg-background text-foreground shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] focus:outline-none focus:ring-0 focus:-translate-y-0.5 focus:-translate-x-0.5 focus:shadow-[4px_4px_0_0_#000] dark:focus:shadow-[4px_4px_0_0_#fff] transition-all placeholder:text-muted-foreground placeholder:uppercase placeholder:text-xs"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="ENTER COMMAND..."
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-black text-white dark:bg-white dark:text-black border-2 border-black dark:border-white w-12 h-12 flex items-center justify-center shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0_0_#000] dark:hover:shadow-[4px_4px_0_0_#fff] active:translate-y-0 active:translate-x-0 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              aria-label="Send Message"
            >
              <Send className="w-5 h-5 -ml-1 mt-1 shrink-0" />
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group w-16 h-16 bg-[#FDE68A] text-black border-4 border-black dark:border-white shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#fff] flex items-center justify-center hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0_0_#000] dark:hover:shadow-[8px_8px_0_0_#fff] active:translate-y-0 active:translate-x-0 active:shadow-none transition-all relative overflow-hidden"
          aria-label="Open AI Assistant"
        >
          {/* Animated Background geometric shape */}
          <div className="absolute inset-0 bg-[#F59E0B] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />

          <Bot
            className="w-8 h-8 relative z-10 group-hover:rotate-12 transition-transform duration-300"
            strokeWidth={2.5}
          />
        </button>
      )}
    </div>
  );
}
