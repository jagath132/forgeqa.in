export async function generateWithOpenAIStream({ apiKey, prompt, model = "gpt-4o-mini", endpoint = "https://api.openai.com/v1/chat/completions", onToken }) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "You are a helpful assistant. Answer the user's request in the requested format." },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 4096,
      stream: true,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const error = new Error(data.error?.message || "OpenAI streaming request failed.");
    error.statusCode = response.status;
    throw error;
  }

  const reader = response.body.getReader();
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
          const content = data.choices?.[0]?.delta?.content || data.choices?.[0]?.text || "";
          if (content) onToken(content);
        } catch {
          // skip unparseable chunks
        }
      }
    }
  }
}

export async function generateWithOpenAI({
  apiKey,
  prompt,
  model = "gpt-4.1-mini",
  endpoint = "https://api.openai.com/v1/chat/completions",
  _provider = "openai",
}) {
  const headers = {
    "Content-Type": "application/json",
  };

  headers["Authorization"] = `Bearer ${apiKey}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant. Answer the user's request in the requested format.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 4096,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    const message = data.error?.message || "OpenAI request failed.";
    const error = new Error(message);
    error.statusCode = response.status;
    throw error;
  }

  const text = data.choices
    ?.map((choice) => choice.message?.content || "")
    .join("")
    .trim();

  if (!text) {
    const error = new Error("OpenAI response contained no text.");
    error.statusCode = 502;
    throw error;
  }

  return text;
}
