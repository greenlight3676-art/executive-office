import { InMemoryConversationStore } from "../store";

describe("conversation storage", () => {
  it("keeps executive conversations, ordered messages, and controllable memories", async () => {
    const store = new InMemoryConversationStore();
    const conversation = await store.createConversation({
      executiveId: "orynth",
      title: "Phase 1 plan",
    });

    await store.createMessage({
      conversationId: conversation.id,
      role: "user",
      content: "Remember the Messages page is first.",
    });
    await store.createMessage({
      conversationId: conversation.id,
      role: "assistant",
      content: "Messages comes first.",
    });
    const memory = await store.createMemory({
      executiveId: "orynth",
      scope: "long-term",
      content: "Messages page is the first Phase 1 priority.",
      kind: "user-directed-memory",
    });

    const [messages, memories, conversations] = await Promise.all([
      store.listMessages(conversation.id),
      store.listMemories("orynth"),
      store.listConversations("orynth"),
    ]);

    expect(messages.map((message) => message.role)).toEqual(["user", "assistant"]);
    expect(memories[0].content).toContain("first Phase 1 priority");
    expect(conversations[0].id).toBe(conversation.id);

    await expect(store.deleteMemory(memory.id)).resolves.toBe(true);
    await expect(store.listMemories("orynth")).resolves.toEqual([]);
  });
});
