"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateFullProfile } from "@/lib/api-client/profile";

const COUNTRIES = [
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
];

const PRESET_LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Mandarin",
  "Hindi",
  "Japanese",
  "Portuguese",
  "Arabic",
];

const PRESET_SKILLS = [
  "Large Language Models (LLMs)",
  "LangChain / LlamaIndex",
  "Autonomous Agents",
  "Python & PyTorch",
  "Computer Vision",
  "NLP & Text Processing",
  "Fine-tuning & LoRA",
  "RAG Architecture",
  "Prompt Engineering",
  "FastAPI / Backend",
  "Next.js / React",
  "Cloud & Kubernetes",
];

type WorkExp = {
  id: string;
  role: string;
  company: string;
  duration: string;
  description: string;
};

export default function SellerProfileForm({
  userEmail,
  initialName,
  redirectTo,
}: {
  // userEmail is optional — X (Twitter) accounts have no email address
  userEmail?: string;
  initialName: string;
  // Where to send the seller after saving (set when they were bounced here
  // from a gate like /seller/new that requires a seller profile first).
  redirectTo?: string;
}) {
  const router = useRouter();

  // Form states
  const [displayName, setDisplayName] = useState(initialName || "");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("United States");
  const [city, setCity] = useState("");
  const [languages, setLanguages] = useState<string[]>(["English"]);
  const [about, setAbout] = useState("");

  // Skills
  const [skills, setSkills] = useState<string[]>([
    "Large Language Models (LLMs)",
    "Autonomous Agents",
  ]);
  const [customSkill, setCustomSkill] = useState("");

  // Work Experience
  const [experiences, setExperiences] = useState<WorkExp[]>([
    {
      id: "1",
      role: "",
      company: "",
      duration: "",
      description: "",
    },
  ]);

  // Portfolio & Social
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [langSearch, setLangSearch] = useState("");
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Mobile-only "+ Add skills" dropdown (desktop keeps the full chip list)
  const [skillDropdownOpen, setSkillDropdownOpen] = useState(false);
  const [skillSearch, setSkillSearch] = useState("");
  const skillDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
        setLangSearch("");
      }
      if (skillDropdownRef.current && !skillDropdownRef.current.contains(e.target as Node)) {
        setSkillDropdownOpen(false);
        setSkillSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const trimmedLangSearch = langSearch.trim();
  const filteredLanguages = PRESET_LANGUAGES.filter(
    (l) => !languages.includes(l) && l.toLowerCase().includes(trimmedLangSearch.toLowerCase())
  );
  const canAddCustomLanguage =
    trimmedLangSearch.length > 0 &&
    !languages.some((l) => l.toLowerCase() === trimmedLangSearch.toLowerCase()) &&
    !PRESET_LANGUAGES.some((l) => l.toLowerCase() === trimmedLangSearch.toLowerCase());

  const handleLangSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (filteredLanguages.length > 0) {
      addLanguage(filteredLanguages[0]);
      setLangSearch("");
    } else if (canAddCustomLanguage) {
      addLanguage(trimmedLangSearch);
      setLangSearch("");
    }
  };

  const addLanguage = (lang: string) => {
    if (!languages.includes(lang)) {
      setLanguages([...languages, lang]);
    }
  };

  const removeLanguage = (lang: string) => {
    setLanguages(languages.filter((l) => l !== lang));
  };

  const toggleSkill = (skill: string) => {
    if (skills.includes(skill)) {
      setSkills(skills.filter((s) => s !== skill));
    } else {
      setSkills([...skills, skill]);
    }
  };

  const addCustomSkill = (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && "key" in e && (e as React.KeyboardEvent).key !== "Enter") return;
    if (e) e.preventDefault();
    const val = customSkill.trim();
    if (!val) return;

    // If it matches an existing preset skill (case-insensitive), use that preset name
    const matchingPreset = PRESET_SKILLS.find(
      (s) => s.toLowerCase() === val.toLowerCase()
    );
    const skillToAdd = matchingPreset || val;

    if (!skills.some((s) => s.toLowerCase() === skillToAdd.toLowerCase())) {
      setSkills([...skills, skillToAdd]);
    }
    setCustomSkill("");
  };

  const trimmedSkillSearch = skillSearch.trim();
  const filteredSkills = PRESET_SKILLS.filter(
    (s) => !skills.includes(s) && s.toLowerCase().includes(trimmedSkillSearch.toLowerCase())
  );
  const canAddCustomSkill =
    trimmedSkillSearch.length > 0 &&
    !skills.some((s) => s.toLowerCase() === trimmedSkillSearch.toLowerCase()) &&
    !PRESET_SKILLS.some((s) => s.toLowerCase() === trimmedSkillSearch.toLowerCase());

  const addSkill = (skill: string) => {
    if (!skills.includes(skill)) {
      setSkills([...skills, skill]);
    }
  };

  const handleSkillSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (filteredSkills.length > 0) {
      addSkill(filteredSkills[0]);
      setSkillSearch("");
    } else if (canAddCustomSkill) {
      addSkill(trimmedSkillSearch);
      setSkillSearch("");
    }
  };

  const addExperience = () => {
    setExperiences([
      ...experiences,
      {
        id: Date.now().toString(),
        role: "",
        company: "",
        duration: "",
        description: "",
      },
    ]);
  };

  const updateExperience = (id: string, field: keyof WorkExp, val: string) => {
    setExperiences(
      experiences.map((exp) => (exp.id === id ? { ...exp, [field]: val } : exp))
    );
  };

  const removeExperience = (id: string) => {
    setExperiences(experiences.filter((exp) => exp.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError("Please enter your display name.");
      return;
    }
    if (!title.trim()) {
      setError("Please enter your professional title.");
      return;
    }
    if (!about.trim()) {
      setError("Please tell buyers about you and your solutions.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await updateFullProfile({
        fullName: displayName.trim(),
        headline: title.trim(),
        bio: about.trim(),
        location: city.trim() ? `${city.trim()}, ${location}` : location,
        website: portfolioUrl.trim(),
        github: githubUrl.trim(),
        linkedin: linkedinUrl.trim(),
        twitter: twitterUrl.trim(),
        skills,
      });
      if (res?.error) {
        setError(res.error);
        setSubmitting(false);
        return;
      }
      setSuccess(true);
      router.refresh();
      setTimeout(() => {
        router.push(redirectTo || "/seller/status");
      }, 800);
    } catch (err: any) {
      setError(err?.message || "Failed to save profile. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="seller-profile-form space-y-8 max-w-4xl mx-auto">
      <style>{`
        .seller-profile-form input[type="text"],
        .seller-profile-form input[type="url"],
        .seller-profile-form select,
        .seller-profile-form textarea,
        .spf-input {
          border-radius: 12px !important;
        }
      `}</style>
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-600">check_circle</span>
          Profile successfully created! Redirecting to seller dashboard...
        </div>
      )}

      {/* ── 1. Basic Info Card ── */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 md:p-8 shadow-sm space-y-6">
        <div className="border-b border-gray-100 pb-4">
          <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
          <p className="text-sm text-gray-500 mt-0.5">How your seller profile appears to buyers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Display Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Professional Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Autonomous Agent Architect & ML Engineer"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Country / Region</label>
            <div className="relative">
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full appearance-none px-4 py-2.5 pr-8 md:pr-12 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.name}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-2.5 md:right-5 flex items-center text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">City / State</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. San Francisco, CA"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Languages */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Languages Spoken</label>
          <div className="flex flex-wrap items-center gap-2">
            {languages.map((lang) => (
              <span
                key={lang}
                className="h-8 inline-flex items-center gap-1.5 px-3.5 rounded-full text-xs font-medium bg-blue-600 text-white shadow-sm transition-all"
              >
                <span>✓ {lang}</span>
                <button
                  type="button"
                  onClick={() => removeLanguage(lang)}
                  className="hover:bg-white/20 rounded-full w-4 h-4 inline-flex items-center justify-center text-xs ml-0.5 transition-colors cursor-pointer"
                  title={`Remove ${lang}`}
                  aria-label={`Remove ${lang}`}
                >
                  ×
                </button>
              </span>
            ))}

            {/* + Add languages dropdown */}
            <div className="relative inline-block" ref={langDropdownRef}>
              <button
                type="button"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="h-8 inline-flex items-center gap-1.5 px-3.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 border border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer leading-normal"
              >
                <span>+ Add languages</span>
                <span className="material-symbols-outlined text-[16px] leading-none select-none">
                  {langDropdownOpen ? "expand_less" : "expand_more"}
                </span>
              </button>

              <div
                className={`absolute left-0 top-full mt-1.5 w-64 bg-white rounded-xl border border-gray-200 shadow-xl z-30 origin-top-left transition-all duration-150 ease-out ${
                  langDropdownOpen
                    ? "opacity-100 scale-100 pointer-events-auto"
                    : "opacity-0 scale-95 pointer-events-none"
                }`}
              >
                {/* Search / add-other box */}
                <div className="p-2 border-b border-gray-100">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[16px] pointer-events-none">
                      search
                    </span>
                    <input
                      type="text"
                      value={langSearch}
                      onChange={(e) => setLangSearch(e.target.value)}
                      onKeyDown={handleLangSearchKeyDown}
                      placeholder="Search or add a language..."
                      className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto py-1.5">
                  {filteredLanguages.length === 0 && !canAddCustomLanguage && (
                    <div className="px-3.5 py-2 text-xs text-gray-400">
                      {PRESET_LANGUAGES.every((l) => languages.includes(l))
                        ? "All languages added"
                        : "No languages found"}
                    </div>
                  )}
                  {filteredLanguages.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => {
                        addLanguage(lang);
                        setLangSearch("");
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span>{lang}</span>
                      <span className="text-gray-400 font-bold">+</span>
                    </button>
                  ))}
                  {canAddCustomLanguage && (
                    <button
                      type="button"
                      onClick={() => {
                        addLanguage(trimmedLangSearch);
                        setLangSearch("");
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-1.5 border-t border-gray-100 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">add</span>
                      Add &quot;{trimmedLangSearch}&quot;
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            About You &amp; Your Solutions <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="Tell buyers about your background, the AI models or workflows you build, and what makes your solutions unique..."
            className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all leading-relaxed"
          />
        </div>
      </div>

      {/* ── 2. Skills & Expertise ── */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 md:p-8 shadow-sm space-y-6">
        <div className="border-b border-gray-100 pb-4">
          <h2 className="text-xl font-semibold text-gray-900">Skills &amp; Expertise</h2>
          <p className="text-sm text-gray-500 mt-0.5">Select key technical and domain capabilities</p>
        </div>

        {/* Desktop: full skill chip toggle list */}
        <div className="hidden md:flex flex-wrap gap-2.5">
          {PRESET_SKILLS.map((skill) => {
            const active = skills.includes(skill);
            return (
              <button
                type="button"
                key={skill}
                onClick={() => toggleSkill(skill)}
                className={`px-4.5 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  active
                    ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                    : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                {active ? "✓ " : "+ "}
                {skill}
              </button>
            );
          })}
          {/* Custom skills added by the user */}
          {skills
            .filter((s) => !PRESET_SKILLS.includes(s))
            .map((skill) => (
              <span
                key={skill}
                className="px-4.5 py-2 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 shadow-sm inline-flex items-center gap-1.5 transition-all"
              >
                <span>✓ {skill}</span>
                <button
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className="hover:bg-blue-200/60 rounded-full w-4 h-4 inline-flex items-center justify-center text-xs text-blue-700 transition-colors cursor-pointer ml-0.5"
                  title={`Remove ${skill}`}
                  aria-label={`Remove ${skill}`}
                >
                  ×
                </button>
              </span>
            ))}
        </div>

        {/* Mobile: single "Add skills" dropdown — selection happens entirely inside it */}
        <div className="md:hidden">
          <div className="relative inline-block w-full" ref={skillDropdownRef}>
            <button
              type="button"
              onClick={() => setSkillDropdownOpen(!skillDropdownOpen)}
              className="w-full h-11 inline-flex items-center justify-between gap-1.5 px-4 rounded-xl text-sm font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-300 transition-colors cursor-pointer"
            >
              <span className="truncate text-left">
                {skills.length === 0
                  ? "+ Add skills"
                  : `${skills.length} skill${skills.length === 1 ? "" : "s"} selected`}
              </span>
              <span
                className="material-symbols-outlined text-[18px] leading-none select-none shrink-0 transition-transform duration-200 ease-out"
                style={{ transform: skillDropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                expand_more
              </span>
            </button>

            <div
              className={`absolute left-0 top-full mt-1.5 w-full bg-white rounded-xl border border-gray-200 shadow-xl z-30 origin-top transition-all duration-200 ease-out ${
                skillDropdownOpen
                  ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
              }`}
            >
              {/* Selected skills, removable, shown inside the dropdown */}
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2.5 border-b border-gray-100">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="h-7 inline-flex items-center gap-1 px-3 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 transition-all"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className="hover:bg-blue-100 rounded-full w-4 h-4 inline-flex items-center justify-center text-xs transition-colors cursor-pointer"
                        title={`Remove ${skill}`}
                        aria-label={`Remove ${skill}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Search / add-other box */}
              <div className="p-2 border-b border-gray-100">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[16px] pointer-events-none">
                    search
                  </span>
                  <input
                    type="text"
                    value={skillSearch}
                    onChange={(e) => setSkillSearch(e.target.value)}
                    onKeyDown={handleSkillSearchKeyDown}
                    placeholder="Search or add a skill..."
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto py-1.5">
                {filteredSkills.length === 0 && !canAddCustomSkill && (
                  <div className="px-3.5 py-2 text-xs text-gray-400">
                    {PRESET_SKILLS.every((s) => skills.includes(s))
                      ? "All skills added"
                      : "No skills found"}
                  </div>
                )}
                {filteredSkills.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => {
                      addSkill(skill);
                      setSkillSearch("");
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>{skill}</span>
                    <span className="text-gray-400 font-bold">+</span>
                  </button>
                ))}
                {canAddCustomSkill && (
                  <button
                    type="button"
                    onClick={() => {
                      addSkill(trimmedSkillSearch);
                      setSkillSearch("");
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-1.5 border-t border-gray-100 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">add</span>
                    Add &quot;{trimmedSkillSearch}&quot;
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop: custom skill add row */}
        <div className="hidden md:flex gap-2">
          <input
            type="text"
            value={customSkill}
            onChange={(e) => setCustomSkill(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomSkill();
              }
            }}
            placeholder="Add custom skill (e.g. OpenAI Whisper, Pinecone, vLLM)..."
            className="min-w-0 flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          />
          <button
            type="button"
            onClick={() => addCustomSkill()}
            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm font-medium transition-colors cursor-pointer"
          >
            Add
          </button>
        </div>
      </div>

      {/* ── 3. Work Experience ── */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Work Experience</h2>
            <p className="text-sm text-gray-500 mt-0.5">Highlight your professional background and track record</p>
          </div>
          <button
            type="button"
            onClick={addExperience}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 max-sm:w-9 max-sm:h-9 max-sm:px-0 max-sm:py-0 rounded-full transition-colors inline-flex items-center justify-center gap-1"
            aria-label="Add experience"
            title="Add Experience"
          >
            <span aria-hidden="true">+</span>
            {/* Label drops away on phones so this stays a compact round + button;
                the accessible name lives on aria-label/title. */}
            <span className="max-sm:hidden">Add Experience</span>
          </button>
        </div>

        <div className="space-y-4">
          {experiences.map((exp) => (
            <div
              key={exp.id}
              className="p-5 sm:p-6 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required={Boolean(exp.role || exp.company || exp.duration || exp.description)}
                    value={exp.role}
                    onChange={(e) => updateExperience(exp.id, "role", e.target.value)}
                    placeholder="e.g. Lead AI Engineer"
                    style={{ borderRadius: "12px" }}
                    className="spf-input w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Company / Organization <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required={Boolean(exp.role || exp.company || exp.duration || exp.description)}
                    value={exp.company}
                    onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                    placeholder="e.g. Aetheris Labs"
                    style={{ borderRadius: "12px" }}
                    className="spf-input w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Time Period <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required={Boolean(exp.role || exp.company || exp.duration || exp.description)}
                    value={exp.duration}
                    onChange={(e) => updateExperience(exp.id, "duration", e.target.value)}
                    placeholder="e.g. 2023 - Present"
                    style={{ borderRadius: "12px" }}
                    className="spf-input w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Key Responsibilities / Impact <span className="text-red-500">*</span>
                </label>
                <textarea
                  required={Boolean(exp.role || exp.company || exp.duration || exp.description)}
                  rows={2}
                  value={exp.description}
                  onChange={(e) => updateExperience(exp.id, "description", e.target.value)}
                  placeholder="Architected multi-agent orchestration pipelines and fine-tuned domain-specific LLMs."
                  style={{ borderRadius: "12px" }}
                  className="spf-input w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all leading-relaxed"
                />
              </div>

              {experiences.length > 1 && (
                <div className="flex items-center justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => removeExperience(exp.id)}
                    className="px-3 py-1 rounded-full text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 border border-red-200 transition-all cursor-pointer inline-flex items-center justify-center"
                    aria-label="Remove experience"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. Portfolio & Social Media ── */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 md:p-8 shadow-sm space-y-6">
        <div className="border-b border-gray-100 pb-4">
          <h2 className="text-xl font-semibold text-gray-900">Portfolio &amp; Social Links</h2>
          <p className="text-sm text-gray-500 mt-0.5">Let buyers explore your code, demos, and professional profiles</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Portfolio or Website URL</label>
            <input
              type="url"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://yourportfolio.dev"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">GitHub Profile</label>
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">LinkedIn Profile</label>
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/username"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">X Profile</label>
            <input
              type="url"
              value={twitterUrl}
              onChange={(e) => setTwitterUrl(e.target.value)}
              placeholder="https://x.com/username"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── Submit Action ── */}
      <div className="flex items-center justify-between pb-12" style={{ marginTop: "12px" }}>
        <button
          type="submit"
          disabled={submitting}
          className="h-12 px-8 max-sm:h-10 max-sm:px-6 max-sm:text-[13px] rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm leading-none shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 cursor-pointer"
        >
          {submitting ? (
            <>
              <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Profile</span>
          )}
        </button>

        <Link
          href="/explore"
          className="ak-btn-cancel !h-12 !px-8 max-sm:!h-10 max-sm:!px-6 text-sm max-sm:text-[13px] font-semibold"
        >
          <span>Cancel</span>
        </Link>
      </div>
    </form>
  );
}
