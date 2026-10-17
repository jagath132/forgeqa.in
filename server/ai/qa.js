import { cosineSimilarity, createEmbeddings } from './embeddings.js';

async function embedInBatches(options, inputs) {
  const vectors = [];
  for (let offset = 0; offset < inputs.length; offset += 64) {
    vectors.push(
      ...(await createEmbeddings({
        ...options,
        inputs: inputs.slice(offset, offset + 64),
      }))
    );
  }
  return vectors;
}

export async function embedTestCases(testCases, options) {
  const cases = Array.isArray(testCases) ? testCases : [];
  const stepOffsets = [];
  const steps = [];
  for (const testCase of cases) {
    stepOffsets.push(steps.length);
    steps.push(...(Array.isArray(testCase.testSteps) ? testCase.testSteps : []));
  }
  const caseTexts = cases.map((testCase) =>
    [testCase.summary, testCase.testDescription, ...(testCase.testSteps ?? []), testCase.expected]
      .filter(Boolean)
      .join('\n')
  );
  const [caseVectors, stepVectors] = await Promise.all([
    embedInBatches(options, caseTexts),
    embedInBatches(options, steps),
  ]);
  return { caseVectors, stepVectors, stepOffsets };
}

export function extractRequirements(text) {
  const lines = String(text ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  let items = lines.map((line) => line.replace(/^(?:[-*•]|\d+[.)])\s*/, '').trim()).filter(Boolean);
  if (items.length <= 1) {
    items = String(text ?? '')
      .split(/(?<=[.!?])\s+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (!items.length && String(text ?? '').trim()) items = [String(text).trim()];
  return items.map((item, index) => ({ id: `R${index + 1}`, text: item }));
}

export function normalizeGherkinSteps(testCases) {
  return testCases.map((testCase) => {
    const steps = Array.isArray(testCase.testSteps) ? testCase.testSteps : [];
    return {
      ...testCase,
      testSteps: steps.map((step, index) => {
        const text = String(step)
          .replace(/^\s*\d+[.)]\s*/, '')
          .trim();
        const keyword = text.match(/^(?:Given|When|Then|And|But)\b/i)?.[0];
        if (keyword) {
          return `${keyword[0].toUpperCase()}${keyword.slice(1)}${text.slice(keyword.length)}`;
        }
        const inferredKeyword =
          index === 0 ? 'Given' : index === steps.length - 1 ? 'Then' : 'When';
        return `${inferredKeyword} ${text}`;
      }),
    };
  });
}

function uniqueBySimilarity(items, vectors, threshold) {
  const unique = [];
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    const duplicate = unique.some(
      (existing) =>
        vectors[i] && existing.vector && cosineSimilarity(vectors[i], existing.vector) >= threshold
    );
    if (!duplicate) unique.push({ item, vector: vectors[i] });
  }
  return unique;
}

export function deduplicateTestCases(testCases, embeddings, threshold = 0.92) {
  const safeThreshold = Number.isFinite(threshold)
    ? Math.min(0.99, Math.max(0.7, threshold))
    : 0.92;
  const cases = Array.isArray(testCases) ? testCases : [];
  const caseVectors = embeddings?.caseVectors ?? [];
  const stepVectors = embeddings?.stepVectors ?? [];
  const merged = [];

  for (let i = 0; i < cases.length; i += 1) {
    const testCase = { ...cases[i] };
    const steps = Array.isArray(testCase.testSteps) ? testCase.testSteps : [];
    const firstStepIndex = embeddings?.stepOffsets?.[i] ?? 0;
    const uniqueSteps = uniqueBySimilarity(
      steps,
      stepVectors.slice(firstStepIndex, firstStepIndex + steps.length),
      safeThreshold
    );
    testCase.testSteps = uniqueSteps.map(({ item }) => item);
    testCase.requirementIds = Array.isArray(testCase.requirementIds)
      ? [...new Set(testCase.requirementIds.filter((id) => /^R\d+$/.test(id)))]
      : [];

    const duplicateIndex = merged.findIndex(
      (existing) =>
        caseVectors[i] &&
        caseVectors[existing.sourceIndex] &&
        cosineSimilarity(caseVectors[i], caseVectors[existing.sourceIndex]) >= safeThreshold
    );
    if (duplicateIndex === -1) {
      merged.push({
        ...testCase,
        sourceIndex: i,
        stepVectors: uniqueSteps.map(({ vector }) => vector),
      });
      continue;
    }

    const existing = merged[duplicateIndex];
    const combinedSteps = [...existing.testSteps, ...testCase.testSteps];
    const combinedVectors = [...existing.stepVectors, ...uniqueSteps.map(({ vector }) => vector)];
    const uniqueMergedSteps = uniqueBySimilarity(combinedSteps, combinedVectors, safeThreshold);
    existing.testSteps = uniqueMergedSteps.map(({ item }) => item);
    existing.stepVectors = uniqueMergedSteps.map(({ vector }) => vector);
    existing.requirementIds = [
      ...new Set([...existing.requirementIds, ...testCase.requirementIds]),
    ];
  }

  return merged.map(
    ({ sourceIndex: _sourceIndex, stepVectors: _stepVectors, ...testCase }, index) => ({
      ...testCase,
      tcId: `TC_${String(index + 1).padStart(3, '0')}`,
    })
  );
}

export function buildTraceability(requirements, testCases) {
  return requirements.map((requirement) => {
    const matchingCases = testCases.filter((testCase) =>
      testCase.requirementIds?.includes(requirement.id)
    );
    return {
      ...requirement,
      caseIds: matchingCases.map((testCase) => testCase.tcId),
      covered: matchingCases.length > 0,
    };
  });
}
