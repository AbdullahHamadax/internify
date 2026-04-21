// components/Chatbot.tsx
"use client";

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import {
  Bot,
  X,
  Send,
  Loader2,
  Trash2,
  Menu,
  Plus,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import Image from "next/image";

// ─── Types ───
interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  error?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export type ChatbotRole = "student" | "employer" | "guest";

interface ChatbotProps {
  userRole: ChatbotRole;
}

// ─── Constants ───
const DALIL_DISPLAY_NAME = "Dalil (دَلِيل)";
const MAX_CONVERSATIONS = 6;
const MAX_MESSAGES_PER_CONV = 50;
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// ─── Theme configuration ───
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
    nameStr: `${DALIL_DISPLAY_NAME} - Employer`,
    sidebarActive: "bg-purple-100 dark:bg-purple-900/40 border-purple-500",
    chipBg:
      "bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900/40",
  },
  student: {
    headerBg: "bg-blue-600",
    headerText: "text-white",
    headerIconBg: "bg-black text-blue-400",
    headerIconBorder: "border-blue-400",
    userBubbleBg: "bg-blue-600 text-white",
    botBubbleBg:
      "bg-blue-50 dark:bg-blue-900/30 text-black dark:text-blue-100",
    toggleBtnBg: "bg-blue-600",
    toggleBtnHoverBg: "bg-blue-700",
    accent: "text-blue-600 dark:text-blue-400",
    emptyIconBg: "bg-blue-600",
    nameStr: `${DALIL_DISPLAY_NAME} - Student`,
    sidebarActive: "bg-blue-100 dark:bg-blue-900/40 border-blue-500",
    chipBg:
      "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/40",
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
    nameStr: DALIL_DISPLAY_NAME,
    sidebarActive: "bg-zinc-200 dark:bg-zinc-700 border-zinc-500",
    chipBg:
      "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-700",
  },
};

// ─── Quick Action Chips ───
const quickActions: Record<ChatbotRole, string[]> = {
  student: [
    "How do I apply for tasks?",
    "Help me improve my profile",
    "What skills are in demand?",
  ],
  employer: [
    "How do I post a task?",
    "Tips for reviewing applicants",
    "What makes a good task?",
  ],
  guest: [
    "What is Internify?",
    "How does the platform work?",
    "Student vs Employer?",
  ],
};

// ─── Helpers ───
function getRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function generateConvId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function createNewConversation(): Conversation {
  return {
    id: generateConvId(),
    title: "New Chat",
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// ─── Rate Limiting ───
function checkRateLimit(): {
  allowed: boolean;
  remaining: number;
  resetInMin: number;
} {
  const key = "dalil-rate-limit";
  const now = Date.now();
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const { count, resetAt } = JSON.parse(stored);
      if (now > resetAt)
        return { allowed: true, remaining: RATE_LIMIT_MAX, resetInMin: 0 };
      if (count >= RATE_LIMIT_MAX)
        return {
          allowed: false,
          remaining: 0,
          resetInMin: Math.ceil((resetAt - now) / 60000),
        };
      return {
        allowed: true,
        remaining: RATE_LIMIT_MAX - count,
        resetInMin: 0,
      };
    }
  } catch {}
  return { allowed: true, remaining: RATE_LIMIT_MAX, resetInMin: 0 };
}

function consumeRateLimit(): void {
  const key = "dalil-rate-limit";
  const now = Date.now();
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const { count, resetAt } = JSON.parse(stored);
      if (now > resetAt) {
        localStorage.setItem(
          key,
          JSON.stringify({ count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS }),
        );
      } else {
        localStorage.setItem(
          key,
          JSON.stringify({ count: count + 1, resetAt }),
        );
      }
    } else {
      localStorage.setItem(
        key,
        JSON.stringify({ count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS }),
      );
    }
  } catch {}
}

// ═══════════════════════════════════════════
// ─── Component ───
// ═══════════════════════════════════════════
export default function Chatbot({ userRole }: ChatbotProps) {
  // ─── Core State ───
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  // ─── Conversations State ───
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // ─── Typewriter Refs ───
  const bufferRef = useRef("");
  const displayedRef = useRef("");
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamDoneRef = useRef(false);
  const activeConvIdRef = useRef<string | null>(null);

  const theme = roleThemes[userRole] || roleThemes.guest;
  const CONV_STORAGE_KEY = `dalil-convs-${userRole}`;
  const ACTIVE_CONV_KEY = `dalil-active-${userRole}`;

  // ─── Refs ───
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  // ─── Keep activeConvId ref in sync ───
  useEffect(() => {
    activeConvIdRef.current = activeConvId;
  }, [activeConvId]);

  // ─── Derived State ───
  const activeConversation =
    conversations.find((c) => c.id === activeConvId) || null;
  const messages = activeConversation?.messages || [];

  // ─── Helper: Update messages in active conversation ───
  const updateMessages = useCallback(
    (updater: (prev: Message[]) => Message[]) => {
      const currentId = activeConvIdRef.current;
      if (!currentId) return;
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id !== currentId) return conv;
          const newMessages = updater(conv.messages).slice(
            -MAX_MESSAGES_PER_CONV,
          );
          const firstUserMsg = newMessages.find((m) => m.role === "user");
          const newTitle =
            conv.title === "New Chat" && firstUserMsg
              ? firstUserMsg.content.slice(0, 30) +
                (firstUserMsg.content.length > 30 ? "..." : "")
              : conv.title;
          return {
            ...conv,
            messages: newMessages,
            updatedAt: Date.now(),
            title: newTitle,
          };
        }),
      );
    },
    [],
  );

  // ─── Load from localStorage ───
  useEffect(() => {
    try {
      const savedConvs = localStorage.getItem(CONV_STORAGE_KEY);
      const savedActive = localStorage.getItem(ACTIVE_CONV_KEY);

      if (savedConvs) {
        const parsed = JSON.parse(savedConvs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setConversations(parsed);
          if (
            savedActive &&
            parsed.find((c: Conversation) => c.id === savedActive)
          ) {
            setActiveConvId(savedActive);
          } else {
            setActiveConvId(parsed[parsed.length - 1].id);
          }
          setInitialized(true);
          return;
        }
      }
    } catch {}
    const first = createNewConversation();
    setConversations([first]);
    setActiveConvId(first.id);
    setInitialized(true);
  }, [CONV_STORAGE_KEY, ACTIVE_CONV_KEY]);

  // ─── Save to localStorage ───
  useEffect(() => {
    if (!initialized) return;
    try {
      localStorage.setItem(CONV_STORAGE_KEY, JSON.stringify(conversations));
      if (activeConvId) {
        localStorage.setItem(ACTIVE_CONV_KEY, activeConvId);
      }
    } catch {}
  }, [conversations, activeConvId, initialized, CONV_STORAGE_KEY, ACTIVE_CONV_KEY]);

  // ─── Auto-scroll ───
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, isOpen, scrollToBottom]);

  // ─── Click outside to close ───
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // ─── Typewriter ───
  const stopTypewriter = useCallback(() => {
    if (typewriterRef.current) {
      clearInterval(typewriterRef.current);
      typewriterRef.current = null;
    }
  }, []);

  const startTypewriter = useCallback(() => {
    stopTypewriter();
    typewriterRef.current = setInterval(() => {
      const buffer = bufferRef.current;
      const displayed = displayedRef.current;

      if (displayed.length < buffer.length) {
        const charsToReveal = Math.min(2, buffer.length - displayed.length);
        displayedRef.current = buffer.slice(
          0,
          displayed.length + charsToReveal,
        );
        updateMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: displayedRef.current,
          };
          return updated;
        });
        scrollToBottom();
      } else if (streamDoneRef.current) {
        stopTypewriter();
        setIsStreaming(false);
        setLoading(false);
      }
    }, 15);
  }, [stopTypewriter, scrollToBottom, updateMessages]);

  useEffect(() => {
    return () => stopTypewriter();
  }, [stopTypewriter]);

  // ─── Conversation Management ───
  const handleNewChat = () => {
    if (isStreaming || loading) return;
    if (activeConversation && activeConversation.messages.length === 0) {
      setIsSidebarOpen(false);
      return;
    }
    let updated = [...conversations];
    if (updated.length >= MAX_CONVERSATIONS) {
      updated = updated.slice(-(MAX_CONVERSATIONS - 1));
    }
    const newConv = createNewConversation();
    updated.push(newConv);
    setConversations(updated);
    setActiveConvId(newConv.id);
    setIsSidebarOpen(false);
  };

  const handleSwitchConv = (convId: string) => {
    if (isStreaming || loading || convId === activeConvId) return;
    setActiveConvId(convId);
    setIsSidebarOpen(false);
  };

  const handleDeleteConv = (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    if (isStreaming || loading) return;
    const remaining = conversations.filter((c) => c.id !== convId);
    if (remaining.length === 0) {
      const newConv = createNewConversation();
      setConversations([newConv]);
      setActiveConvId(newConv.id);
    } else {
      setConversations(remaining);
      if (activeConvId === convId) {
        setActiveConvId(remaining[remaining.length - 1].id);
      }
    }
  };

  const handleClearChat = () => {
    if (isStreaming || loading) return;
    updateMessages(() => []);
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId ? { ...c, title: "New Chat" } : c,
      ),
    );
  };

  // ─── Send Message ───
  // directContent: sent from chips (bypasses input state)
  // retryContent: sent from retry button (skips adding user message)
  const sendMessage = async (directContent?: string, isRetry?: boolean) => {
    const content = directContent || input.trim();
    if (!content || loading) return;

    const rateCheck = checkRateLimit();
    if (!rateCheck.allowed) {
      setRateLimitError(
        `Message limit reached. Try again in ${rateCheck.resetInMin} min.`,
      );
      return;
    }
    setRateLimitError(null);

    const sanitizedContent = content.slice(0, 500);

    // Build history BEFORE modifying state
    const cleanMessages = messages.filter((m) => !m.error);
    const historyForApi = isRetry
      ? cleanMessages.slice(0, -1).slice(-10)
      : cleanMessages.slice(-10);

    if (isRetry) {
      updateMessages((prev) => prev.filter((m) => !m.error));
    } else {
      updateMessages((prev) => [
        ...prev,
        { role: "user", content: sanitizedContent, timestamp: Date.now() },
      ]);
      setInput("");
    }

    setLoading(true);
    bufferRef.current = "";
    displayedRef.current = "";
    streamDoneRef.current = false;
    consumeRateLimit();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: sanitizedContent,
          userRole,
          history: historyForApi.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok || !response.body) throw new Error("Stream failed");

      updateMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", timestamp: Date.now() },
      ]);
      setIsStreaming(true);
      startTypewriter();

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;
          const data = trimmed.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) bufferRef.current += parsed.text;
          } catch {}
        }
      }

      streamDoneRef.current = true;

      if (!bufferRef.current) {
        stopTypewriter();
        updateMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: "I couldn't generate a response.",
            timestamp: Date.now(),
            error: true,
          };
          return updated;
        });
        setIsStreaming(false);
        setLoading(false);
      }
    } catch (error) {
      console.error("Chat send failed:", error);
      stopTypewriter();
      updateMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Connection failed. Please try again.",
          timestamp: Date.now(),
          error: true,
        },
      ]);
      setIsStreaming(false);
      setLoading(false);
    }
  };

  // ─── Retry Handler ───
  const handleRetry = () => {
    const lastUserMsg = messages.filter((m) => m.role === "user").pop();
    if (lastUserMsg) sendMessage(lastUserMsg.content, true);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  // ─── Rate limit display ───
  const currentRateInfo = checkRateLimit();

  // ═════════════════════════════════════════
  // ─── JSX ───
  // ═════════════════════════════════════════
  return (
    <div className="fixed bottom-6 right-6 z-100 flex flex-col items-end">
      {/* ─── Chat Window ─── */}
      {isOpen && (
        <div
          ref={chatWindowRef}
          className="mb-4 w-80 sm:w-104 h-136 bg-background border-[2.5px] border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] flex flex-col relative overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300"
        >
          {/* ─── Header ─── */}
          <div
            className={`${theme.headerBg} border-b-[2.5px] border-black dark:border-white p-4 flex justify-between items-center ${theme.headerText} shrink-0 relative overflow-hidden`}
          >
            <div className="flex items-center gap-2 relative z-10">
              {/* Sidebar Toggle */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="w-8 h-8 flex items-center justify-center border-[2px] border-black/30 dark:border-white/30 bg-white/10 text-white hover:bg-white/25 transition-all active:scale-95"
                aria-label="Toggle conversations"
              >
                <Menu className="w-4 h-4" />
              </button>

              <div className="relative">
                <div
                  className={`w-8 h-8 flex items-center justify-center border-[2px] border-black dark:border-white ${theme.headerIconBg} shadow-[1px_1px_0_0_#000] dark:shadow-[1px_1px_0_0_#fff] overflow-hidden`}
                >
                  <Image
                    src="/dalil.jpg"
                    alt={`${DALIL_DISPLAY_NAME} Logo`}
                    width={512}
                    height={512}
                    className="size-11 object-cover"
                  />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-[1.5px] border-black rounded-full z-20" />
              </div>

              <div className="flex flex-col leading-none">
                <h3 className="font-bold font-sora tracking-tight text-sm flex items-center gap-1.5">
                  {DALIL_DISPLAY_NAME}
                  <span className="text-[8px] font-black bg-black text-white px-1 py-0.5 uppercase tracking-wider border border-white/20">
                    AI
                  </span>
                </h3>
                <span className="text-[10px] opacity-70 font-medium">
                  {userRole !== "guest" ? userRole : "assistant"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 relative z-10">
              {messages.length > 0 && (
                <button
                  onClick={handleClearChat}
                  disabled={isStreaming || loading}
                  className="w-7 h-7 flex items-center justify-center border-[2px] border-black/30 dark:border-white/30 bg-white/10 text-white hover:bg-red-500 transition-all active:scale-95 disabled:opacity-40"
                  aria-label="Clear Chat"
                  title="Clear this chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 flex items-center justify-center border-[2px] border-black dark:border-white bg-white text-black hover:bg-black hover:text-white transition-all active:scale-95 shadow-[1px_1px_0_0_#000] dark:shadow-[1px_1px_0_0_#fff]"
                aria-label="Close Chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ─── Body (Sidebar + Messages) ─── */}
          <div className="flex-1 relative overflow-hidden">
            {/* ─── Sidebar Overlay ─── */}
            <div
              className={`absolute inset-0 z-30 transition-opacity duration-200 ${isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            >
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/30 dark:bg-black/50"
                onClick={() => setIsSidebarOpen(false)}
              />

              {/* Sidebar Panel */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-[72%] bg-card border-r-[2.5px] border-black dark:border-white shadow-[4px_0_0_0_#000] dark:shadow-[4px_0_0_0_#fff] flex flex-col transition-transform duration-200 z-40 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
              >
                {/* New Chat Button */}
                <button
                  onClick={handleNewChat}
                  disabled={isStreaming || loading}
                  className="m-2 flex items-center justify-center gap-2 py-2.5 bg-foreground text-background border-[2px] border-black dark:border-white font-black uppercase tracking-widest text-[10px] shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Chat
                </button>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {[...conversations]
                    .sort((a, b) => b.updatedAt - a.updatedAt)
                    .map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => handleSwitchConv(conv.id)}
                        className={`w-full text-left px-3 py-2.5 border-b border-border flex items-start gap-2 hover:bg-muted/50 transition-colors group relative ${conv.id === activeConvId ? theme.sidebarActive + " border-l-[3px]" : "border-l-[3px] border-l-transparent"}`}
                      >
                        <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate text-foreground">
                            {conv.title}
                          </p>
                          <p className="text-[9px] text-muted-foreground mt-0.5">
                            {conv.messages.length} msgs •{" "}
                            {getRelativeTime(conv.updatedAt)}
                          </p>
                        </div>
                        {/* Delete */}
                        {conversations.length > 1 && (
                          <button
                            onClick={(e) => handleDeleteConv(e, conv.id)}
                            className="opacity-0 group-hover:opacity-100 absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-red-400 hover:text-red-600 transition-all"
                            aria-label="Delete conversation"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </button>
                    ))}
                </div>

                {/* Rate Limit Info */}
                <div className="p-2 border-t border-border text-center">
                  <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
                    {currentRateInfo.remaining}/{RATE_LIMIT_MAX} msgs left
                  </span>
                </div>
              </div>
            </div>

            {/* ─── Messages Area ─── */}
            <div className="absolute inset-0 p-4 overflow-y-auto bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-zinc-50 dark:bg-zinc-950 flex flex-col gap-4 custom-scrollbar">
              {/* Empty State + Chips */}
              {messages.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-80 animate-in fade-in zoom-in duration-500">
                  <div
                    className={`w-14 h-14 flex items-center justify-center border-[2.5px] border-black dark:border-white ${theme.emptyIconBg} shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_#fff]`}
                  >
                    <Bot className="w-7 h-7 text-white" />
                  </div>
                  <div className="max-w-[90%] space-y-3">
                    <p className="font-bold font-sora tracking-wide text-foreground uppercase text-sm">
                      How can I help?
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {quickActions[userRole].map((chip) => (
                        <button
                          key={chip}
                          onClick={() => sendMessage(chip)}
                          className={`px-3 py-1.5 text-[10px] font-bold border-[2px] ${theme.chipBg} transition-all active:scale-95 text-foreground`}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Message List */}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex flex-col gap-0.5 max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                      {msg.role === "user" ? "You" : DALIL_DISPLAY_NAME}
                    </span>
                    <div
                      className={`px-3.5 py-2.5 text-sm font-bold border-[2.5px] border-black dark:border-white leading-relaxed shadow-[3px_3px_0_0_#111] ${
                        msg.error
                          ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-400 dark:border-red-600"
                          : msg.role === "user"
                            ? theme.userBubbleBg
                            : theme.botBubbleBg
                      }`}
                    >
                      <span className="whitespace-pre-wrap">{msg.content}</span>
                      {isStreaming &&
                        msg.role === "assistant" &&
                        i === messages.length - 1 && (
                          <span className="inline-block w-[2px] h-[1em] bg-current ml-0.5 align-middle animate-[cursor-blink_0.8s_steps(2)_infinite]" />
                        )}
                    </div>

                    {/* Timestamp + Retry */}
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-[9px] text-muted-foreground">
                        {getRelativeTime(msg.timestamp)}
                      </span>
                      {msg.error && (
                        <button
                          onClick={handleRetry}
                          className="flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Retry
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading (pre-stream) */}
              {loading && !isStreaming && (
                <div className="flex justify-start">
                  <div className="flex flex-col gap-0.5 max-w-[85%] items-start">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                      {DALIL_DISPLAY_NAME}
                    </span>
                    <div
                      className={`px-3.5 py-2.5 border-[2.5px] border-black dark:border-white ${theme.botBubbleBg} shadow-[3px_3px_0_0_#111] flex items-center gap-2`}
                    >
                      <Loader2
                        className={`w-4 h-4 animate-spin ${theme.accent}`}
                      />
                      <span className="text-xs font-bold opacity-80 animate-pulse uppercase">
                        Thinking...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Rate Limit Error */}
              {rateLimitError && (
                <div className="mx-auto px-3 py-2 bg-amber-50 dark:bg-amber-950/30 border-[2px] border-amber-400 dark:border-amber-600 text-amber-700 dark:text-amber-300 text-[11px] font-bold text-center">
                  ⚠️ {rateLimitError}
                </div>
              )}

              {/* Cursor blink animation */}
              <style>{`
                @keyframes cursor-blink {
                  0%, 100% { opacity: 1; }
                  50% { opacity: 0; }
                }
              `}</style>
              <div ref={messagesEndRef} className="shrink-0 h-1" />
            </div>
          </div>

          {/* ─── Input Area ─── */}
          <div className="p-3 bg-card border-t-[2.5px] border-black dark:border-white flex gap-2 shrink-0 relative z-10">
            <input
              className="flex-1 p-2.5 text-sm font-bold border-[2.5px] border-black dark:border-white bg-background text-foreground shadow-[2px_2px_0_0_#111] focus:outline-none focus:ring-0 focus:-translate-y-0.5 focus:-translate-x-0.5 focus:shadow-[3px_3px_0_0_#111] transition-all placeholder:text-muted-foreground placeholder:text-xs placeholder:uppercase"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter command..."
              disabled={loading}
              maxLength={500}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="bg-black text-white dark:bg-white dark:text-black border-[2.5px] border-black dark:border-white w-11 h-11 flex items-center justify-center shadow-[2px_2px_0_0_#111] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[3px_3px_0_0_#111] active:translate-y-0 active:translate-x-0 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 group"
              aria-label="Send Message"
            >
              <Send className="w-4 h-4 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Toggle Button ─── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`group w-16 h-16 ${theme.toggleBtnBg} text-white border-[2.5px] border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] flex items-center justify-center hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_0_#000] dark:hover:shadow-[6px_6px_0_0_#fff] active:translate-y-0 active:translate-x-0 active:shadow-none transition-all relative overflow-hidden`}
          aria-label="Open AI Assistant"
        >
          <div
            className={`absolute inset-0 ${theme.toggleBtnHoverBg} opacity-0 translate-y-full group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-in-out`}
          />
          <Bot
            className="w-8 h-8 relative z-10 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300"
            strokeWidth={2.5}
          />
          <span className="absolute top-2 right-2 flex h-3 w-3 z-20">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white border border-black" />
          </span>
        </button>
      )}
    </div>
  );
}
