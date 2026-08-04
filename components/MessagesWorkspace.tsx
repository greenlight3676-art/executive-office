"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { authFetch } from "@/lib/auth/browser";
import type { ProviderName } from "@/lib/ai/providers";

type ExecutiveProfile = {
  id: string;
  name: string;
  symbol: string;
  role: string;
  mandate: string;
  motto: string;
  communicationStyle: string;
  accent: string;
  activeProvider: ProviderName;
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

type ToolResultRecord = {
  title: string;
  subtitle?: string;
  detail?: string;
  url?: string;
};

type ToolResult = {
  ok: boolean;
  toolSlug: string;
  action: string;
  status: "success" | "missing_config" | "missing_connection" | "tool_error" | "unsupported";
  title: string;
  summary: string;
  records?: ToolResultRecord[];
  logId?: string;
  error?: string;
};

type MissionResult = {
  id: string;
  title: string;
  status: string;
  taskCount: number;
};

type ExecutiveMemory = {
  id: string;
  executiveId: string;
  scope: "short-term" | "long-term" | "project";
  content: string;
  kind: string;
  createdAt: string;
};

type SpeechRecognitionEventLike = {
  results: ArrayLike<{
    0: { transcript: string };
    isFinal: boolean;
  }>;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

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

function getToolResult(message: Message): ToolResult | null {
  const value = message.metadata?.toolResult;
  if (!value || typeof value !== "object") return null;

  const result = value as Partial<ToolResult>;
  if (typeof result.action !== "string" || typeof result.summary !== "string") return null;

  return {
    ok: Boolean(result.ok),
    toolSlug: typeof result.toolSlug === "string" ? result.toolSlug : "tool",
    action: result.action,
    status: result.status ?? (result.ok ? "success" : "tool_error"),
    title: typeof result.title === "string" ? result.title : result.action,
    summary: result.summary,
    records: Array.isArray(result.records) ? result.records.filter(isToolResultRecord) : [],
    logId: typeof result.logId === "string" ? result.logId : undefined,
    error: typeof result.error === "string" ? result.error : undefined,
  };
}

function getMissionResult(message: Message): MissionResult | null {
  const value = message.metadata?.mission;
  if (!value || typeof value !== "object") return null;

  const mission = value as Partial<MissionResult>;
  if (typeof mission.id !== "string" || typeof mission.title !== "string") return null;

  return {
    id: mission.id,
    title: mission.title,
    status: typeof mission.status === "string" ? mission.status : "active",
    taskCount: typeof mission.taskCount === "number" ? mission.taskCount : 0,
  };
}

function isToolResultRecord(value: unknown): value is ToolResultRecord {
  return Boolean(value && typeof value === "object" && typeof (value as ToolResultRecord).title === "string");
}

function toolStatusCopy(status: ToolResult["status"]) {
  if (status === "success") return "Connected";
  if (status === "missing_config") return "Needs API key";
  if (status === "missing_connection") return "Connect account";
  if (status === "unsupported") return "Prepared";
  return "Tool error";
}

function toolStatusClass(status: ToolResult["status"]) {
  if (status === "success") return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
  if (status === "missing_connection" || status === "missing_config") return "border-amber-400/30 bg-amber-400/10 text-amber-200";
  if (status === "unsupported") return "border-cyan-400/30 bg-cyan-400/10 text-cyan-200";
  return "border-rose-400/30 bg-rose-400/10 text-rose-200";
}

function ToolResultCard({ result }: { result: ToolResult }) {
  const records = result.records ?? [];

  return (
    <div className="mt-3 rounded-2xl border border-white/10 bg-black/25 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">Tool result</p>
          <h3 className="mt-1 text-sm font-semibold text-zinc-100">{result.title}</h3>
          <p className="mt-1 text-xs text-zinc-400">{result.summary}</p>
        </div>
        <span className={`w-fit rounded-full border px-2.5 py-1 text-[11px] ${toolStatusClass(result.status)}`}>
          {toolStatusCopy(result.status)}
        </span>
      </div>

      {records.length ? (
        <div className="mt-3 space-y-2">
          {records.map((record, index) => (
            <div key={`${record.title}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-sm font-medium text-zinc-100">{record.title}</div>
              {record.subtitle ? <div className="mt-1 text-xs text-zinc-500">{record.subtitle}</div> : null}
              {record.detail ? <p className="mt-2 text-xs leading-5 text-zinc-400">{record.detail}</p> : null}
              {record.url ? (
                <a
                  href={record.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-xs text-cyan-300 hover:text-cyan-200"
                >
                  Open result
                </a>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-zinc-600">
        <span>{result.toolSlug}</span>
        {result.logId ? <span>Log {result.logId}</span> : null}
      </div>
    </div>
  );
}

function MissionResultCard({ mission }: { mission: MissionResult }) {
  return (
    <div className="mt-3 rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/10 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-fuchsia-200/70">Mission created</p>
          <h3 className="mt-1 text-sm font-semibold text-fuchsia-50">{mission.title}</h3>
          <p className="mt-1 text-xs text-fuchsia-100/70">
            {mission.taskCount} tasks assigned across the executive team.
          </p>
        </div>
        <span className="w-fit rounded-full border border-fuchsia-300/30 bg-black/20 px-2.5 py-1 text-[11px] text-fuchsia-100">
          {mission.status}
        </span>
      </div>
    </div>
  );
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
  const [memories, setMemories] = useState<ExecutiveMemory[]>([]);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [isLoadingMemory, setIsLoadingMemory] = useState(false);
  const [isSavingMemory, setIsSavingMemory] = useState(false);
  const [memoryDraft, setMemoryDraft] = useState("");
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

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
    setMemories([]);
    setIsMemoryOpen(false);
    void loadConversations();
  }, [selectedExecutiveId]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, isSending]);

  useEffect(() => {
    const speechWindow = window as typeof window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    setSpeechSupported(Boolean(speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition));

    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

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

  async function loadMemories() {
    setIsLoadingMemory(true);
    setError("");
    try {
      const response = await authFetch(
        `/api/memory?executiveId=${encodeURIComponent(selectedExecutiveId)}&limit=30`,
        { cache: "no-store" },
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to load memory.");
      setMemories(Array.isArray(payload.memories) ? payload.memories : []);
      setPersistence(payload.persistence === "supabase" ? "supabase" : "memory");
    } catch (memoryError) {
      setError(memoryError instanceof Error ? memoryError.message : "Unable to load memory.");
    } finally {
      setIsLoadingMemory(false);
    }
  }

  async function toggleMemory() {
    const next = !isMemoryOpen;
    setIsMemoryOpen(next);
    if (next) await loadMemories();
  }

  async function saveMemory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = memoryDraft.trim();
    if (!content || isSavingMemory) return;
    setIsSavingMemory(true);
    setError("");
    try {
      const response = await authFetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ executiveId: selectedExecutiveId, content, scope: "long-term" }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to save memory.");
      setMemories((current) => [payload.memory, ...current]);
      setMemoryDraft("");
      setPersistence(payload.persistence === "supabase" ? "supabase" : "memory");
    } catch (memoryError) {
      setError(memoryError instanceof Error ? memoryError.message : "Unable to save memory.");
    } finally {
      setIsSavingMemory(false);
    }
  }

  async function removeMemory(id: string) {
    setError("");
    try {
      const response = await authFetch(`/api/memory/${encodeURIComponent(id)}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to delete memory.");
      setMemories((current) => current.filter((memory) => memory.id !== id));
    } catch (memoryError) {
      setError(memoryError instanceof Error ? memoryError.message : "Unable to delete memory.");
    }
  }

  function toggleVoiceInput() {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const speechWindow = window as typeof window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setError("Voice input is not supported in this browser.");
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = 0; index < event.results.length; index += 1) {
        transcript += event.results[index][0]?.transcript ?? "";
      }
      if (transcript.trim()) setDraft(transcript.trim());
    };
    recognition.onerror = (event) => {
      setError(event.error ? `Microphone error: ${event.error}` : "Microphone input failed.");
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };
    recognitionRef.current = recognition;
    setError("");
    setIsListening(true);
    recognition.start();
  }

  function speakMessage(content: string) {
    if (!("speechSynthesis" in window)) {
      setError("Spoken replies are not supported in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(content);
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
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
              <button
                type="button"
                onClick={() => void toggleMemory()}
                className={`mt-2 rounded-full border px-2.5 py-1 text-[11px] ${
                  isMemoryOpen
                    ? "border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-200"
                    : "border-white/10 bg-white/5 text-zinc-400"
                }`}
              >
                Memory center
              </button>
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

        {isMemoryOpen ? (
          <section className="border-b border-white/10 bg-black/20 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-300">Memory center</p>
                <p className="mt-1 text-xs text-zinc-500">Add or remove facts Forge should carry into future conversations.</p>
              </div>
              <span className="text-xs text-zinc-600">{memories.length} saved</span>
            </div>
            <form onSubmit={saveMemory} className="mt-3 flex gap-2">
              <input
                value={memoryDraft}
                onChange={(event) => setMemoryDraft(event.target.value)}
                placeholder="Remember that..."
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-fuchsia-400/40"
              />
              <button
                type="submit"
                disabled={!memoryDraft.trim() || isSavingMemory}
                className="rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 px-3 py-2 text-sm text-fuchsia-100 disabled:opacity-40"
              >
                {isSavingMemory ? "Saving..." : "Remember"}
              </button>
            </form>
            <div className="mt-3 max-h-52 space-y-2 overflow-y-auto">
              {isLoadingMemory ? (
                <div className="rounded-xl bg-white/5 p-3 text-sm text-zinc-500">Loading memory...</div>
              ) : memories.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 p-3 text-sm text-zinc-500">No saved memory for this executive yet.</div>
              ) : (
                memories.map((memory) => (
                  <div key={memory.id} className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="min-w-0">
                      <p className="text-sm leading-5 text-zinc-300">{memory.content}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-zinc-600">{memory.scope} • {memory.kind}</p>
                    </div>
                    <button type="button" onClick={() => void removeMemory(memory.id)} className="shrink-0 rounded-lg border border-rose-400/20 px-2 py-1 text-[11px] text-rose-300">
                      Forget
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        ) : null}

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
            messages.map((message) => {
              const toolResult = getToolResult(message);
              const missionResult = getMissionResult(message);

              return (
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
                  {message.role === "assistant" ? (
                    <button
                      type="button"
                      onClick={() => speakMessage(message.content)}
                      className="mt-2 rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-zinc-500 hover:text-zinc-300"
                    >
                      Read aloud
                    </button>
                  ) : null}
                  {toolResult ? <ToolResultCard result={toolResult} /> : null}
                  {missionResult ? <MissionResultCard mission={missionResult} /> : null}
                </article>
              );
            })
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
            {speechSupported ? (
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`rounded-xl border px-3 py-3 text-sm transition ${
                  isListening
                    ? "border-rose-400/40 bg-rose-400/10 text-rose-200"
                    : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
                }`}
                aria-label={isListening ? "Stop voice input" : "Start voice input"}
              >
                {isListening ? "■" : "🎙"}
              </button>
            ) : null}
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