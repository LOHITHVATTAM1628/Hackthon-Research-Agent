/**
 * Centralized Groq LLM Client
 * Utilizes GROQ_API_KEY with model fallback and resilient retry logic.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqCallOptions {
  temperature?: number;
  max_tokens?: number;
  jsonMode?: boolean;
}

const CANDIDATE_MODELS = [
  process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b',
  'llama-3.3-70b-versatile',
  'llama-3.1-70b-versatile',
];

export async function callGroq(
  messages: ChatMessage[],
  options: GroqCallOptions = {}
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured in environment variables');
  }

  const {
    temperature = 0.3,
    max_tokens = parseInt(process.env.GROQ_MAX_TOKENS || '750', 10),
    jsonMode = false,
  } = options;

  let lastError: Error | null = null;

  // Try candidate models in order of priority
  const triedModels = new Set<string>();

  for (const model of CANDIDATE_MODELS) {
    if (triedModels.has(model)) continue;
    triedModels.add(model);

    try {
      const payload: Record<string, unknown> = {
        model,
        messages,
        temperature,
        max_tokens,
      };

      if (jsonMode) {
        payload.response_format = { type: 'json_object' };
      }

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        // If 404 (model not found) or 503 (rate limited / over capacity), try next candidate
        if (res.status === 404 || res.status === 503 || res.status === 400) {
          console.warn(`Groq model ${model} failed with ${res.status}: ${errorText.substring(0, 150)}. Trying fallback...`);
          lastError = new Error(`Groq ${model} error (${res.status}): ${errorText}`);
          continue;
        }
        throw new Error(`Groq API error (${res.status}): ${errorText}`);
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content !== 'string') {
        throw new Error('Groq returned unexpected response format');
      }

      return content.trim();
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      lastError = error;
      console.warn(`Error invoking Groq with model ${model}:`, error.message);
    }
  }

  throw lastError || new Error('Failed to generate response from any Groq model');
}

export async function* streamGroqTokens(
  messages: ChatMessage[],
  options: GroqCallOptions = {}
): AsyncGenerator<string, void, unknown> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.includes('your-') || apiKey.includes('placeholder')) {
    const fallbackText =
      'Operating in offline/demo mode. Live GROQ_API_KEY required for real-time dynamic generation. Grounding analysis based on available context and retrieved telemetry.';
    for (const word of fallbackText.split(' ')) {
      yield word + ' ';
      await new Promise((r) => setTimeout(r, 20));
    }
    return;
  }

  const {
    temperature = 0.3,
    max_tokens = parseInt(process.env.GROQ_MAX_TOKENS || '1500', 10),
  } = options;

  let streamSucceeded = false;
  for (const model of CANDIDATE_MODELS) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens,
          stream: true,
        }),
      });

      if (!res.ok) {
        continue;
      }

      if (!res.body) continue;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          const dataStr = trimmed.replace(/^data:\s*/, '');
          if (dataStr === '[DONE]') {
            streamSucceeded = true;
            return;
          }
          try {
            const parsed = JSON.parse(dataStr);
            const token = parsed.choices?.[0]?.delta?.content;
            if (token) {
              streamSucceeded = true;
              yield token;
            }
          } catch {
            // chunk json parse pass
          }
        }
      }

      if (streamSucceeded) return;
    } catch (err) {
      console.warn(`Groq stream failed with model ${model}:`, err);
    }
  }

  // Fallback to non-streaming if stream connection closed
  try {
    const full = await callGroq(messages, options);
    for (const chunk of full.split(' ')) {
      yield chunk + ' ';
      await new Promise((r) => setTimeout(r, 15));
    }
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    yield `\n\n*Inference error*: ${error.message}. Please verify your GROQ_API_KEY.`;
  }
}
