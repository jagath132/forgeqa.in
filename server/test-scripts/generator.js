import { buildScriptPrompt } from "./prompts.js";
import { generateWithGeminiRaw } from "../ai/gemini.js";
import { generateWithOpenAI } from "../ai/openai.js";

const defaultViewport = { width: 1280, height: 720 };
const defaultOptions = {
  headless: true,
  viewport: defaultViewport,
};

export async function generateTestScript({
  apiKey,
  provider = "gemini",
  framework,
  language,
  targetUrl,
  testCases,
  options,
  model,
}) {
  const normalizedOptions = {
    ...defaultOptions,
    ...options,
    viewport: {
      ...defaultViewport,
      ...(options?.viewport ?? {}),
    },
  };

  const prompt = buildScriptPrompt({
    framework,
    language,
    targetUrl,
    testCases,
    options: normalizedOptions,
  });

  let script;
  if (provider === "gemini") {
    script = await generateWithGeminiRaw({ apiKey, prompt, model });
  } else if (provider === "openai" || provider === "opencode") {
    script = await generateWithOpenAI({
      apiKey,
      prompt,
      model: model || "gpt-4o-mini",
      endpoint: "https://api.openai.com/v1/chat/completions",
      provider,
    });
  } else if (provider === "openrouter") {
    script = await generateWithOpenAI({
      apiKey,
      prompt,
      model: model || "google/gemini-2.0-flash-exp:free",
      endpoint: "https://openrouter.ai/api/v1/chat/completions",
      provider,
    });
  } else if (provider === "groq") {
    script = await generateWithOpenAI({
      apiKey,
      prompt,
      model: model || "llama-3.1-8b-instant",
      endpoint: "https://api.groq.com/openai/v1/chat/completions",
      provider,
    });
  } else {
    throw new Error(`${provider} support is not implemented yet.`);
  }
  const fileName = `nextest-${framework}-test-script.${language === "typescript" ? "ts" : language === "javascript" ? "js" : language === "python" ? "py" : language === "java" ? "java" : language === "csharp" ? "cs" : "txt"}`;

  return {
    script,
    framework,
    language,
    fileName,
    testCases,
  };
}
