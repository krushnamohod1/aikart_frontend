// Types only — the actual getHomeData() function (queries the DB) stays
// backend-only; the frontend gets homepage data already computed, via
// GET /api/pages/home. Kept at this same import path ("@/lib/home-data") so
// HomeClient.tsx / HomeClientMobile.tsx, which only ever imported this type,
// need no import-path change.
export type HomeAgent = {
  id: string;
  title: string;
  tagline: string | null;
  category: string;
  listing_type: string | null;
  pricing_model: string | null;
  price: string | null;
  logo_url: string | null;
  provider_name: string | null;
  runnable: boolean;
};

export type HomeCategory = { category: string; count: number };

export type HomeData = {
  featured: HomeAgent[];
  trending: HomeAgent[];
  categories: HomeCategory[];
  stats: { agents: number; categories: number; providers: number };
};
