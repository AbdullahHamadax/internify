import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { components } from "./_generated/api";
import { Presence } from "@convex-dev/presence";

const presence = new Presence(components.presence);

/**
 * Get users the current user can message.
 * - Students: only employers whose tasks they have accepted
 * - Employers: any student
 */
export const getMessagableUsers = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) return [];

    if (user.role === "student") {
      // Get all tasks the student has accepted
      const applications = await ctx.db
        .query("applications")
        .withIndex("by_studentId", (q) => q.eq("studentId", user._id))
        .collect();

      // Collect unique employer IDs from those tasks
      const employerIds = new Set<string>();
      for (const app of applications) {
        const task = await ctx.db.get(app.taskId);
        if (task) {
          employerIds.add(task.employerId as string);
        }
      }

      // Fetch employer users + profiles
      const employers = await Promise.all(
        [...employerIds].map(async (eid) => {
          const empUser = await ctx.db.get(eid as Id<"users">);
          if (!empUser) return null;
          const profile = await ctx.db
            .query("employerProfiles")
            .withIndex("by_userId", (q) => q.eq("userId", empUser._id))
            .unique();
          return {
            _id: empUser._id,
            name:
              [empUser.firstName, empUser.lastName].filter(Boolean).join(" ") ||
              "Employer",
            companyName: profile?.companyName ?? "",
            role: empUser.role as string,
          };
        }),
      );
      return employers.filter((e) => e !== null);
    }

    // Employer: return all students
    const students = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "student"))
      .collect();

    const results = await Promise.all(
      students.map(async (s) => {
        const profile = await ctx.db
          .query("studentProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", s._id))
          .unique();
        return {
          _id: s._id,
          name:
            [s.firstName, s.lastName].filter(Boolean).join(" ") || "Student",
          title: profile?.title ?? "",
          role: s.role,
        };
      }),
    );
    return results;
  },
});

/**
 * Get all conversations for the current user with participant info.
 */
export const getConversations = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) return [];

    // Conversations where user is participantOne (employer side)
    const asOne = await ctx.db
      .query("conversations")
      .withIndex("by_participantOne", (q) =>
        q.eq("participantOne", user._id),
      )
      .collect();

    // Conversations where user is participantTwo (student side)
    const asTwo = await ctx.db
      .query("conversations")
      .withIndex("by_participantTwo", (q) =>
        q.eq("participantTwo", user._id),
      )
      .collect();

    const all = [...asOne, ...asTwo];

    // Sort by lastMessageAt descending
    all.sort((a, b) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0));

    // Enrich with the OTHER participant's info
    const enriched = await Promise.all(
      all.map(async (conv) => {
        const isParticipantOne = conv.participantOne === user._id;
        const otherId = isParticipantOne
          ? conv.participantTwo
          : conv.participantOne;
        const otherUser = await ctx.db.get(otherId as Id<"users">);

        let otherName = "User";
        let subtitle = "";

        if (otherUser) {
          otherName =
            [otherUser.firstName, otherUser.lastName]
              .filter(Boolean)
              .join(" ") || "User";

          if (otherUser.role === "employer") {
            const profile = await ctx.db
              .query("employerProfiles")
              .withIndex("by_userId", (q) => q.eq("userId", otherUser._id))
              .unique();
            subtitle = profile?.companyName ?? "";
          } else {
            const profile = await ctx.db
              .query("studentProfiles")
              .withIndex("by_userId", (q) => q.eq("userId", otherUser._id))
              .unique();
            subtitle = profile?.title ?? "";
          }
        }

        // Determine unread status
        const myLastRead = isParticipantOne
          ? conv.lastReadByParticipantOne ?? 0
          : conv.lastReadByParticipantTwo ?? 0;
        const hasUnread =
          (conv.lastMessageAt ?? 0) > myLastRead &&
          conv.lastMessageSenderId !== user._id;

        return {
          _id: conv._id,
          otherUserId: otherId,
          otherName,
          subtitle,
          lastMessageText: conv.lastMessageText ?? "",
          lastMessageAt: conv.lastMessageAt ?? 0,
          hasUnread,
        };
      }),
    );

    return enriched;
  },
});

/**
 * Get all messages for a conversation.
 */
export const getMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) return [];

    // Verify user is a participant
    const conv = await ctx.db.get(args.conversationId);
    if (!conv) return [];
    if (conv.participantOne !== user._id && conv.participantTwo !== user._id) {
      return [];
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();

    // Sort ascending by sentAt
    messages.sort((a, b) => a.sentAt - b.sentAt);

    return messages.map((m) => ({
      _id: m._id,
      senderId: m.senderId,
      text: m.text,
      sentAt: m.sentAt,
      isMe: m.senderId === user._id,
    }));
  },
});

/**
 * Get or create a conversation between the current user and another.
 * Enforces that students can only message employers whose tasks they've accepted.
 */
export const getOrCreateConversation = mutation({
  args: { otherUserId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) throw new Error("User not found");

    const otherUser = await ctx.db.get(args.otherUserId);
    if (!otherUser) throw new Error("Other user not found");

    // Determine employer/student roles for participant ordering
    let employerId: typeof user._id;
    let studentId: typeof user._id;

    if (user.role === "employer" && otherUser.role === "student") {
      employerId = user._id;
      studentId = otherUser._id;
    } else if (user.role === "student" && otherUser.role === "employer") {
      employerId = otherUser._id;
      studentId = user._id;

      // Enforce: student can only message employers whose tasks they accepted
      const applications = await ctx.db
        .query("applications")
        .withIndex("by_studentId", (q) => q.eq("studentId", user._id))
        .collect();

      const taskEmployerIds = new Set<string>();
      for (const app of applications) {
        const task = await ctx.db.get(app.taskId);
        if (task) taskEmployerIds.add(task.employerId as string);
      }

      if (!taskEmployerIds.has(otherUser._id as string)) {
        throw new Error(
          "You can only message employers whose tasks you have accepted.",
        );
      }
    } else {
      throw new Error("Messages are between employers and students only.");
    }

    // Check for existing conversation
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_participantOne", (q) =>
        q.eq("participantOne", employerId),
      )
      .collect();

    const found = existing.find((c) => c.participantTwo === studentId);
    if (found) return found._id;

    // Create new conversation
    const convId = await ctx.db.insert("conversations", {
      participantOne: employerId,
      participantTwo: studentId,
    });

    return convId;
  },
});

/**
 * Send a message in a conversation.
 */
export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) throw new Error("User not found");

    const conv = await ctx.db.get(args.conversationId);
    if (!conv) throw new Error("Conversation not found");

    // Verify user is a participant
    if (conv.participantOne !== user._id && conv.participantTwo !== user._id) {
      throw new Error("Not a participant in this conversation");
    }

    const now = Date.now();

    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: user._id,
      text: args.text,
      sentAt: now,
    });

    // Update conversation preview + sender tracking
    await ctx.db.patch(args.conversationId, {
      lastMessageText: args.text,
      lastMessageAt: now,
      lastMessageSenderId: user._id,
    });

    // Create notification for the recipient only if they do not have
    // this conversation open right now.
    const recipientId =
      conv.participantOne === user._id
        ? conv.participantTwo
        : conv.participantOne;
    const senderName =
      [user.firstName, user.lastName].filter(Boolean).join(" ") || "Someone";

    const openChatUsers = await presence.listRoom(
      ctx,
      `chat-open:${args.conversationId}`,
      true,
      20,
    );
    const isRecipientViewingChat = openChatUsers.some(
      (u) => u.userId === (recipientId as string),
    );

    if (!isRecipientViewingChat) {
      await ctx.db.insert("notifications", {
        userId: recipientId,
        type: "new_message" as const,
        title: "New Message",
        message: `${senderName} sent you a message: "${args.text.length > 60 ? args.text.slice(0, 60) + "…" : args.text}"`,
        relatedUserId: user._id,
        relatedUserName: senderName,
        isRead: false,
        createdAt: now,
      });
    }
  },
});

/**
 * Mark a conversation as read by the current user.
 */
export const markConversationRead = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) throw new Error("User not found");

    const conv = await ctx.db.get(args.conversationId);
    if (!conv) throw new Error("Conversation not found");

    const now = Date.now();

    if (conv.participantOne === user._id) {
      await ctx.db.patch(args.conversationId, {
        lastReadByParticipantOne: now,
      });
    } else if (conv.participantTwo === user._id) {
      await ctx.db.patch(args.conversationId, {
        lastReadByParticipantTwo: now,
      });
    }
  },
});
