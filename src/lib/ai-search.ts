// Types only — the actual runAISearch() function (calls the Gemini API and
// the DB) stays backend-only; the frontend gets AI search results already
// computed, via GET /api/pages/explore. Kept at this same import path
// ("@/lib/ai-search") so components that only ever imported these types
// (ExploreClientShell.tsx) need no import-path change.
export type AgentContext = {
  id: string;
  title: string;
  tagline: string;
  category: string;
  description: string;
};

export type DeepWebResult = {
  name: string;
  fit: string;
};

export type AISearchResult = {
  agentIds: string[];
  aiMessage: string;
  deepWebResults: DeepWebResult[];
};
