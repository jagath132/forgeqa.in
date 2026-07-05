import { buildRegressionPrompt } from "./prompts.js";
import { generateWithGemini, parseSafeJson } from "../ai/gemini.js";
import { generateWithOpenAI } from "../ai/openai.js";

export async function generateRegressionTestCases({
  apiKey,
  provider = "gemini",
  requirement,
  existingTestCases,
  platform,
  model,
}) {
  const prompt = buildRegressionPrompt({ requirement, existingTestCases, platform });

  let result;
  if (provider === "gemini") {
    result = await generateWithGemini({ apiKey, prompt, model });
  } else if (provider === "openai" || provider === "openrouter" || provider === "opencode" || provider === "groq") {
    const endpoint =
      provider === "openrouter"
        ? "https://openrouter.ai/api/v1/chat/completions"
        : provider === "groq"
        ? "https://api.groq.com/openai/v1/chat/completions"
        : "https://api.openai.com/v1/chat/completions";
    const responseText = await generateWithOpenAI({ apiKey, prompt, model, endpoint, provider });
    result = parseSafeJson(responseText);
  } else {
    throw new Error(`${provider} support is not implemented yet.`);
  }

  return result;
}
