"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Search,
  Send,
  MessageSquare,
  Plus,
  ArrowLeft,
  Loader2,
} from "lucide-react";

function formatTime(timestamp: number) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "long" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatMessageTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Messages({ role }: { role: "student" | "employer" }) {
  const conversations = useQuery(api.messages.getConversations);
  const messagableUsers = useQuery(api.messages.getMessagableUsers);
  const getOrCreateConversation = useMutation(
    api.messages.getOrCreateConversation,
  );
  const sendMessageMutation = useMutation(api.messages.sendMessage);

  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);



  const activeMessages = useQuery(
    api.messages.getMessages,
    activeConvId
      ? { conversationId: activeConvId as Id<"conversations"> }
      : "skip",
  );

  // Scroll to bottom on new messages (within the chat container only)
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [activeMessages]);

  const activeConv = conversations?.find((c) => c._id === activeConvId);

  const filteredConversations = conversations?.filter(
    (c) =>
      c.otherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessageText.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredNewChatUsers = messagableUsers?.filter((u) => {
    const alreadyHasConvo = conversations?.some(
      (c) => c.otherUserId === u._id,
    );
    if (alreadyHasConvo) return false;
    if (!newChatSearch) return true;
    const name = u.name.toLowerCase();
    const sub = ("companyName" in u ? u.companyName : "title" in u ? u.title : "").toLowerCase();
    return (
      name.includes(newChatSearch.toLowerCase()) ||
      sub.includes(newChatSearch.toLowerCase())
    );
  });

  const handleStartConversation = async (otherUserId: string) => {
    try {
      const convId = await getOrCreateConversation({
        otherUserId: otherUserId as Id<"users">,
      });
      setActiveConvId(convId as string);
      setShowNewChat(false);
      setNewChatSearch("");
      setMobileShowChat(true);
    } catch (err: any) {
      console.error("Failed to start conversation:", err);
    }
  };

  const handleSend = async () => {
    if (!messageInput.trim() || !activeConvId || sending) return;
    const text = messageInput.trim();
    setMessageInput("");
    setSending(true);
    try {
      await sendMessageMutation({
        conversationId: activeConvId as Id<"conversations">,
        text,
      });
    } catch (err) {
      console.error("Failed to send:", err);
      setMessageInput(text);
    } finally {
      setSending(false);
    }
  };

  const initials = (name: string) =>
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  // Loading state
  if (conversations === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="bg-card border-4 border-border shadow-[4px_4px_0_0_var(--border)] p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="font-black uppercase tracking-widest text-sm text-muted-foreground">
            Loading messages...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-card border-4 border-border shadow-[4px_4px_0_0_var(--border)] h-[calc(100vh-14rem)] min-h-[500px] overflow-hidden">
      {/* ─── LEFT PANE: Conversation List ─── */}
      <div
        className={`w-full md:w-80 flex-shrink-0 border-r-4 border-border flex flex-col h-full ${mobileShowChat ? "hidden md:flex" : "flex"}`}
      >
        {/* Header */}
        <div className="p-4 border-b-4 border-border">
          <h3 className="font-black text-lg uppercase tracking-widest mb-3">
            Messages
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-background border-2 border-border shadow-[3px_3px_0_0_var(--border)] font-bold text-sm focus:outline-none focus:shadow-[3px_3px_0_0_hsl(263,70%,50%)] dark:focus:shadow-[3px_3px_0_0_hsl(290,70%,70%)] transition-all"
            />
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-3 border-b-4 border-border">
          <button
            type="button"
            onClick={() => setShowNewChat(!showNewChat)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#2563EB] text-white border-4 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] font-black uppercase tracking-widest text-xs hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all active:translate-x-[4px] active:translate-y-[4px]"
          >
            <Plus className="size-4" />
            New Chat
          </button>
        </div>

        {/* New Chat User Picker */}
        {showNewChat && (
          <div className="border-b-4 border-border bg-muted/30 p-3 space-y-2">
            <input
              type="text"
              placeholder={
                role === "student"
                  ? "Search employers..."
                  : "Search students..."
              }
              value={newChatSearch}
              onChange={(e) => setNewChatSearch(e.target.value)}
              className="w-full p-2.5 bg-background border-2 border-border shadow-[3px_3px_0_0_var(--border)] font-bold text-sm focus:outline-none focus:shadow-[3px_3px_0_0_hsl(263,70%,50%)] dark:focus:shadow-[3px_3px_0_0_hsl(290,70%,70%)] transition-all"
            />
            <div className="max-h-40 overflow-y-auto space-y-1">
              {filteredNewChatUsers?.length === 0 && (
                <p className="text-xs text-muted-foreground font-bold p-2 text-center uppercase tracking-wider">
                  {role === "student"
                    ? "No employers available. Accept tasks first!"
                    : "No students found."}
                </p>
              )}
              {filteredNewChatUsers?.map((u) => (
                <button
                  key={u._id}
                  type="button"
                  onClick={() => handleStartConversation(u._id)}
                  className="w-full flex items-center gap-3 p-2 text-left hover:bg-muted border-2 border-transparent hover:border-black dark:hover:border-white transition-all"
                >
                  <div className="size-8 bg-[#2563EB] text-white border-2 border-border shadow-[2px_2px_0_0_var(--border)] flex items-center justify-center font-black text-xs flex-shrink-0">
                    {initials(u.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-sm truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground font-bold truncate">
                      {"companyName" in u
                        ? u.companyName
                        : "title" in u
                          ? u.title
                          : ""}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations?.length === 0 ? (
            <div className="p-6 text-center">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                No conversations yet
              </p>
              <p className="text-xs text-muted-foreground mt-1 font-bold">
                Click &quot;New Chat&quot; to start
              </p>
            </div>
          ) : (
            filteredConversations?.map((conv) => (
              <button
                key={conv._id}
                onClick={() => {
                  setActiveConvId(conv._id);
                  setMobileShowChat(true);
                }}
                type="button"
                className={`w-full p-4 flex gap-3 text-left transition-all border-b-2 border-border/50 last:border-0 ${
                  activeConvId === conv._id
                    ? "bg-[#2563EB]/10 border-l-4 border-l-[#2563EB]"
                    : "border-l-4 border-l-transparent hover:bg-muted/50"
                }`}
              >
                <div className="size-10 bg-muted border-2 border-border shadow-[2px_2px_0_0_var(--border)] flex items-center justify-center font-black text-sm flex-shrink-0">
                  {initials(conv.otherName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <p className="font-black text-sm truncate">
                      {conv.otherName}
                    </p>
                    {conv.lastMessageAt > 0 && (
                      <span className="text-[10px] font-bold text-muted-foreground ml-2 flex-shrink-0 uppercase tracking-wider">
                        {formatTime(conv.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  {conv.subtitle && (
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                      {conv.subtitle}
                    </p>
                  )}
                  {conv.lastMessageText && (
                    <p className="text-xs text-muted-foreground truncate font-medium">
                      {conv.lastMessageText}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ─── RIGHT PANE: Chat View ─── */}
      {activeConvId && activeConv ? (
        <div
          className={`flex-1 flex flex-col h-full min-w-0 ${!mobileShowChat ? "hidden md:flex" : "flex"}`}
        >
          {/* Chat Header */}
          <div className="h-16 flex items-center justify-between px-4 md:px-6 border-b-4 border-border bg-card">
            <div className="flex items-center gap-3">
              {/* Mobile back button */}
              <button
                type="button"
                onClick={() => setMobileShowChat(false)}
                className="md:hidden size-8 flex items-center justify-center border-2 border-border shadow-[2px_2px_0_0_var(--border)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
              >
                <ArrowLeft className="size-4" />
              </button>
              <div className="size-10 bg-muted border-2 border-border shadow-[2px_2px_0_0_var(--border)] flex items-center justify-center font-black text-sm">
                {initials(activeConv.otherName)}
              </div>
              <div>
                <h4 className="font-black text-sm uppercase tracking-wider">
                  {activeConv.otherName}
                </h4>
                {activeConv.subtitle && (
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                    {activeConv.subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {activeMessages === undefined ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : activeMessages.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-block bg-muted border-2 border-border shadow-[2px_2px_0_0_var(--border)] px-4 py-2">
                  <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">
                    Start of conversation
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-muted text-muted-foreground px-3 py-1 border-2 border-border shadow-[2px_2px_0_0_var(--border)] inline-block">
                    Start of conversation
                  </span>
                </div>
                {activeMessages.map((msg, i) => {
                  const showTime =
                    i === 0 ||
                    activeMessages[i - 1].isMe !== msg.isMe;

                  return (
                    <div
                      key={msg._id}
                      className={`flex gap-2 max-w-[80%] ${msg.isMe ? "ml-auto flex-row-reverse" : ""}`}
                    >
                      {/* Avatar */}
                      {!msg.isMe && showTime && (
                        <div className="size-7 bg-muted border-2 border-border shadow-[2px_2px_0_0_var(--border)] flex items-center justify-center font-black text-[10px] flex-shrink-0 mt-1">
                          {initials(activeConv.otherName)}
                        </div>
                      )}
                      {!msg.isMe && !showTime && (
                        <div className="w-7 flex-shrink-0" />
                      )}

                      <div
                        className={`flex flex-col ${msg.isMe ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`px-4 py-2.5 text-sm font-bold ${
                            msg.isMe
                              ? "bg-[#2563EB] text-white border-2 border-black dark:border-white shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_#fff]"
                              : "bg-muted text-foreground border-2 border-border shadow-[3px_3px_0_0_var(--border)]"
                          }`}
                        >
                          {msg.text}
                        </div>
                        {showTime && (
                          <span className="text-[10px] text-muted-foreground mt-1 mx-1 font-bold uppercase tracking-wider">
                            {formatMessageTime(msg.sentAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 md:p-4 border-t-4 border-border bg-card">
            <div className="flex items-end gap-2">
              <textarea
                className="flex-1 bg-background border-2 border-border shadow-[3px_3px_0_0_var(--border)] p-3 min-h-[44px] max-h-32 resize-none focus:outline-none focus:shadow-[3px_3px_0_0_hsl(263,70%,50%)] dark:focus:shadow-[3px_3px_0_0_hsl(290,70%,70%)] transition-all text-sm font-bold placeholder:font-bold placeholder:text-muted-foreground"
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!messageInput.trim() || sending}
                className={`p-3 flex items-center justify-center transition-all ${
                  messageInput.trim() && !sending
                    ? "bg-[#2563EB] text-white border-4 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
                    : "bg-muted text-muted-foreground border-4 border-border shadow-[4px_4px_0_0_var(--border)] cursor-not-allowed"
                }`}
              >
                <Send className="size-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`flex-1 flex flex-col items-center justify-center h-full text-muted-foreground ${!mobileShowChat ? "hidden md:flex" : "hidden"}`}
        >
          <div className="bg-card border-4 border-border shadow-[4px_4px_0_0_var(--border)] p-10 text-center">
            <MessageSquare className="size-12 mx-auto mb-4 opacity-20" />
            <p className="font-black uppercase tracking-widest text-sm">
              Select a conversation
            </p>
            <p className="text-xs mt-1 font-bold">
              Or start a new chat
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
