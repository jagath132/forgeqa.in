const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash"];
const ALLOWED_MODEL_PREFIXES = ["gemini-", "models/"];
const MAX_CONTEXT_CHARS_PER_CHUNK = 700;

function resolveModel(userModel) {
  if (!userModel) return null;
  const trimmed = userModel.trim();
  if (GEMINI_MODELS.includes(trimmed)) return trimmed;
  if (ALLOWED_MODEL_PREFIXES.some((p) => trimmed.startsWith(p))) return trimmed;
  return null;
}

function trimChunkText(text) {
  const normalized = String(text ?? "").replace(/\s+/g, " ").trim();

  if (normalized.length <= MAX_CONTEXT_CHARS_PER_CHUNK) {
    return normalized;
  }

  return `${normalized.slice(0, MAX_CONTEXT_CHARS_PER_CHUNK)}...`;
}

export function buildQaPrompt(requirement, contextChunks = []) {
  const context = contextChunks.length
    ? contextChunks
        .map(
          (chunk, index) =>
            `Context ${index + 1} from ${chunk.file_name}:\n${trimChunkText(chunk.chunk_text)}`,
        )
        .join("\n\n---\n\n")
    : "No uploaded knowledge context matched this requirement.";

  return `
You are a senior QA engineer. Use the uploaded project knowledge context first, then the user requirement.

Uploaded project knowledge context:
${context}

Requirement:
${requirement.trim()}

Return only valid JSON with this exact shape:
{
  "summary": "short summary",
  "testCases": [
    {
      "tcId": "TC_001",
      "category": "Positive",
      "summary": "short test case summary",
      "testDescription": "clear professional test description",
      "testSteps": ["step 1", "step 2", "step 3"],
      "expected": "expected result"
    }
  ]
}
The predefined output table columns are fixed and must be populated for every test case:
- TC_ID
- Category
- Summary
- Test description
- Test Steps
- Expected
Generate professional QA test cases in table-ready format.
Include all categories:
- Positive scenarios
- Negative scenarios
- Validation checks
- Edge cases
Create only required test cases don't give too many
Use sequential TC_ID values from TC_001, TC_002 like this 
Prefer project-specific terminology, validations, workflows, and constraints found in the uploaded knowledge context.
`;
}

export function parseSafeJson(text) {
  const trimmed = String(text ?? "").trim();
  
  try {
    return JSON.parse(trimmed);
  } catch (e) {
    // ignore direct parse failure and try extraction
  }

  const startIdxObj = trimmed.indexOf("{");
  const endIdxObj = trimmed.lastIndexOf("}");
  const startIdxArr = trimmed.indexOf("[");
  const endIdxArr = trimmed.lastIndexOf("]");

  let startIdx = -1;
  let endIdx = -1;

  if (startIdxObj !== -1 && startIdxArr !== -1) {
    if (startIdxObj < startIdxArr) {
      startIdx = startIdxObj;
      endIdx = endIdxObj;
    } else {
      startIdx = startIdxArr;
      endIdx = endIdxArr;
    }
  } else if (startIdxObj !== -1) {
    startIdx = startIdxObj;
    endIdx = endIdxObj;
  } else if (startIdxArr !== -1) {
    startIdx = startIdxArr;
    endIdx = endIdxArr;
  }

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const jsonCandidate = trimmed.slice(startIdx, endIdx + 1);
    try {
      return JSON.parse(jsonCandidate);
    } catch (e) {
      throw new Error(`Failed to parse extracted JSON: ${e.message}\nRaw response was: ${trimmed}`);
    }
  }

  throw new Error(`No valid JSON structure found in response: ${trimmed}`);
}

export async function generateWithGemini({ apiKey, prompt, model }) {
  let text = "";
  let lastError = "Gemini request failed.";
  let lastStatus = 502;
  const resolved = resolveModel(model);
  const models = resolved ? [resolved] : GEMINI_MODELS;

  for (const selectedModel of models) {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
            maxOutputTokens: 4096,
          },
        }),
      },
    );

    const data = await geminiResponse.json();

    if (geminiResponse.ok) {
      text =
        data.candidates?.[0]?.content?.parts
          ?.map((part) => part.text ?? "")
          .join("")
          .trim() ?? "";
      break;
    }

    lastError = data.error?.message ?? lastError;
    lastStatus = geminiResponse.status;
  }

  if (!text) {
    const error = new Error(lastError);
    error.statusCode = lastStatus;
    throw error;
  }

  return parseSafeJson(text);
}

export async function generateWithGeminiStream({ apiKey, prompt, model, onToken }) {
  const resolved = resolveModel(model);
  const models = resolved ? [resolved] : GEMINI_MODELS;

  for (const selectedModel of models) {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:streamGenerateContent?alt=sse`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
            maxOutputTokens: 4096,
          },
        }),
      },
    );

    if (!geminiResponse.ok) {
      const data = await geminiResponse.json().catch(() => ({}));
      if (selectedModel === models[models.length - 1]) {
        const error = new Error(data.error?.message || "Gemini streaming request failed.");
        error.statusCode = geminiResponse.status;
        throw error;
      }
      continue;
    }

    const reader = geminiResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const dataStr = line.slice(6).trim();
          if (!dataStr || dataStr === "[DONE]") continue;
          try {
            const data = JSON.parse(dataStr);
            const text = data.candidates?.[0]?.content?.parts
              ?.map((part) => part.text ?? "")
              .join("") ?? "";
            if (text) onToken(text);
          } catch {
            // skip unparseable chunks
          }
        }
      }
    }
    return;
  }
}

export async function generateWithGeminiRaw({ apiKey, prompt, model }) {
  let text = "";
  let lastError = "Gemini request failed.";
  let lastStatus = 502;
  const resolved = resolveModel(model);
  const models = resolved ? [resolved] : GEMINI_MODELS;

  for (const selectedModel of models) {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 4096,
          },
        }),
      },
    );

    const data = await geminiResponse.json();

    if (geminiResponse.ok) {
      text =
        data.candidates?.[0]?.content?.parts
          ?.map((part) => part.text ?? "")
          .join("")
          .trim() ?? "";
      break;
    }

    lastError = data.error?.message ?? lastError;
    lastStatus = geminiResponse.status;
  }

  if (!text) {
    const error = new Error(lastError);
    error.statusCode = lastStatus;
    throw error;
  }

  return text;
}
