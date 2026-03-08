"use client";

import { useState } from "react";
import {
  Search,
  MoreVertical,
  Phone,
  Video,
  Info,
  Send,
  Smile,
  MessageSquare,
} from "lucide-react";
import { Typography } from "@/components/ui/Typography";

const DUMMY_CHATS = [
  {
    id: "1",
    name: "Alex Johnson",
    avatar: "AJ",
    lastMessage: "Sounds great! I can start next Monday if that works.",
    timestamp: "10:42 AM",
    unread: 2,
    online: true,
    role: "Full Stack Developer",
    messages: [
      {
        id: "m1",
        senderId: "user",
        text: "Hi Alex, we reviewed your profile and would love to interview you for the Full Stack role.",
        timestamp: "Yesterday 2:00 PM",
      },
      {
        id: "m2",
        senderId: "1",
        text: "Hello! That's wonderful news. I'm available anytime this week for a call.",
        timestamp: "Yesterday 3:15 PM",
      },
      {
        id: "m3",
        senderId: "user",
        text: "How about Thursday at 10 AM PST?",
        timestamp: "Yesterday 4:00 PM",
      },
      {
        id: "m4",
        senderId: "1",
        text: "Thursday at 10 AM works perfectly.",
        timestamp: "09:30 AM",
      },
      {
        id: "m5",
        senderId: "user",
        text: "I'll send over the meeting invite shortly. Let me know if you have any questions before then.",
        timestamp: "10:00 AM",
      },
      {
        id: "m6",
        senderId: "1",
        text: "Will do. Thanks!",
        timestamp: "10:40 AM",
      },
      {
        id: "m7",
        senderId: "1",
        text: "Sounds great! I can start next Monday if that works.",
        timestamp: "10:42 AM",
      },
    ],
  },
  {
    id: "2",
    name: "Sarah Chen",
    avatar: "SC",
    lastMessage: "I've attached my portfolio as requested.",
    timestamp: "Yesterday",
    unread: 0,
    online: false,
    role: "Product Designer",
    messages: [
      {
        id: "m1",
        senderId: "user",
        text: "Hi Sarah, can you share some recent examples of your UI work?",
        timestamp: "Monday 11:00 AM",
      },
      {
        id: "m2",
        senderId: "2",
        text: "Absolutely! I'm putting together a few links now.",
        timestamp: "Monday 1:20 PM",
      },
      {
        id: "m3",
        senderId: "2",
        text: "I've attached my portfolio as requested.",
        timestamp: "Yesterday 4:45 PM",
      },
    ],
  },
  {
    id: "3",
    name: "David Kim",
    avatar: "DK",
    lastMessage: "Thanks for the feedback! I'll update the PR.",
    timestamp: "Tuesday",
    unread: 1,
    online: true,
    role: "Backend Engineer",
    messages: [
      {
        id: "m1",
        senderId: "3",
        text: "I submitted the backend task you assigned.",
        timestamp: "Monday 9:00 AM",
      },
      {
        id: "m2",
        senderId: "user",
        text: "Got it. Taking a look now.",
        timestamp: "Monday 10:15 AM",
      },
      {
        id: "m3",
        senderId: "user",
        text: "Looks solid overall, but can you add some tests for the auth middleware?",
        timestamp: "Tuesday 2:00 PM",
      },
      {
        id: "m4",
        senderId: "3",
        text: "Thanks for the feedback! I'll update the PR.",
        timestamp: "Tuesday 3:30 PM",
      },
    ],
  },
];

export default function Messages() {
  const [activeChatId, setActiveChatId] = useState<string>(DUMMY_CHATS[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");

  const activeChat = DUMMY_CHATS.find((c) => c.id === activeChatId);

  const filteredChats = DUMMY_CHATS.filter(
    (chat) =>
      chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex bg-card border border-border rounded-xl shadow-sm h-[calc(100vh-14rem)] min-h-[500px] overflow-hidden animate-in fade-in duration-500">
      {/* Left Pane: Inbox List */}
      <div className="w-full md:w-80 flex-shrink-0 border-r border-border flex flex-col bg-muted/10 h-full">
        {/* Header & Search */}
        <div className="p-4 border-b border-border">
          <Typography
            variant="h3"
            className="text-lg font-semibold mb-4 m-0 border-none pb-0"
          >
            Messages
          </Typography>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.length === 0 ? (
            <Typography
              variant="caption"
              color="muted"
              className="p-6 text-center block"
            >
              No conversations found.
            </Typography>
          ) : (
            filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={`w-full p-4 flex gap-3 text-left transition-colors border-b border-border/50 last:border-0 hover:bg-muted/50 ${activeChatId === chat.id ? "bg-primary/5 hover:bg-primary/10 border-l-2 border-l-primary" : "border-l-2 border-l-transparent"}`}
                type="button"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div
                    className={`size-10 rounded-full flex items-center justify-center font-medium text-sm ${activeChatId === chat.id ? "bg-primary/20 text-primary" : "bg-secondary text-secondary-foreground"}`}
                  >
                    {chat.avatar}
                  </div>
                  {chat.online && (
                    <span className="absolute bottom-0 right-0 size-2.5 bg-green-500 border-2 border-card rounded-full" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <Typography
                      variant="p"
                      className="font-medium text-sm text-foreground truncate m-0"
                    >
                      {chat.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="muted"
                      className="flex-shrink-0 ml-2 m-0"
                    >
                      {chat.timestamp}
                    </Typography>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <Typography
                      variant="p"
                      className={`text-xs truncate m-0 ${chat.unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}
                    >
                      {chat.lastMessage}
                    </Typography>
                    {chat.unread > 0 && (
                      <span className="inline-flex items-center justify-center size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex-shrink-0">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Pane: Chat Canvas */}
      {activeChat ? (
        <div className="flex-1 flex flex-col h-full bg-background min-w-0">
          {/* Chat Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-border bg-card/50">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium">
                {activeChat.avatar}
              </div>
              <div>
                <Typography
                  variant="h4"
                  className="text-base font-semibold m-0 border-none pb-0"
                >
                  {activeChat.name}
                </Typography>
                <Typography
                  variant="p"
                  className="text-xs text-muted-foreground m-0"
                >
                  {activeChat.role}
                </Typography>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="text-center my-4">
              <span className="text-xs font-medium bg-muted/50 text-muted-foreground px-3 py-1 rounded-full">
                This corresponds to the start of your conversation
              </span>
            </div>

            {activeChat.messages.map((msg, i) => {
              const isMe = msg.senderId === "user";
              // Check if previous message was from the same sender to group them
              const showAvatar =
                i === 0 || activeChat.messages[i - 1].senderId !== msg.senderId;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-[80%] ${isMe ? "ml-auto flex-row-reverse" : ""}`}
                >
                  {/* Message Avatar (Only show if not 'Me' and is the first in a cluster) */}
                  {!isMe && (
                    <div className="flex-shrink-0 w-8">
                      {showAvatar && (
                        <div className="size-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-xs font-medium">
                          {activeChat.avatar}
                        </div>
                      )}
                    </div>
                  )}

                  <div
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm ${
                        isMe
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-muted text-foreground rounded-tl-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                    {showAvatar && (
                      <span className="text-[10px] text-muted-foreground mt-1 mx-1">
                        {msg.timestamp}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-card/50 border-t border-border">
            <div className="flex items-end gap-2 bg-background border border-border rounded-xl p-2 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all shadow-sm">
              <textarea
                className="flex-1 bg-transparent border-0 resize-none max-h-32 min-h-[44px] py-3 focus:outline-none text-sm text-foreground placeholder-muted-foreground"
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (messageInput.trim()) {
                      setMessageInput("");
                      // In a real app, send message here
                    }
                  }
                }}
              />

              <button
                type="button"
                className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg"
              >
                <Smile className="size-5" />
              </button>
              <button
                type="button"
                className={`p-2 rounded-lg transition-colors flex items-center justify-center size-10 ${messageInput.trim() ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
                disabled={!messageInput.trim()}
              >
                <Send className="size-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center h-full text-muted-foreground">
          <MessageSquare className="size-12 mb-4 opacity-20" />
          <Typography variant="p" className="text-center font-medium">
            Select a conversation
          </Typography>
        </div>
      )}
    </div>
  );
}
