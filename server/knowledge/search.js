import { cosineSimilarity } from '../ai/embeddings.js';

function tokenize(text) {
  return (
    String(text ?? '')
      .toLowerCase()
      .match(/[\p{L}\p{N}_-]+/gu) ?? []
  );
}

export function rankChunks(chunks, query, limit, queryEmbedding) {
  const queryTerms = tokenize(query);
  const documentTerms = chunks.map((chunk) => tokenize(chunk.chunk_text));
  const documentFrequency = new Map();
  for (const terms of documentTerms) {
    for (const term of new Set(terms)) {
      documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
    }
  }

  const averageLength = Math.max(
    1,
    documentTerms.reduce((sum, terms) => sum + terms.length, 0) / Math.max(documentTerms.length, 1)
  );
  const k1 = 1.2;
  const b = 0.75;
  const ranked = chunks.map((chunk, index) => {
    const terms = documentTerms[index];
    const termFrequency = new Map();
    for (const term of terms) termFrequency.set(term, (termFrequency.get(term) ?? 0) + 1);
    let bm25 = 0;
    for (const term of queryTerms) {
      const tf = termFrequency.get(term) ?? 0;
      if (!tf) continue;
      const df = documentFrequency.get(term) ?? 0;
      const idf = Math.log(1 + (chunks.length - df + 0.5) / (df + 0.5));
      bm25 += idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (terms.length / averageLength))));
    }
    const cosine = queryEmbedding
      ? Math.max(0, cosineSimilarity(queryEmbedding, chunk.embedding))
      : 0;
    return { ...chunk, bm25, cosine };
  });
  const maxBm25 = Math.max(...ranked.map((chunk) => chunk.bm25), 0);

  return ranked
    .map((chunk) => {
      const lexicalScore = maxBm25 ? chunk.bm25 / maxBm25 : 0;
      const score = queryEmbedding ? 0.65 * chunk.cosine + 0.35 * lexicalScore : lexicalScore;
      return { ...chunk, score };
    })
    .filter((chunk) => chunk.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ bm25: _bm25, cosine: _cosine, ...chunk }) => chunk);
}
