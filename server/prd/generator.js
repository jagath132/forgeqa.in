import { generateWithGeminiRaw, generateWithGeminiStream } from '../ai/gemini.js';
import { generateWithOpenAI, generateWithOpenAIStream } from '../ai/openai.js';

export function buildPrdPromptFromText({ productName, moduleName, details }) {
  const name = productName ? productName.trim() : 'Software Application';
  const mod = moduleName ? moduleName.trim() : 'Core Features';

  return `You are a Principal Product Manager and QA Architect.
Generate a comprehensive, production-ready Product Requirements Document (PRD) formatted in clean GitHub-flavored Markdown for:
Product Name: ${name}
Target Module / Feature: ${mod}

User Provided Details & Specifications:
"""
${details.trim()}
"""

Structure the PRD strictly using the following Markdown sections and headers:
# Product Requirements Document: ${name} - ${mod}

## 1. Executive Summary & Objective
- **Problem Statement**: What problem does this solve?
- **Proposed Solution**: High-level overview.
- **Key Value Proposition**: Why this matters for the business & users.
- **Target Audience**: Primary user groups.

## 2. User Personas & Roles
Define at least 2-3 user personas with goals, pain points, and access permissions.

## 3. Scope & Feature Inventory
A detailed breakdown of all features and modules included (and explicitly Out of Scope):
- Feature ID, Name, Description, and Priority (P0/P1/P2).

## 4. User Journeys & Workflow Diagrams
Step-by-step end-to-end flows for the core scenarios:
1. Primary / Happy Path flow (step-by-step)
2. Alternative / Error flows
3. Edge Case workflows

## 5. Functional Requirements
Detailed system requirements for every sub-feature:
- **Inputs & Validations**: Field requirements, character limits, formats.
- **System Behavior & Business Rules**: State transitions, calculations, API triggers.
- **Expected Outputs**: UI changes, notifications, database records created.

## 6. Non-Functional Requirements (NFRs)
- **Performance**: Response times, concurrency, throughput.
- **Security & Data Privacy**: Authentication, authorization, encryption, sanitization.
- **Reliability & Availability**: Error recovery, uptime expectations.
- **Accessibility (a11y)**: WCAG compliance, screen reader support, keyboard navigation.

## 7. API & Data Model Specifications
- High-level data entities / schemas.
- Core endpoints (Method, Path, Request payload, Expected response).

## 8. Open Questions, Assumptions & QA Notes
- Known risks and technical assumptions.
- Recommended automated testing focal points for QA teams.

Make the output exhaustive, deeply technical, professional, and directly actionable for software engineers and QA automation testers. Do not use generic placeholders. Output raw Markdown directly.`;
}

export function buildPrdPromptFromCrawl(crawlReport) {
  const url = crawlReport.targetUrl;
  const focus = crawlReport.focusModule || 'Entire Application';
  const pagesSummary = (crawlReport.pages || [])
    .map(
      (p, i) =>
        `Page ${i + 1}: ${p.title} (${p.url})
Headings: ${(p.headings || []).join(' | ') || 'None'}
Buttons & Actions: ${(p.buttons || []).join(', ') || 'None'}
Forms: ${(p.forms || []).map((f) => f.inputs.map((inp) => inp.name || inp.placeholder || inp.type).join(', ')).join('; ') || 'None'}
Page Content Summary: ${p.snippet ? p.snippet.slice(0, 500) : 'N/A'}`
    )
    .join('\n\n---\n\n');

  return `You are a Principal Product Manager and QA Architect.
Analyze the following automated web application crawl report extracted from live app exploration and generate a complete, structured Product Requirements Document (PRD) in clean Markdown.

Application URL: ${url}
Focus Area: ${focus}
Total Explored Pages: ${crawlReport.totalPagesExplored}

Crawl Discovery Details:
"""
${pagesSummary}
"""

Structure the PRD strictly using the following Markdown sections:
# Product Requirements Document: ${url}

## 1. Executive Summary & App Overview
- **System Description**: Discovered application domain and core function.
- **Target Audience & Use Cases**: Inferred user personas.

## 2. Information Architecture & Discovered Routes
- Map out the sitemap, navigational hierarchy, and routing structure discovered.

## 3. Discovered Feature Inventory
- Categorized list of all detected modules, forms, modals, actions, and data views with priority levels.

## 4. Key User Flows
- Discovered authentication flows, form submissions, navigation paths, and interactions.

## 5. Functional Requirements & Field-Level Specifications
- Extracted form fields, validation requirements, button behaviors, and interaction states.

## 6. Non-Functional & QA Verification Matrix
- Security (Auth protection, input sanitation).
- Performance & Accessibility observations.
- Recommended Automated Test Scenarios for QA Engineers (Playwright/Cypress/Selenium).

## 7. Assumptions & Unmapped Areas
- Areas requiring deeper exploration or backend verification.

Generate a comprehensive, professional PRD in clean Markdown. Output raw Markdown directly.`;
}

export async function generateWithClaudeStream({
  apiKey,
  prompt,
  model = 'claude-3-5-sonnet-20241022',
  onToken,
}) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model || 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const error = new Error(
      data.error?.message || `Claude streaming request failed (${response.status})`
    );
    error.statusCode = response.status;
    throw error;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  let isStreaming = true;
  while (isStreaming) {
    const { done, value } = await reader.read();
    if (done) {
      isStreaming = false;
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.slice(6).trim();
        if (!dataStr || dataStr === '[DONE]') continue;
        try {
          const event = JSON.parse(dataStr);
          if (event.type === 'content_block_delta' && event.delta?.text) {
            onToken(event.delta.text);
          }
        } catch {
          // ignore unparseable
        }
      }
    }
  }
}

export async function generatePrdStream({ apiKey, provider = 'gemini', model, prompt, onToken }) {
  if (provider === 'gemini') {
    return generateWithGeminiStream({
      apiKey,
      prompt,
      model,
      onToken,
    });
  }

  if (provider === 'claude') {
    return generateWithClaudeStream({
      apiKey,
      prompt,
      model: model || 'claude-3-5-sonnet-20241022',
      onToken,
    });
  }

  const endpoint =
    provider === 'openrouter'
      ? 'https://openrouter.ai/api/v1/chat/completions'
      : provider === 'groq'
        ? 'https://api.groq.com/openai/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';

  const defaultModel =
    model ||
    (provider === 'groq'
      ? 'llama-3.1-8b-instant'
      : provider === 'openrouter'
        ? 'google/gemini-2.0-flash-exp:free'
        : 'gpt-4o-mini');

  return generateWithOpenAIStream({
    apiKey,
    prompt,
    model: defaultModel,
    endpoint,
    onToken,
  });
}
