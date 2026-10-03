import {
  buildScriptPrompt,
  buildFrameworkPomPrompt,
  buildFrameworkSpecPrompt,
  buildFrameworkApiPrompt,
  buildPlaywrightPomPrompt,
  buildPlaywrightSpecPrompt,
  buildPlaywrightHybridApiPrompt,
  buildAiDiagnosticPrompt,
} from './prompts.js';
import { buildFrameworkScaffold, buildPlaywrightScaffold } from './frameworkScaffold.js';
import { generateWithGeminiRaw } from '../ai/gemini.js';
import { generateWithOpenAI } from '../ai/openai.js';
import { resolveDeprecated, getRegistryDefault } from '../ai/modelRegistry.js';

const defaultViewport = { width: 1280, height: 720 };
const defaultOptions = {
  headless: true,
  viewport: defaultViewport,
};

async function callAi({ apiKey, prompt, provider = 'gemini', model }) {
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    throw new Error(
      `Missing ${provider} API key. Please configure it in Settings or your environment.`
    );
  }
  if (provider === 'gemini') {
    return await generateWithGeminiRaw({ apiKey, prompt, model });
  } else if (provider === 'openai' || provider === 'opencode') {
    return await generateWithOpenAI({
      apiKey,
      prompt,
      model: model || 'gpt-4o-mini',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      provider,
    });
  } else if (provider === 'openrouter') {
    return await generateWithOpenAI({
      apiKey,
      prompt,
      model: model || 'google/gemini-2.0-flash-exp:free',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      provider,
    });
  } else if (provider === 'groq') {
    const baseModel = model || getRegistryDefault('groq');
    const groqModel = resolveDeprecated('groq', baseModel) ?? baseModel;
    return await generateWithOpenAI({
      apiKey,
      prompt,
      model: groqModel,
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      provider,
    });
  } else {
    throw new Error(`${provider} support is not implemented yet.`);
  }
}

function cleanAiCode(raw) {
  if (!raw) return '';
  // Strip markdown code fences if present
  return raw
    .replace(/^```[a-zA-Z]*\n/gm, '')
    .replace(/```$/gm, '')
    .trim();
}

export async function generateTestScript({
  apiKey,
  provider = 'gemini',
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

  const rawScript = await callAi({ apiKey, prompt, provider, model });
  const script = cleanAiCode(rawScript);

  const fileName = `forgeqa-${framework}-test-script.${language === 'typescript' ? 'ts' : language === 'javascript' ? 'js' : language === 'python' ? 'py' : language === 'java' ? 'java' : language === 'csharp' ? 'cs' : 'txt'}`;

  return {
    script,
    framework,
    language,
    fileName,
    testCases,
  };
}

export async function generateFrameworkProject({
  apiKey,
  provider = 'gemini',
  framework = 'playwright',
  language = 'typescript',
  targetUrl = 'https://example.com',
  testCases = [],
  options = {},
  model,
}) {
  const normFw = (framework || 'playwright').toLowerCase();
  const normLang = (language || 'typescript').toLowerCase();

  const normalizedOptions = {
    ...defaultOptions,
    ...options,
    viewport: {
      ...defaultViewport,
      ...(options?.viewport ?? {}),
    },
  };

  let aiGeneratedPom = '';
  let aiGeneratedSpec = '';
  let aiGeneratedApiSpec = '';

  try {
    const pomPrompt = buildFrameworkPomPrompt({
      framework: normFw,
      language: normLang,
      targetUrl,
      testCases,
    });
    const rawPom = await callAi({ apiKey, prompt: pomPrompt, provider, model });
    aiGeneratedPom = cleanAiCode(rawPom);
  } catch (err) {
    console.warn(
      'Warning: AI POM generation failed, falling back to scaffold default:',
      err?.message
    );
  }

  try {
    const specPrompt = buildFrameworkSpecPrompt({
      framework: normFw,
      language: normLang,
      targetUrl,
      testCases,
    });
    const rawSpec = await callAi({ apiKey, prompt: specPrompt, provider, model });
    aiGeneratedSpec = cleanAiCode(rawSpec);
  } catch (err) {
    console.warn(
      'Warning: AI Spec generation failed, falling back to scaffold default:',
      err?.message
    );
  }

  try {
    const apiPrompt = buildFrameworkApiPrompt({
      framework: normFw,
      language: normLang,
      targetUrl,
      testCases,
    });
    const rawApi = await callAi({ apiKey, prompt: apiPrompt, provider, model });
    aiGeneratedApiSpec = cleanAiCode(rawApi);
  } catch (err) {
    console.warn(
      'Warning: AI API spec generation failed, falling back to scaffold default:',
      err?.message
    );
  }

  const files = buildFrameworkScaffold({
    framework: normFw,
    language: normLang,
    testCases,
    targetUrl,
    options: normalizedOptions,
    aiGeneratedPom,
    aiGeneratedSpec,
    aiGeneratedApiSpec,
  });

  return {
    projectName: options.projectName || `forge-${normFw}-framework`,
    framework: normFw,
    language: normLang,
    targetUrl,
    testCasesCount: testCases.length,
    files,
  };
}

export const generatePlaywrightFramework = (args) =>
  generateFrameworkProject({ framework: 'playwright', language: 'typescript', ...args });

export async function diagnoseTestFailure({
  apiKey,
  provider = 'gemini',
  errorLog,
  failedLocator,
  targetUrl,
  testCaseSummary,
  model,
}) {
  const prompt = buildAiDiagnosticPrompt({
    errorLog,
    failedLocator,
    targetUrl,
    testCaseSummary,
  });

  const rawDiagnosis = await callAi({ apiKey, prompt, provider, model });
  const cleaned = cleanAiCode(rawDiagnosis);

  try {
    return JSON.parse(cleaned);
  } catch {
    // Fallback parser if JSON has surrounding characters
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return {
      rootCause: cleaned.slice(0, 200),
      category: 'TIMED_OUT',
      isFlaky: false,
      confidenceScore: 70,
      healedLocator: '',
      suggestedFix: cleaned,
      preventionAdvice: 'Ensure elements are visible and stable before interactions.',
    };
  }
}
