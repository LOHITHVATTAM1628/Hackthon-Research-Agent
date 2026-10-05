/**
 * Centralized Tavily Search Client
 * Executes fast, high-intent web searches using TAVILY_API_KEY.
 */

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
  published_date?: string;
}

export interface TavilySearchResponse {
  query: string;
  results: TavilySearchResult[];
}

export async function searchTavily(
  query: string,
  maxResults: number = 3
): Promise<TavilySearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey || apiKey.includes('your-') || apiKey.includes('placeholder')) {
    console.warn('[searchTavily] TAVILY_API_KEY not set or placeholder. Returning empty search results.');
    return [];
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6500);

    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'basic',
        include_answer: false,
        include_images: false,
        max_results: maxResults,
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Tavily API responded with ${res.status}:`, errText);
      return [];
    }

    const data = await res.json();
    const results: TavilySearchResult[] = (data.results || []).map((r: {
      title?: string;
      url?: string;
      content?: string;
      score?: number;
      published_date?: string;
    }) => ({
      title: r.title || 'Untitled Source',
      url: r.url || '',
      content: r.content || '',
      score: typeof r.score === 'number' ? r.score : 0.75,
      published_date: r.published_date || new Date().toISOString().split('T')[0],
    }));

    return results;
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.warn(`Tavily search timeout or error for query "${query}":`, error.message);
    return [];
  }
}

