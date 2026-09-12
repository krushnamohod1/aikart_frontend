"use client";

import Link from "next/link";
import { useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

type AgentData = {
  key: string;
  name: string;
  provider: string;
  rating: number;
  reviewsCount: number;
  price: string;
  priceSuffix: string;
  tags: string[];
  shortDescription: string;
  longDescription: string;
  images: string[];
  accent: "primary" | "secondary" | "tertiary";
  technologies: string[];
  sellerDetails: {
    name: string;
    joinedDate: string;
    totalSales: number;
    location: string;
    responseTime: string;
    bio: string;
    avatarInitial: string;
  };
  features: string[];
  useCases: string[];
  version: string;
  lastUpdated: string;
};

const AGENTS: Record<string, AgentData> = {
  flux: {
    key: "flux",
    name: "Flux Architect v4",
    provider: "Flux Labs",
    rating: 4.9,
    reviewsCount: 142,
    price: "$49",
    priceSuffix: "/mo",
    tags: ["#coding", "#productivity"],
    shortDescription:
      "Autonomous coding assistant capable of managing entire CI/CD pipelines and complex refactoring tasks across 12 languages.",
    longDescription:
      "Flux Architect v4 is built for engineering teams that move fast. It understands repository topology, proposes safe refactors, and orchestrates CI/CD with practical guardrails for production.",
    images: ["/agent-gallery/flux/1.png", "/agent-gallery/flux/2.png", "/agent-gallery/flux/3.png"],
    accent: "primary",
    technologies: ["Python", "TensorFlow", "React", "Docker", "Kubernetes", "GraphQL"],
    sellerDetails: {
      name: "Flux Labs",
      joinedDate: "Mar 2024",
      totalSales: 4890,
      location: "San Francisco, CA",
      responseTime: "< 1 hour",
      bio: "Flux Labs is a pioneer in AI-driven developer tools.",
      avatarInitial: "F",
    },
    features: ["Automated Code Refactoring", "CI/CD Pipeline Orchestration", "Multi-language Support (12+)", "Security Vulnerability Scanning"],
    useCases: ["Modernizing legacy codebases", "Accelerating sprint velocity", "Automating code quality checks"],
    version: "4.2.1",
    lastUpdated: "April 2, 2026",
  },
  insight: {
    key: "insight",
    name: "InsightStream Pro",
    provider: "Insight Dynamics",
    rating: 4.8,
    reviewsCount: 89,
    price: "$129",
    priceSuffix: "/mo",
    tags: ["#analytics", "#finance"],
    shortDescription: "Real-time market sentiment analysis and predictive financial modeling.",
    longDescription: "InsightStream Pro continuously ingests market, social, and macro signals to generate high-confidence forecasting scenarios.",
    images: ["/agent-gallery/insight/1.png", "/agent-gallery/insight/2.png", "/agent-gallery/insight/3.png"],
    accent: "secondary",
    technologies: ["PyTorch", "Apache Kafka", "Redis", "Elasticsearch", "PostgreSQL"],
    sellerDetails: {
      name: "Insight Dynamics",
      joinedDate: "Nov 2023",
      totalSales: 2105,
      location: "New York, NY",
      responseTime: "1-2 hours",
      bio: "Leading providers of predictive analytics and financial modeling tools.",
      avatarInitial: "I",
    },
    features: ["Real-time Sentiment Scoring", "Predictive Asset Modeling", "Custom Alert Triggers"],
    useCases: ["Hedge fund quantitative modeling", "Algorithmic trading signal generation"],
    version: "2.1.0",
    lastUpdated: "March 15, 2026",
  },
  omni: {
    key: "omni",
    name: "Omni-Support AI",
    provider: "Omni CX Studio",
    rating: 5.0,
    reviewsCount: 304,
    price: "Free",
    priceSuffix: "",
    tags: ["#support", "#crm"],
    shortDescription: "24/7 empathetic customer service agent that integrates with Zendesk, Slack, and Salesforce.",
    longDescription: "Omni-Support AI unifies customer channels into one intelligent support engine.",
    images: ["/agent-gallery/omni/1.png", "/agent-gallery/omni/2.png", "/agent-gallery/omni/3.png"],
    accent: "tertiary",
    technologies: ["Node.js", "GPT-4 Turbo", "Zendesk API", "PostgreSQL", "LangChain"],
    sellerDetails: {
      name: "Omni CX Studio",
      joinedDate: "Jan 2025",
      totalSales: 8400,
      location: "London, UK",
      responseTime: "< 30 mins",
      bio: "Omni CX Studio specializes in customer experience automation.",
      avatarInitial: "O",
    },
    features: ["Multi-channel Chat Orchestration", "Intelligent Ticket Escalation", "Multilingual Support (40+ languages)"],
    useCases: ["Scaling E-commerce customer support", "SaaS product onboarding"],
    version: "1.0.5",
    lastUpdated: "April 1, 2026",
  },
};

function AgentDetailInner() {
  const params = useSearchParams();
  const selectedKey = params.get("agent") ?? "flux";
  const agent = useMemo(() => AGENTS[selectedKey] ?? AGENTS.flux, [selectedKey]);
  const [activeImage, setActiveImage] = useState(0);

  const accentBorder = agent.accent === "primary" ? "border-primary" : agent.accent === "secondary" ? "border-secondary" : "border-tertiary";
  const accentText = agent.accent === "primary" ? "text-primary" : agent.accent === "secondary" ? "text-secondary" : "text-tertiary";
  const accentBg = agent.accent === "primary" ? "bg-primary" : agent.accent === "secondary" ? "bg-secondary" : "bg-tertiary";

  return (
    <main className="pt-28 pb-20 px-4 md:px-12 max-w-7xl mx-auto">

      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 mb-12">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-24 h-24 rounded-2xl bg-surface-container-highest flex items-center justify-center p-4 shadow-xl border border-outline-variant/10">
            <span className={`material-symbols-outlined text-5xl ${accentText}`}>smart_toy</span>
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold font-headline tracking-tighter text-on-surface mb-2">{agent.name}</h1>
            <p className="text-on-surface-variant flex flex-wrap items-center gap-2">
              <span>by</span>
              <span className={`${accentText} font-semibold cursor-pointer`}>{agent.provider}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1 bg-surface-container-high px-2 py-1 rounded-md">
                <span className="material-symbols-outlined text-sm text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="font-bold text-on-surface">{agent.rating}</span>
                <span className="text-xs text-on-surface-variant ml-1">({agent.reviewsCount} reviews)</span>
              </span>
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container border border-outline-variant/30 hover:bg-surface-bright transition-colors text-sm font-semibold">
            <span className="material-symbols-outlined text-[18px]">share</span>Share
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container border border-outline-variant/30 hover:bg-surface-bright transition-colors text-sm font-semibold">
            <span className="material-symbols-outlined text-[18px]">favorite</span>Wishlist
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        <div className="lg:w-[65%] space-y-16">
          <div className="relative rounded-3xl overflow-hidden aspect-[16/9] bg-surface-container-low shadow-2xl group border border-outline-variant/10">
            <img alt={`${agent.name} preview`} className="w-full h-full object-cover transition-transform duration-700" src={agent.images[activeImage]} />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent p-6 flex flex-col justify-end h-1/2">
              <div className="flex gap-4">
                {agent.images.map((image, index) => (
                  <button
                    key={image}
                    className={`w-20 h-14 md:w-28 md:h-16 rounded-xl overflow-hidden transition-all duration-300 cursor-pointer flex-shrink-0 ${
                      index === activeImage ? `border-2 ${accentBorder} shadow-lg ring-2 ring-background scale-105 z-10` : "opacity-60 hover:opacity-100 hover:scale-105 border border-outline-variant/40"
                    }`}
                    onClick={() => setActiveImage(index)}
                  >
                    <img alt={`thumbnail ${index + 1}`} className="w-full h-full object-cover" src={image} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-on-surface-variant font-semibold text-sm mr-2">Categories:</span>
            {agent.tags.map((tag) => (
              <span key={tag} className={`px-4 py-1.5 rounded-full text-xs font-semibold ${accentText} bg-surface-container-highest border border-outline-variant/20`}>{tag}</span>
            ))}
          </div>

          <section className="space-y-6">
            <h2 className={`text-2xl md:text-3xl font-bold font-headline border-l-4 ${accentBorder} pl-4 text-on-surface`}>About this Agent</h2>
            <div className="text-on-surface-variant leading-relaxed space-y-6 text-lg bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10">
              <p className="font-medium text-on-surface">{agent.shortDescription}</p>
              <p>{agent.longDescription}</p>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className={`text-2xl md:text-3xl font-bold font-headline border-l-4 ${accentBorder} pl-4 text-on-surface`}>Technologies Stack</h2>
            <div className="flex flex-wrap gap-3">
              {agent.technologies.map(tech => (
                <div key={tech} className="flex items-center gap-2 bg-surface-container px-4 py-3 rounded-xl border border-outline-variant/20 hover:border-outline-variant/50 transition-colors">
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">terminal</span>
                  <span className="font-semibold text-on-surface text-sm">{tech}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <section className="space-y-6">
              <h2 className={`text-2xl font-bold font-headline border-l-4 ${accentBorder} pl-4 text-on-surface`}>Key Capabilities</h2>
              <ul className="space-y-4">
                {agent.features.map(feature => (
                  <li key={feature} className="flex items-start gap-3">
                    <span className={`material-symbols-outlined text-xl ${accentText}`}>check_circle</span>
                    <span className="text-on-surface-variant font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="space-y-6">
              <h2 className={`text-2xl font-bold font-headline border-l-4 ${accentBorder} pl-4 text-on-surface`}>Primary Use Cases</h2>
              <ul className="space-y-4">
                {agent.useCases.map(useCase => (
                  <li key={useCase} className="flex items-start gap-3 bg-surface-container-low p-3 rounded-xl border border-outline-variant/10">
                    <span className="material-symbols-outlined text-xl text-secondary">lightbulb</span>
                    <span className="text-on-surface-variant text-sm font-medium">{useCase}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="space-y-6 pt-8 border-t border-outline-variant/10">
            <h2 className={`text-2xl md:text-3xl font-bold font-headline border-l-4 ${accentBorder} pl-4 text-on-surface`}>Provider Information</h2>
            <div className="p-8 rounded-3xl bg-surface-container-low border border-outline-variant/20 flex flex-col md:flex-row gap-8 items-start">
              <div className={`w-24 h-24 rounded-full ${accentBg} text-on-primary flex items-center justify-center text-4xl font-bold shadow-lg shrink-0`}>{agent.sellerDetails.avatarInitial}</div>
              <div className="space-y-4 flex-1">
                <div>
                  <h3 className="text-2xl font-bold text-on-surface mb-1 flex items-center gap-2">
                    {agent.sellerDetails.name}
                    <span className="material-symbols-outlined text-primary text-xl">verified</span>
                  </h3>
                  <p className="text-on-surface-variant text-sm flex gap-4">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">location_on</span> {agent.sellerDetails.location}</span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">calendar_today</span> Joined {agent.sellerDetails.joinedDate}</span>
                  </p>
                </div>
                <p className="text-on-surface-variant leading-relaxed bg-background/50 p-4 rounded-xl border border-outline-variant/10">{agent.sellerDetails.bio}</p>
                <div className="flex gap-6 mt-4">
                  <div className="flex flex-col">
                    <span className="text-on-surface font-bold text-xl">{agent.sellerDetails.totalSales.toLocaleString()}</span>
                    <span className="text-on-surface-variant text-xs uppercase tracking-wider">Total Sales</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-on-surface font-bold text-xl">{agent.sellerDetails.responseTime}</span>
                    <span className="text-on-surface-variant text-xs uppercase tracking-wider">Avg Response Time</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:w-[35%] relative">
          <div className="sticky top-28 space-y-6">
            <div className="glass-panel p-8 rounded-3xl border border-outline-variant/20 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 z-10">
                <span className={`${accentText} text-[10px] font-bold px-3 py-1 rounded-full bg-surface-container-highest uppercase tracking-widest`}>Available Now</span>
              </div>
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 blur-[80px] rounded-full pointer-events-none" />
              <div className="mb-8 relative z-10">
                <span className="text-on-surface-variant text-sm uppercase tracking-widest font-semibold">Buying / Rental Price</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-5xl lg:text-6xl font-black font-headline text-on-surface tracking-tighter">{agent.price}</span>
                  {agent.priceSuffix && <span className="text-on-surface-variant font-medium text-lg">{agent.priceSuffix}</span>}
                </div>
              </div>
              <div className="space-y-4 relative z-10">
                <Link href="/auth">
                  <button className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold text-lg hover:shadow-[0_0_20px_rgba(186,158,255,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                    <span>Buy/Rent this agent</span>
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </Link>
                <button className="w-full py-4 px-6 rounded-xl border-2 border-outline-variant/30 text-on-surface font-bold hover:bg-surface-bright transition-all flex items-center justify-center gap-2 group">
                  <span className="material-symbols-outlined group-hover:text-primary transition-colors">chat_bubble</span>
                  <span>Contact Provider</span>
                </button>
              </div>
              <div className="mt-6 flex items-center gap-3 text-xs text-on-surface-variant justify-center">
                <span className="material-symbols-outlined text-sm">lock</span>
                <span>Secure transaction backed by aiKart</span>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/20">
              <h3 className="font-headline font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">info</span>Agent Metadata
              </h3>
              <div className="space-y-3 text-sm">
                {[
                  { label: "Current Version", value: agent.version },
                  { label: "Last Updated", value: agent.lastUpdated },
                  { label: "Deployment", value: "Cloud, On-Premise, Hybrid" },
                  { label: "Support SLA", value: "Premium (24/7)" },
                ].map(r => (
                  <div key={r.label} className="flex justify-between items-center py-2 border-b border-outline-variant/10 last:border-0">
                    <span className="text-on-surface-variant">{r.label}</span>
                    <span className="font-semibold text-on-surface text-right">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function AgentDetailClient() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <AgentDetailInner />
    </Suspense>
  );
}
