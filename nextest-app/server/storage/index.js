import { createMongoKnowledgeStore } from "./mongoStore.js";

export function createKnowledgeStore() {
  return createMongoKnowledgeStore();
}
