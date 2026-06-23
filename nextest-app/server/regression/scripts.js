import { buildRegressionScriptPrompt } from "./prompts.js";
import { generateWithGeminiRaw } from "../ai/gemini.js";
import { generateWithOpenAI } from "../ai/openai.js";

export async function generateRegressionScripts({
  apiKey,
  provider = "gemini",
  testCases,
  platform,
  framework,
  language,
  targetUrl,
  model,
}) {
  const prompt = buildRegressionScriptPrompt({ testCases, platform, framework, language, targetUrl });

  let script;
  if (provider === "gemini") {
    script = await generateWithGeminiRaw({ apiKey, prompt, model });
  } else if (provider === "openai" || provider === "opencode") {
    script = await generateWithOpenAI({
      apiKey, prompt,
      model: model || "gpt-4o-mini",
      endpoint: "https://api.openai.com/v1/chat/completions", provider,
    });
  } else if (provider === "openrouter") {
    script = await generateWithOpenAI({
      apiKey, prompt,
      model: model || "google/gemini-2.0-flash-exp:free",
      endpoint: "https://openrouter.ai/api/v1/chat/completions", provider,
    });
  } else if (provider === "groq") {
    script = await generateWithOpenAI({
      apiKey, prompt,
      model: model || "llama-3.1-8b-instant",
      endpoint: "https://api.groq.com/openai/v1/chat/completions", provider,
    });
  } else {
    throw new Error(`${provider} support is not implemented yet.`);
  }

  const ext = language === "typescript" ? "ts" : language === "javascript" ? "js" : language === "python" ? "py" : language === "java" ? "java" : language === "csharp" ? "cs" : "txt";
  const fileName = `regression-${framework}-${platform}.${ext}`;

  return { script, framework, language, fileName, testCases };
}
