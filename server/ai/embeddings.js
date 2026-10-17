const GEMINI_EMBEDDING_MODEL = 'gemini-embedding-001';
const OPENAI_EMBEDDING_MODEL = 'text-embedding-3-small';

function openAiEmbeddingEndpoint(provider) {
  if (provider === 'openrouter') return 'https://openrouter.ai/api/v1/embeddings';
  if (provider === 'openai') return 'https://api.openai.com/v1/embeddings';
  return null;
}

export function supportsEmbeddings(provider) {
  return provider === 'gemini' || provider === 'openai' || provider === 'openrouter';
}

export async function createEmbeddings({
  apiKey,
  provider,
  inputs,
  embeddingTaskType = 'RETRIEVAL_DOCUMENT',
}) {
  if (!Array.isArray(inputs) || inputs.length === 0) return [];
  if (!apiKey) throw new Error('An API key is required to create embeddings.');

  if (provider === 'gemini') {
    const vectors = [];
    for (let offset = 0; offset < inputs.length; offset += 100) {
      const batch = inputs.slice(offset, offset + 100);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EMBEDDING_MODEL}:batchEmbedContents`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          body: JSON.stringify({
            requests: batch.map((input) => ({
              model: `models/${GEMINI_EMBEDDING_MODEL}`,
              content: { parts: [{ text: input }] },
              taskType: embeddingTaskType,
            })),
          }),
        }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error?.message ?? `Embedding request failed (${response.status}).`);
      }
      const batchVectors = data.embeddings?.map((embedding) => embedding.values);
      if (
        !Array.isArray(batchVectors) ||
        batchVectors.length !== batch.length ||
        batchVectors.some((vector) => !Array.isArray(vector))
      ) {
        throw new Error('Embedding provider returned an invalid vector batch.');
      }
      vectors.push(...batchVectors);
    }
    return vectors;
  }

  const endpoint = openAiEmbeddingEndpoint(provider);
  if (!endpoint) {
    throw new Error(`Dense embeddings are not supported for the ${provider} provider.`);
  }
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model:
        provider === 'openrouter' ? `openai/${OPENAI_EMBEDDING_MODEL}` : OPENAI_EMBEDDING_MODEL,
      input: inputs,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error?.message ?? `Embedding request failed (${response.status}).`);
  }
  const vectors = data.data?.sort((a, b) => a.index - b.index).map((item) => item.embedding);
  if (
    !Array.isArray(vectors) ||
    vectors.length !== inputs.length ||
    vectors.some((v) => !Array.isArray(v))
  ) {
    throw new Error('Embedding provider returned an invalid vector batch.');
  }
  return vectors;
}

export function cosineSimilarity(left, right) {
  if (
    !Array.isArray(left) ||
    !Array.isArray(right) ||
    left.length !== right.length ||
    !left.length
  ) {
    return 0;
  }
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let i = 0; i < left.length; i += 1) {
    dot += left[i] * right[i];
    leftMagnitude += left[i] * left[i];
    rightMagnitude += right[i] * right[i];
  }
  if (!leftMagnitude || !rightMagnitude) return 0;
  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}
