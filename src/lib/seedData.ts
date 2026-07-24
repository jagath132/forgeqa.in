const SEEDED_KEY = 'forgeqa_seeded';

export async function seedSampleData() {
  // No-op in production
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SEEDED_KEY);
  }
}

export function clearSampleData() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SEEDED_KEY);
  }
}

export function isSampleDataSeeded(): boolean {
  return false;
}
