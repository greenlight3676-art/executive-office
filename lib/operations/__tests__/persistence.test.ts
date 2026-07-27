import { createSupabaseClient } from "../..//repositories/supabase";
import { InMemoryConversationRepository, InMemoryMemoryRepository, InMemoryMessageRepository, InMemoryMissionRepository, InMemoryTaskRepository } from "../../repositories/in-memory";

describe("persistence architecture", () => {
  it("supports in-memory repositories for tests", async () => {
    const missions = new InMemoryMissionRepository();
    const tasks = new InMemoryTaskRepository();
    const conversations = new InMemoryConversationRepository();
    const messages = new InMemoryMessageRepository();
    const memories = new InMemoryMemoryRepository();

    await missions.create({
      id: "mission-1",
      title: "Persistence mission",
      description: "Persisted",
      projectId: "proj-1",
      createdBy: "orynth",
      assignedExecutives: ["orynth"],
      status: "planned",
      priority: "medium",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await conversations.create({
      id: "conversation-1",
      executiveId: "orynth",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const stored = await missions.get("mission-1");
    expect(stored?.title).toBe("Persistence mission");
    expect(await conversations.get("conversation-1")).toBeTruthy();
    expect(await messages.listByConversation("conversation-1")).toEqual([]);
    expect(await memories.listByExecutive("orynth")).toEqual([]);
  });

  it("requires full Supabase configuration", () => {
    expect(() => createSupabaseClient({})).toThrow(/required/i);
  });
});
