import { InMemoryMemoryStore } from "../in-memory-store";
import { createMemoryRetriever } from "../retriever";
import { createMemorySaver } from "../saver";

describe("memory architecture", () => {
  it("stores and retrieves short-term memory", async () => {
    const store = new InMemoryMemoryStore();
    const saveMemory = createMemorySaver(store);
    const retrieveMemory = createMemoryRetriever(store);

    await saveMemory("orynth", "short-term", "Aligned on mission planning", "conversation");
    const memory = await retrieveMemory("orynth", "short-term");

    expect(memory.memories[0].content).toContain("Aligned on mission planning");
  });

  it("supports semantic-looking search by keyword", async () => {
    const store = new InMemoryMemoryStore();
    const saveMemory = createMemorySaver(store);
    await saveMemory("brayko", "long-term", "Built a secure AI router", "decision");
    const searchResults = await store.search("router");

    expect(searchResults[0].content).toContain("router");
  });
});
