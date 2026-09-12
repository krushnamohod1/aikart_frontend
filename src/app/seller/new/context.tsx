"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

/** One row in the API Endpoint Mode input-field builder (Phase 3 schema shape). */
export type ApiBuilderField = {
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: { label: string; value: string }[];
  defaultValue?: string;
  fileType?: string;
  allowedExtension?: string;
  maxSizeMb?: number;
};

export type ListingFormData = {
  // Identity
  title: string;
  tagline: string;
  listingType: string;

  // Rich Content
  description: string;
  problemSolved: string;
  howItHelps: string;
  useCase: string;

  // Skills & Categorization
  technologies: string[];
  keyCapabilities: string[];
  category: string;
  targetIndustries: string[];
  teamSize: string;

  // Pricing & Links
  pricingModel: string;
  price: string;
  pricingDetails: string;
  websiteUrl: string;

  // Media
  logoFile: File | null;
  logoPreview: string;
  coverFile: File | null;
  coverPreview: string;
  videoFile: File | null;
  videoPreview: string;
  videoName: string;
  promoVideoFile: File | null;
  promoVideoPreview: string;
  promoVideoName: string;
  screenshotFiles: (File | null)[];
  screenshotPreviews: string[];
  pdfFile: File | null;
  pdfName: string;

  // Provider
  providerName: string;
  providerEmail: string;

  // Bank & Payouts
  bankAccountHolder: string;
  bankAccountNumber: string;
  bankConfirmAccount: string;
  bankIfsc: string;
  bankUpi: string;
  gstNumber: string;
  payoutCurrency: string;
  payoutFrequency: string;

  // Interactive Testing / Integrations
  // API Endpoint Mode: the seller hosts the agent; aiKart proxies to it
  // server-side and renders the standard aiKart UI. apiEnabled/apiEndpoint
  // already existed (they were collected but never executed); the fields below
  // are what turn that stub into a working execution mode.
  apiEnabled: boolean;
  apiEndpoint: string;
  apiMethod: string;
  apiAuthType: string;
  apiAuthConfig: { headerName?: string; queryParam?: string; username?: string };
  /** Plaintext; sent to the server once at submit time and stored encrypted. Never rendered back. */
  apiCredential: string;
  apiInputSchema: ApiBuilderField[];
  apiOutputMapping: {
    entries: {
      event?: string;
      source: string;
      target: string;
      label?: string;
      language?: string;
      columnsSource?: string;
      rowsSource?: string;
    }[];
    passthrough?: boolean;
  };
  /** "json" for a normal response body, "sse" for a text/event-stream agent. */
  apiResponseFormat: string;
  /** Optional pre-flight request (e.g. create a conversation) — raw JSON text, parsed on save. */
  apiSessionEnabled: boolean;
  apiSessionUrl: string;
  apiSessionBody: string;
  apiSessionExtract: string;
  /** Internal request fields the buyer never sees — raw JSON text, parsed on save. */
  apiStaticBody: string;
  apiTimeoutMs: number;
  /** Last successful test response — powers mapping suggestions in the wizard. */
  apiSampleResponse: unknown;
  apiTested: boolean;
  tryMeEnabled: boolean;
  yamlFile: File | null;
  yamlName: string;
  // Env vars/API keys the uploaded manifest's `secrets:` section declares
  // (parsed client-side on upload — see handleYaml in step1/page.tsx), and
  // the values the seller types in for them. Names only ever come from the
  // manifest; values never get written back into the manifest file itself.
  yamlSecrets: { name: string; description?: string; required: boolean }[];
  secretValues: Record<string, string>;
  // Per-secret choice: "seller" (default — they paste the value themselves)
  // or "admin" (they don't want to hand over their own key; aiKart provides
  // one before the listing can be approved).
  secretProviders: Record<string, "seller" | "admin">;
  // Result of validating the uploaded manifest right away — null while
  // checking, then true/false. Without this, a broken manifest silently
  // sails through submission and only surfaces as "Coming Soon" on the
  // listing page much later, with no clue why.
  yamlValid: boolean | null;
  yamlError: string | null;

  // n8n Automation ("Try Me Now" via seller-hosted n8n webhook)
  n8nEnabled: boolean;
  n8nWebhookUrl: string;
  /** Plaintext secret generated client-side, sent to server for encryption at save time */
  n8nWebhookSecret: string;
  n8nInputSchema: { name: string; label: string; type: string }[];
  n8nOutputFormat: string;

  // Consents
  termsAgreed: boolean;
  privacyAgreed: boolean;
};

const defaultFormData: ListingFormData = {
  title: "",
  tagline: "",
  listingType: "SaaS Product",
  description: "",
  problemSolved: "",
  howItHelps: "",
  useCase: "",
  technologies: ["Python", "OpenAI", "React"],
  keyCapabilities: [],
  category: "Coding & Development",
  targetIndustries: ["Technology", "Financial Services"],
  teamSize: "1-10",
  pricingModel: "Freemium",
  price: "49",
  pricingDetails: "",
  websiteUrl: "",
  logoFile: null,
  logoPreview: "",
  coverFile: null,
  coverPreview: "",
  videoFile: null,
  videoPreview: "",
  videoName: "",
  promoVideoFile: null,
  promoVideoPreview: "",
  promoVideoName: "",
  screenshotFiles: [null, null, null, null, null],
  screenshotPreviews: ["", "", "", "", ""],
  pdfFile: null,
  pdfName: "",
  providerName: "",
  providerEmail: "",
  bankAccountHolder: "",
  bankAccountNumber: "",
  bankConfirmAccount: "",
  bankIfsc: "",
  bankUpi: "",
  gstNumber: "",
  payoutCurrency: "USD",
  payoutFrequency: "Monthly",
  apiEnabled: false,
  apiEndpoint: "",
  apiMethod: "POST",
  apiAuthType: "none",
  apiAuthConfig: {},
  apiCredential: "",
  apiInputSchema: [],
  apiOutputMapping: { entries: [], passthrough: true },
  apiResponseFormat: "json",
  apiSessionEnabled: false,
  apiSessionUrl: "",
  apiSessionBody: "{}",
  apiSessionExtract: '{"conversation_id":"id"}',
  apiStaticBody: "",
  apiTimeoutMs: 30000,
  apiSampleResponse: null,
  apiTested: false,
  tryMeEnabled: false,
  yamlFile: null,
  yamlName: "",
  yamlSecrets: [],
  secretValues: {},
  secretProviders: {},
  yamlValid: null,
  yamlError: null,
  n8nEnabled: false,
  n8nWebhookUrl: "",
  n8nWebhookSecret: "",
  n8nInputSchema: [],
  n8nOutputFormat: "text",
  termsAgreed: false,
  privacyAgreed: false,
};

type ListingFormContextType = {
  formData: ListingFormData;
  updateField: (field: keyof ListingFormData, value: unknown) => void;
};

const ListingFormContext = createContext<ListingFormContextType | null>(null);

export function ListingFormProvider({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail?: string;
}) {
  const [formData, setFormData] = useState<ListingFormData>({
    ...defaultFormData,
    providerEmail: userEmail || "",
  });

  const updateField = useCallback(
    (field: keyof ListingFormData, value: unknown) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  return (
    <ListingFormContext.Provider value={{ formData, updateField }}>
      {children}
    </ListingFormContext.Provider>
  );
}

export function useListingForm() {
  const ctx = useContext(ListingFormContext);
  if (!ctx)
    throw new Error("useListingForm must be used within ListingFormProvider");
  return ctx;
}
