import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { v } from "convex/values";
import { Presence } from "@convex-dev/presence";

const presence = new Presence(components.presence);

export const heartbeat = mutation({
  args: {
    roomId: v.string(),
    userId: v.string(),
    sessionId: v.string(),
    interval: v.number(),
  },
  handler: async (ctx, { roomId, userId, sessionId, interval }) => {
    return await presence.heartbeat(ctx, roomId, userId, sessionId, interval);
  },
});

export const list = query({
  args: { roomToken: v.string() },
  handler: async (ctx, { roomToken }) => {
    return await presence.list(ctx, roomToken);
  },
});

export const disconnect = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    return await presence.disconnect(ctx, sessionToken);
  },
});

export const listRoom = query({
  args: { roomId: v.string() },
  handler: async (ctx, { roomId }) => {
    return await presence.listRoom(ctx, roomId, true); // true = onlineOnly
  },
});

export const listTypingInConversations = query({
  args: { conversationIds: v.array(v.string()) },
  handler: async (ctx, { conversationIds }) => {
    const typingMap: Record<string, string[]> = {};
    for (const convId of conversationIds) {
      const roomUsers = await presence.listRoom(ctx, `typing:${convId}`, true, 10);
      typingMap[convId] = roomUsers.map(u => u.userId as string);
    }
    return typingMap;
  }
});
