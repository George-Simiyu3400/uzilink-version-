import React, { useState, useEffect, useRef } from "react";
import { api } from "../lib/api.js";
import { ChatThread, DirectMessage, UserProfile } from "../types.js";
import { MessageSquare, Send, Calendar, RefreshCw, UserCheck } from "lucide-react";
import { motion } from "motion/react";

interface InboxViewProps {
  user: UserProfile;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
  partnerIdPreset: string | null;
  partnerNamePreset: string | null;
  listingIdPreset?: string | null;
  onClearPreset: () => void;
}

export const InboxView: React.FC<InboxViewProps> = ({ 
  user, 
  showToast, 
  partnerIdPreset, 
  partnerNamePreset, 
  listingIdPreset,
  onClearPreset
}) => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(partnerIdPreset);
  const [selectedPartnerName, setSelectedPartnerName] = useState<string | null>(partnerNamePreset);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadThreads = async () => {
    setLoading(true);
    try {
      const response = await api.getThreads();
      setThreads(response.threads);
      
      if (partnerIdPreset) {
        setSelectedPartnerId(partnerIdPreset);
        setSelectedPartnerName(partnerNamePreset);
        const detailRes = await api.getThread(partnerIdPreset);
        setMessages(detailRes.messages);
      } else if (response.threads && response.threads.length > 0 && !selectedPartnerId) {
        setSelectedPartnerId(response.threads[0].partnerId);
        setSelectedPartnerName(response.threads[0].partnerName);
        const detailRes = await api.getThread(response.threads[0].partnerId);
        setMessages(detailRes.messages);
      }
    } catch (e) {
      showToast("Could not load direct message threads.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, [partnerIdPreset]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadActiveThread = async (pId: string, pName: string) => {
    setSelectedPartnerId(pId);
    setSelectedPartnerName(pName);
    onClearPreset();

    try {
      const detailRes = await api.getThread(pId);
      setMessages(detailRes.messages);
    } catch (e) {
      showToast("Unable to load chat messages.", "error");
    }
  };

  const handleSendMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim() || !selectedPartnerId) return;
    setSending(true);

    try {
      const payload: any = {
        receiverId: selectedPartnerId,
        content: currentMessage.trim()
      };
      if (listingIdPreset) {
        payload.listingId = listingIdPreset;
      }

      await api.sendMessage(payload);
      
      const detailRes = await api.getThread(selectedPartnerId);
      setMessages(detailRes.messages);
      setCurrentMessage("");
      
      const rThreads = await api.getThreads();
      setThreads(rThreads.threads);
    } catch (err: any) {
      showToast(err.message || "Failed to dispatch message", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white border border-stone-200 rounded-3xl h-[620px] flex overflow-hidden shadow-sm relative" id="inbox-panel">
      {/* Left rail: threads */}
      <div className="w-[280px] border-r border-stone-200 flex flex-col justify-between bg-stone-50/50" id="inbox-threads-rail">
        <div className="p-4 border-b border-stone-200 flex justify-between items-center bg-white">
          <span className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            Direct Messages
          </span>
          <button
            onClick={loadThreads}
            title="Reload Chats"
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Channels */}
        <div className="flex-1 overflow-y-auto space-y-1 p-2">
          {threads.length === 0 ? (
            <div className="text-center py-20 text-slate-400 text-xs font-medium px-4">
              No active chats yet. Start a discussion from the marketplace or Children's Homes hub!
            </div>
          ) : (
            threads.map((t) => {
              const matchesActive = selectedPartnerId === t.partnerId;
              return (
                <button
                  key={t.partnerId}
                  onClick={() => loadActiveThread(t.partnerId, t.partnerName)}
                  className={`w-full text-left p-3 rounded-2xl flex flex-col justify-between transition cursor-pointer ${
                    matchesActive 
                      ? "bg-white text-slate-900 shadow-xs border border-stone-200" 
                      : "hover:bg-stone-100 text-slate-600"
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-bold text-xs text-slate-900 truncate pr-2 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{t.partnerName}</span>
                    </span>
                    <span className="text-[9px] text-slate-400 font-normal shrink-0">
                      {new Date(t.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-1 leading-relaxed">
                    {t.lastMessage.content}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Direct conversation stage (Right panel) */}
      <div className="flex-1 flex flex-col justify-between bg-stone-50/20" id="inbox-thread-stage">
        {selectedPartnerId ? (
          <>
            {/* Header detail */}
            <div className="p-4 border-b border-stone-200 flex justify-between items-center bg-white">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  Chatting with: <strong className="text-emerald-700">{selectedPartnerName}</strong>
                </h3>
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                  Direct connection on UziLink Circular Network
                </span>
              </div>
            </div>

            {/* Message Body timeline */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map((m) => {
                const belongsToMe = m.senderId === user.id;
                return (
                  <div key={m.id} className={`flex flex-col ${belongsToMe ? "items-end" : "items-start"}`}>
                    <div className={`p-3.5 rounded-2xl text-xs max-w-md ${
                      belongsToMe 
                        ? "bg-emerald-600 text-white rounded-br-none shadow-xs" 
                        : "bg-white text-slate-800 rounded-bl-none border border-stone-200 shadow-xs"
                    }`}>
                      <p className="leading-relaxed font-medium">{m.content}</p>
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 uppercase font-semibold tracking-wide">
                      {belongsToMe ? "You" : m.senderName} • {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input form */}
            <form onSubmit={handleSendMessageSubmit} className="p-4 border-t border-stone-200 flex gap-2.5 bg-white">
              <input
                type="text"
                required
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Type your message terms, pickup details, or questions..."
                className="flex-1 bg-stone-50 border border-stone-200 focus:border-emerald-500 text-slate-800 text-xs px-4 py-3 rounded-2xl outline-none"
              />
              <button
                type="submit"
                disabled={sending || !currentMessage.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-3 rounded-2xl transition flex items-center justify-center cursor-pointer disabled:opacity-40 shadow-xs"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center space-y-3">
            <MessageSquare className="w-10 h-10 text-slate-300" />
            <div>
              <h4 className="text-slate-700 font-bold text-sm">No Conversation Selected</h4>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed mt-1">
                Select a contact on the left rail, or click "Send Message" on any textile listing or Children's Home card.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
