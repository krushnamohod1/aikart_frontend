// Shared Google Analytics 4 event tracking helper
// Safely invokes window.gtag on the client side, no-ops during Server-Side Rendering (SSR).
export function trackEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
    (window as any).gtag("event", eventName, params);
  }
}
