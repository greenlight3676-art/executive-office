import fs from "fs";
import path from "path";
import { createApprovalStore } from "../../approvals/store";
import { InMemoryConversationRepository, InMemoryMemoryRepository, InMemoryMessageRepository, InMemoryMissionRepository, InMemoryTaskRepository } from "../in-memory";
import { createPersistenceRepositories } from "../factory";
import { SupabaseConversationRepository, SupabaseMemoryRepository, SupabaseMessageRepository, SupabaseMissionRepository, SupabaseTaskRepository } from "../supabase-adapter";

describe("persistence factory", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("selects Supabase repositories when configured", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    const repositories = createPersistenceRepositories({ allowMemory: false, environment: "production" });
    const approvalStore = createApprovalStore({ allowMemory: false, environment: "production" });

    expect(repositories.missions).toBeInstanceOf(SupabaseMissionRepository);
    expect(repositories.tasks).toBeInstanceOf(SupabaseTaskRepository);
    expect(repositories.conversations).toBeInstanceOf(SupabaseConversationRepository);
    expect(repositories.messages).toBeInstanceOf(SupabaseMessageRepository);
    expect(repositories.memories).toBeInstanceOf(SupabaseMemoryRepository);
    expect(approvalStore).toBeTruthy();
  });

  it("selects in-memory repositories during tests", () => {
    const repositories = createPersistenceRepositories({ allowMemory: true, environment: "test" });

    expect(repositories.missions).toBeInstanceOf(InMemoryMissionRepository);
    expect(repositories.tasks).toBeInstanceOf(InMemoryTaskRepository);
    expect(repositories.conversations).toBeInstanceOf(InMemoryConversationRepository);
    expect(repositories.messages).toBeInstanceOf(InMemoryMessageRepository);
    expect(repositories.memories).toBeInstanceOf(InMemoryMemoryRepository);
  });

  it("fails clearly when required Supabase variables are incomplete", () => {
    expect(() => createPersistenceRepositories({ allowMemory: false, environment: "production" })).toThrow(/NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY/i);
  });

  it("does not expose the service-role key in client source", () => {
    const appDir = path.join(__dirname, "../../../app");
    const sourceFiles = [] as string[];

    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          sourceFiles.push(fullPath);
        }
      }
    };

    walk(appDir);

    const combinedSource = sourceFiles.map((file) => fs.readFileSync(file, "utf8")).join("\n");
    expect(combinedSource).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });
});
