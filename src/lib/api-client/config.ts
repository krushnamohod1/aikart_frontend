// Shared backend base URL, used by every frontend fetch() call that used to
// be a relative "/api/..." path when frontend and backend were one app.
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
