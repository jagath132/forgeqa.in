export function logError(context: string, error: unknown): void {
  if (process.env.NODE_ENV === 'production') return;
  const msg = error instanceof Error ? error.message : String(error);
  console.error(`[ForgeQA] [${context}]`, msg);
}

export function logWarn(context: string, message: string): void {
  if (process.env.NODE_ENV === 'production') return;
  console.warn(`[ForgeQA] [${context}]`, message);
}
