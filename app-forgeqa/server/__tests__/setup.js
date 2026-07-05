import { vi } from "vitest";

vi.mock("../db.js", () => ({
  getDb: () => ({
    collection: () => ({
      findOne: vi.fn(),
      find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]), sort: vi.fn().mockReturnThis(), skip: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), project: vi.fn().mockReturnThis() }),
      insertOne: vi.fn(),
      updateOne: vi.fn(),
      deleteOne: vi.fn(),
      countDocuments: vi.fn().mockResolvedValue(0),
      createIndex: vi.fn(),
    }),
  }),
}));
