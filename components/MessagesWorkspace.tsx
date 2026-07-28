"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { authFetch } from "@/lib/auth/browser";

type ExecutiveProfile = {
  id: string;
  name: string;
  symbol: string;
  role: string;
  mandate: string;
  motto: string;
  communicationStyle: string;
  accent: string;
  activeProvider: "openai" | "anthropic";
};

type Conversation = {
  id: string;
  executiveId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

type Message = {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

type MessagesWorkspaceProps = {
  executives: ExecutiveProfile[];
};

function formatThreadTime(value: string) {
  const date = new Date(value);
  const today = new Date();

  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function MessagesWorkspace({ executives }: MessagesWorkspaceProps) {
  const [selectedExecutiveId, setSelectedExecutiveId] = useState(executives[0]?.id ?? "orynth");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [mode, setMode] = useState<"default" | "deep">("default");
  const [persistence, setPersistence] = useState<"supabase" | "memory">("memory");
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const messageEndRef = useRef<HTMLDivElement>(null);

  const selectedExecutive =
    executives.find((executive) => executive.id === selectedExecutiveId) ?? executives[0];

  const activeTitle = useMemo(
    () => activeConversation?.title ?? `New ${selectedExecutive?.name ?? "executive"} conversation`,
    [activeConversation, selectedExecutive],
  );

  useEffect(() => {
    async function loadConversations() {
      setIsLoadingThreads(true);
      setError("");

      try {
        const response = await authFetch(
          `/api/conversations?executiveId=${encodeURIComponent(selectedExecutiveId)}`,
          { cache: "no-store" },
        );
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Unable to load conversations.");
        setConversations(Array.isArray(payload.conversations) ? payload.conversations : []);
        setPersistence(payload.persistence === "supabase" ? "supabase" : "memory");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load conversations.");
      } finally {
        setIsLoadingThreads(false);
      }
    }

    setActiveConversation(null);
    setMessages([]);
    void loadConversations();
  }, [selectedExecutiveId]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, isSending]);

  async function openConversation(conversation: Conversation) {
    setActiveConversation(conversation);
    setIsLoadingMessages(true);
    setError("");

    try {
      const response = await authFetch(`/api/conversations/${conversation.id}`, {
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to load messages.");
      setMessages(Array.isArray(payload.messages) ? payload.messages : []);
    } catch (loadError) {
      setMessages([]);
      setError(loadError instanceof Error ? loadError.message : "Unable to load messages.");
    } finally {
      setIsLoadingMessages(false);
    }
  }

  function startConversation() {
    setActiveConversation(null);
    setMessages([]);
    setDraft("");
    setError("");
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || isSending || !selectedExecutive) return;

    const optimisticMessage: Message = {
      id: `pending-${Date.now()}`,
      conversationId: activeConversation?.id ?? "pending",
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, optimisticMessage]);
    setDraft("");
    setIsSending(true);
    setError("");

    try {
      const response = await authFetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          executive: selectedExecutive.id,
          mode,
          conversationId: activeConversation?.id,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Executive response failed.");

      const savedUser = payload.userMessage as Message | undefined;
      const assistantMessage = payload.message as Message | undefined;
      const conversation = payload.conversation as Conversation | undefined;

      setMessages((current) => [
        ...current.filter((message) => message.id !== optimisticMessage.id),
        ...(savedUser ? [savedUser] : [optimisticMessage]),
        ...(assistantMessage ? [assistantMessage] : []),
      ]);

      if (conversation) {
        setActiveConversation(conversation);
        setConversations((current) => [
          conversation,
          ...current.filter((item) => item.id !== conversation.id),
        ]);
      }
      setPersistence(payload.persistence === "supabase" ? "supabase" : persistence);
    } catch (sendError) {
      setMessages((current) => [
        ...current,
        {
          id: `error-${Date.now()}`,
          conversationId: activeConversation?.id ?? "error",
          role: "assistant",
          content: sendError instanceof Error ? sendError.message : "Executive response failed.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  if (!selectedExecutive) {
    return (
      <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 p-5 text-rose-100">
        No executive profiles are available.
      </div>
    );
  }

  return (
    <div className="grid min-h-[72vh] gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <section className="rounded-[26px] border border-white/10 bg-zinc-950/70 p-3 backdrop-blur-xl">
          <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
            {executives.map((executive) => {
              const isActive = executive.id === selectedExecutive.id;
              return (
                <button
                  key={executive.id}
                  type="button"
                  onClick={() => setSelectedExecutiveId(executive.id)}
                  className={`min-w-48 rounded-2xl border p-3 text-left transition lg:min-w-0 ${
                    isActive
                      ? "border-cyan-400/40 bg-cyan-400/10"
                      : "border-transparent bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${executive.accent} font-semibold text-white`}
                    >
                      {executive.symbol}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-white">{executive.name}</div>
                      <div className="truncate text-xs text-zinc-500">{executive.role}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-[26px] border border-white/10 bg-zinc-950/70 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Conversations</p>
            <button
              type="button"
              onClick={startConversation}
              className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-xs text-cyan-200"
            >
              + New
            </button>
          </div>

          <div className="mt-3 max-h-64 space-y-2 overflow-y-auto lg:max-h-[38vh]">
            {isLoadingThreads ? (
              <div className="rounded-xl bg-white/5 p-3 text-sm text-zinc-500">Loading threads...</div>
            ) : conversations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 p-3 text-sm text-zinc-500">
                No conversations yet.
              </div>
            ) : (
              conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => void openConversation(conversation)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    activeConversation?.id === conversation.id
                      ? "border-fuchsia-400/30 bg-fuchsia-400/10"
                      : "border-white/5 bg-white/[0.03] hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="line-clamp-1 text-sm text-zinc-200">{conversation.title}</div>
                  <div className="mt-1 text-[11px] text-zinc-600">
                    {formatThreadTime(conversation.updatedAt)}
                  </div>
                </button>
              ))
            )}
          </div>
        </section>
      </aside>

      <section className="flex min-h-[640px] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-zinc-950/70 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <header className="border-b border-white/10 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${selectedExecutive.accent} font-semibold text-white`}
              >
                {selectedExecutive.symbol}
              </div>
              <div className="min-w-0">
                <div className="truncate text-lg font-semibold text-white">{activeTitle}</div>
                <div className="mt-0.5 text-sm text-zinc-500">
                  {selectedExecutive.name} • {selectedExecutive.role}
                </div>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">
                {selectedExecutive.activeProvider}
              </div>
              <div
                className={`mt-1 text-xs ${
                  persistence === "supabase" ? "text-emerald-300" : "text-amber-300"
                }`}
              >
                {persistence === "supabase" ? "Memory saved" : "Local memory"}
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-2 text-xs text-zinc-400 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <span className="text-zinc-600">Mandate </span>
              {selectedExecutive.mandate}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <span className="text-zinc-600">Style </span>
              {selectedExecutive.communicationStyle}
            </div>
          </div>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {error ? (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          {isLoadingMessages ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-500">
              Loading conversation...
            </div>
          ) : messages.length === 0 ? (
            <div className="mx-auto mt-12 max-w-xl text-center">
              <div
                className={`mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br ${selectedExecutive.accent} text-xl font-semibold text-white shadow-lg`}
              >
                {selectedExecutive.symbol}
              </div>
              <h2 className="mt-5 text-2xl font-semibold">Talk to {selectedExecutive.name}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500">{selectedExecutive.mandate}</p>
              <p className="mt-3 text-sm italic text-zinc-600">“{selectedExecutive.motto}”</p>
            </div>
          ) : (
            messages.map((message) => (
              <article
                key={message.id}
                className={`max-w-[88%] rounded-2xl border p-3 text-sm leading-6 sm:max-w-[78%] ${
                  message.role === "user"
                    ? "ml-auto border-cyan-400/20 bg-cyan-400/10 text-cyan-50"
                    : "border-white/10 bg-white/[0.05] text-zinc-300"
                }`}
              >
                <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-zinc-600">
                  {message.role === "user" ? "TJ" : selectedExecutive.name}
                </div>
                <div className="whitespace-pre-wrap">{message.content}</div>
              </article>
            ))
          )}

          {isSending ? (
            <div className="max-w-[78%] rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-sm text-zinc-500">
              {selectedExecutive.name} is thinking...
            </div>
          ) : null}
          <div ref={messageEndRef} />
        </div>

        <form onSubmit={sendMessage} className="border-t border-white/10 p-4 sm:p-5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="text-xs text-zinc-600">
              {activeConversation ? "Continuing saved conversation" : "Starting a new saved conversation"}
            </div>
            <button
              type="button"
              onClick={() => setMode((current) => (current === "default" ? "deep" : "default"))}
              className={`rounded-full border px-2.5 py-1 text-[11px] ${
                mode === "deep"
                  ? "border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-200"
                  : "border-white/10 bg-white/5 text-zinc-400"
              }`}
            >
              {mode === "deep" ? "Deep mode" : "Fast mode"}
            </button>
          </div>
          <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-black/30 p-2 focus-within:border-cyan-400/30">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={2}
              placeholder={`Message ${selectedExecutive.name}...`}
              className="min-h-12 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-zinc-700"
            />
            <button
              type="submit"
              disabled={!draft.trim() || isSending}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}