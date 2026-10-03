import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { db, Message } from "../db.js";

/**
 * Get all messaging threads for the active user
 */
export async function getThreads(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const messages = db.getMessages();
    const threadsMap = new Map<string, { lastMessage: Message; partnerId: string; partnerName: string }>();

    messages.forEach((msg) => {
      if (msg.senderId !== userId && msg.receiverId !== userId) return;

      const isSender = msg.senderId === userId;
      const partnerId = isSender ? msg.receiverId : msg.senderId;
      const partnerName = isSender ? (msg.receiverName || "User") : (msg.senderName || "User");

      const existingThread = threadsMap.get(partnerId);
      if (!existingThread || new Date(msg.createdAt) > new Date(existingThread.lastMessage.createdAt)) {
        threadsMap.set(partnerId, {
          lastMessage: msg,
          partnerId,
          partnerName
        });
      }
    });

    const threads = Array.from(threadsMap.values());
    return res.json({ threads });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load chat history threads" });
  }
}

/**
 * Get direct messages between active user and specific partner
 */
export async function getDirectMessages(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { partnerId } = req.params;

    const messages = db.getMessages().filter(
      (m) =>
        (m.senderId === userId && m.receiverId === partnerId) ||
        (m.senderId === partnerId && m.receiverId === userId)
    );

    // Sort chronologically
    messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // Mark notifications/messages as read
    db.markMessagesAsRead(userId, partnerId);

    return res.json({ messages });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch thread messages" });
  }
}

/**
 * Post single private chat message
 */
export async function sendMessage(req: AuthenticatedRequest, res: Response) {
  try {
    const { receiverId, content, listingId } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ message: "Receiver ID and message content are required" });
    }

    const users = db.getUsers();
    const receiver = users.find((u) => u.id === receiverId);

    if (!receiver) {
      return res.status(404).json({ message: "Receiver account not found" });
    }

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      senderId: req.user!.id,
      senderName: req.user!.name,
      senderRole: req.user!.role,
      receiverId,
      receiverName: receiver.name,
      content,
      listingId,
      createdAt: new Date().toISOString(),
      read: false
    };

    db.addMessage(newMsg);

    // Create lightweight push notification
    db.addNotification({
      id: `notif-${Date.now()}`,
      userId: receiverId,
      title: "New Message Received",
      message: `${req.user!.name} sent you a message: "${content.substring(0, 45)}${content.length > 45 ? "..." : ""}"`,
      url: `/messages`,
      read: false,
      createdAt: new Date().toISOString()
    });

    return res.status(201).json({ message: "Message sent", messageData: newMsg });
  } catch (error) {
    return res.status(500).json({ message: "Failed to upload chat message" });
  }
}
