// Parses and validates the "aiKart Agent Manifest v1" YAML format published at
// /docs/aikart-agent-manifest-guide.pdf. Every limit here mirrors that document —
// keep the two in sync if either changes.

import { load as loadYaml } from "js-yaml";

export const MAX_CPU = 2;
export const MAX_MEMORY_MB = 4096;
export const MAX_TIMEOUT_SECONDS = 280;
export const MAX_SERVER_MODE_TIMEOUT_SECONDS = 300;
export const MAX_UI_SECTIONS = 8;
export const MAX_FIELDS_PER_SECTION = 12;

export type InputFieldType = "text" | "textarea" | "number" | "boolean" | "select";
export type OutputFormat = "markdown" | "text" | "json" | "html";
export type NetworkEgress = "none" | "allowlist";
export type UiPresentation = "form" | "chat" | "wizard";
export type UiSectionLayout = "row" | "stack";
export type OutputDisplay = "card" | "table" | "chat-bubble";

export type ManifestOption = { label: string; value: string };

export type ManifestInputField = {
  name: string;
  label: string;
  type: InputFieldType;
  required: boolean;
  options?: ManifestOption[];
  default?: string;
};

export type ManifestSecret = {
  name: string;
  description?: string;
  required: boolean;
};

// Presentation-only layer, resolved by name references into `inputs` rather
// than duplicating field definitions — a manifest without a `ui` section is
// still fully valid and renders exactly as it did before `ui` existed. See
// docs/sandbox_rebuild.md for the design rationale.
export type ManifestUiSection = {
  title?: string;
  fields: string[]; // must each reference an existing inputs[].name
  layout: UiSectionLayout;
};

export type ManifestFieldMeta = {
  placeholder?: string;
  helpText?: string;
  icon?: string;
  widthPct?: number;
  // Minimal conditional-visibility: equality only. Extend to multi-value/AND-OR
  // only once a real seller manifest needs it (see open questions in the doc).
  showIf?: { field: string; equals: string };
};

export type ManifestUi = {
  presentation?: UiPresentation;
  sections?: ManifestUiSection[];
  fieldMeta?: Record<string, ManifestFieldMeta>;
};

export type AgentManifest = {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    displayName: string;
    description?: string;
  };
  runtime: {
    type: "docker";
    image: string;
    command?: string[];
    mode?: "batch" | "server";
    port?: number;
  };
  resources: {
    cpu: number;
    memoryMb: number;
    timeoutSeconds: number;
  };
  inputs: ManifestInputField[];
  ui?: ManifestUi;
  output: {
    format: OutputFormat;
    display?: OutputDisplay;
  };
  security: {
    networkEgress: NetworkEgress;
    egressAllowlist?: string[];
  };
  secrets: ManifestSecret[];
};

export type ManifestParseResult =
  | { ok: true; manifest: AgentManifest }
  | { ok: false; error: string };

const INPUT_TYPES: InputFieldType[] = ["text", "textarea", "number", "boolean", "select"];
const OUTPUT_FORMATS: OutputFormat[] = ["markdown", "text", "json", "html"];
const EGRESS_MODES: NetworkEgress[] = ["none", "allowlist"];
const UI_PRESENTATIONS: UiPresentation[] = ["form", "chat", "wizard"];
const UI_SECTION_LAYOUTS: UiSectionLayout[] = ["row", "stack"];
const OUTPUT_DISPLAYS: OutputDisplay[] = ["card", "table", "chat-bubble"];

function fail(msg: string): ManifestParseResult {
  return { ok: false, error: msg };
}

export function isServerModeEnabled(): boolean {
  return (
    process.env.SANDBOX_SERVER_MODE_ENABLED === "true" ||
    process.env.NEXT_PUBLIC_SANDBOX_SERVER_MODE_ENABLED === "true"
  );
}

export function parseManifest(yamlText: string): ManifestParseResult {
  let doc: unknown;
  try {
    doc = loadYaml(yamlText);
  } catch (e: any) {
    return fail(`Invalid YAML: ${e.message || "could not parse"}`);
  }

  if (!doc || typeof doc !== "object") return fail("Manifest is empty or not a YAML object.");
  const d = doc as Record<string, any>;

  if (d.apiVersion !== "aikart.dev/v1") {
    return fail(`Unsupported apiVersion "${d.apiVersion}", expected "aikart.dev/v1".`);
  }
  if (d.kind !== "AgentManifest") {
    return fail(`Unsupported kind "${d.kind}", expected "AgentManifest".`);
  }

  const metadata = d.metadata;
  if (!metadata || typeof metadata !== "object") return fail("Missing required section: metadata");
  if (!metadata.name || !/^[a-z0-9-]+$/.test(metadata.name)) {
    return fail("metadata.name is required and must be lowercase letters, numbers, and hyphens only.");
  }
  if (!metadata.displayName) return fail("metadata.displayName is required.");

  const runtime = d.runtime;
  if (!runtime || typeof runtime !== "object") return fail("Missing required section: runtime");
  if (runtime.type !== "docker") return fail('runtime.type must be "docker" — no other runtime is supported yet.');
  if (!runtime.image || typeof runtime.image !== "string") {
    return fail("runtime.image is required (a publicly pullable image reference).");
  }
  if (runtime.command !== undefined && !Array.isArray(runtime.command)) {
    return fail("runtime.command must be an array of strings if provided.");
  }

  const mode: "batch" | "server" = runtime.mode ?? "batch";
  if (mode !== "batch" && mode !== "server") {
    return fail('runtime.mode must be "batch" or "server" if provided.');
  }

  if (mode === "server" && !isServerModeEnabled()) {
    return fail('Server mode (runtime.mode: "server") is currently unavailable. Please set runtime.mode: "batch".');
  }
  let port: number | undefined;
  if (mode === "server") {
    if (runtime.port === undefined || runtime.port === null) {
      return fail('runtime.port is required when runtime.mode is "server".');
    }
    port = Number(runtime.port);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      return fail("runtime.port must be an integer between 1 and 65535.");
    }
  } else {
    if (runtime.port !== undefined && runtime.port !== null) {
      return fail('runtime.port must be undefined when runtime.mode is "batch".');
    }
  }

  const resources = d.resources;
  if (!resources || typeof resources !== "object") return fail("Missing required section: resources");
  const cpu = Number(resources.cpu);
  const memoryMb = Number(resources.memoryMb);
  let timeoutSeconds = Number(resources.timeoutSeconds);
  if (!Number.isFinite(cpu) || cpu <= 0 || cpu > MAX_CPU) {
    return fail(`resources.cpu must be a number between 0 and ${MAX_CPU}.`);
  }
  if (!Number.isFinite(memoryMb) || memoryMb <= 0 || memoryMb > MAX_MEMORY_MB) {
    return fail(`resources.memoryMb must be a number between 0 and ${MAX_MEMORY_MB}.`);
  }
  if (!Number.isFinite(timeoutSeconds) || timeoutSeconds <= 0) {
    return fail("resources.timeoutSeconds must be a positive number.");
  }

  if (mode === "batch") {
    if (timeoutSeconds > MAX_TIMEOUT_SECONDS) {
      return fail(`resources.timeoutSeconds must be a number between 0 and ${MAX_TIMEOUT_SECONDS}.`);
    }
  } else {
    // Server mode clamps to MAX_SERVER_MODE_TIMEOUT_SECONDS rather than failing validation
    timeoutSeconds = Math.min(timeoutSeconds, MAX_SERVER_MODE_TIMEOUT_SECONDS);
  }

  const rawInputs = Array.isArray(d.inputs) ? d.inputs : [];
  const inputs: ManifestInputField[] = [];
  for (const [i, inp] of rawInputs.entries()) {
    if (!inp || typeof inp !== "object" || !inp.name || !inp.label) {
      return fail(`inputs[${i}] must have at least "name" and "label".`);
    }
    if (!INPUT_TYPES.includes(inp.type)) {
      return fail(`inputs[${i}].type "${inp.type}" is invalid — must be one of: ${INPUT_TYPES.join(", ")}.`);
    }
    if (inp.type === "select" && (!Array.isArray(inp.options) || inp.options.length === 0)) {
      return fail(`inputs[${i}] has type "select" but no non-empty "options" array.`);
    }
    // Sellers write options two different ways in the wild: a flat list of
    // strings (`- "Option A"`, label and value are the same string), or a
    // list of {label, value} objects (a format some other agent-manifest
    // conventions use). Accept both rather than silently mangling the
    // second form into the literal text "[object Object]" (String(obj)) —
    // that used to pass validation cleanly and only blow up later as
    // duplicate-key React warnings / a dropdown full of "[object Object]".
    let options: ManifestOption[] | undefined;
    if (Array.isArray(inp.options)) {
      for (const [j, o] of inp.options.entries()) {
        const isObjectForm = o !== null && typeof o === "object" && !Array.isArray(o);
        if (isObjectForm) {
          if (!o.value) return fail(`inputs[${i}].options[${j}] must have a "value".`);
          (options ??= []).push({ label: o.label !== undefined ? String(o.label) : String(o.value), value: String(o.value) });
        } else {
          (options ??= []).push({ label: String(o), value: String(o) });
        }
      }
    }
    inputs.push({
      name: String(inp.name),
      label: String(inp.label),
      type: inp.type,
      required: !!inp.required,
      options,
      default: inp.default !== undefined ? String(inp.default) : undefined,
    });
  }

  const output = d.output;
  if (!output || !OUTPUT_FORMATS.includes(output.format)) {
    return fail(`output.format is required and must be one of: ${OUTPUT_FORMATS.join(", ")}.`);
  }
  if (output.display !== undefined && !OUTPUT_DISPLAYS.includes(output.display)) {
    return fail(`output.display "${output.display}" is invalid — must be one of: ${OUTPUT_DISPLAYS.join(", ")}.`);
  }

  // `ui` is optional and purely presentational — it never introduces data that
  // isn't already declared in `inputs`. Every reference is resolved by name so
  // a manifest without this section parses and renders exactly as before.
  const inputNames = new Set(inputs.map((f) => f.name));
  let ui: ManifestUi | undefined;
  if (d.ui !== undefined) {
    if (typeof d.ui !== "object" || d.ui === null) return fail("ui must be an object if provided.");
    const rawUi = d.ui as Record<string, any>;

    if (rawUi.presentation !== undefined && !UI_PRESENTATIONS.includes(rawUi.presentation)) {
      return fail(`ui.presentation "${rawUi.presentation}" is invalid — must be one of: ${UI_PRESENTATIONS.join(", ")}.`);
    }

    let sections: ManifestUiSection[] | undefined;
    if (rawUi.sections !== undefined) {
      if (!Array.isArray(rawUi.sections)) return fail("ui.sections must be an array if provided.");
      if (rawUi.sections.length > MAX_UI_SECTIONS) {
        return fail(`ui.sections has too many sections (max ${MAX_UI_SECTIONS}).`);
      }
      sections = [];
      for (const [i, sec] of rawUi.sections.entries()) {
        if (!sec || typeof sec !== "object" || !Array.isArray(sec.fields) || sec.fields.length === 0) {
          return fail(`ui.sections[${i}] must have a non-empty "fields" array.`);
        }
        if (sec.fields.length > MAX_FIELDS_PER_SECTION) {
          return fail(`ui.sections[${i}].fields has too many fields (max ${MAX_FIELDS_PER_SECTION}).`);
        }
        for (const fname of sec.fields) {
          if (typeof fname !== "string" || !inputNames.has(fname)) {
            return fail(`ui.sections[${i}] references field "${fname}", which is not declared in inputs.`);
          }
        }
        if (sec.layout !== undefined && !UI_SECTION_LAYOUTS.includes(sec.layout)) {
          return fail(`ui.sections[${i}].layout "${sec.layout}" is invalid — must be one of: ${UI_SECTION_LAYOUTS.join(", ")}.`);
        }
        sections.push({
          title: sec.title !== undefined ? String(sec.title) : undefined,
          fields: sec.fields.map(String),
          layout: sec.layout ?? "stack",
        });
      }
    }

    let fieldMeta: Record<string, ManifestFieldMeta> | undefined;
    if (rawUi.fieldMeta !== undefined) {
      if (typeof rawUi.fieldMeta !== "object" || rawUi.fieldMeta === null || Array.isArray(rawUi.fieldMeta)) {
        return fail("ui.fieldMeta must be an object keyed by field name if provided.");
      }
      fieldMeta = {};
      for (const [fname, rawMeta] of Object.entries(rawUi.fieldMeta as Record<string, any>)) {
        if (!inputNames.has(fname)) {
          return fail(`ui.fieldMeta references field "${fname}", which is not declared in inputs.`);
        }
        if (!rawMeta || typeof rawMeta !== "object") {
          return fail(`ui.fieldMeta["${fname}"] must be an object.`);
        }
        if (rawMeta.widthPct !== undefined) {
          const w = Number(rawMeta.widthPct);
          if (!Number.isFinite(w) || w <= 0 || w > 100) {
            return fail(`ui.fieldMeta["${fname}"].widthPct must be a number between 0 and 100.`);
          }
        }
        let showIf: ManifestFieldMeta["showIf"];
        if (rawMeta.showIf !== undefined) {
          if (!rawMeta.showIf || typeof rawMeta.showIf !== "object" || !rawMeta.showIf.field || rawMeta.showIf.equals === undefined) {
            return fail(`ui.fieldMeta["${fname}"].showIf must have "field" and "equals".`);
          }
          if (!inputNames.has(rawMeta.showIf.field)) {
            return fail(`ui.fieldMeta["${fname}"].showIf references field "${rawMeta.showIf.field}", which is not declared in inputs.`);
          }
          if (rawMeta.showIf.field === fname) {
            return fail(`ui.fieldMeta["${fname}"].showIf cannot reference itself.`);
          }
          showIf = { field: String(rawMeta.showIf.field), equals: String(rawMeta.showIf.equals) };
        }
        fieldMeta[fname] = {
          placeholder: rawMeta.placeholder !== undefined ? String(rawMeta.placeholder) : undefined,
          helpText: rawMeta.helpText !== undefined ? String(rawMeta.helpText) : undefined,
          icon: rawMeta.icon !== undefined ? String(rawMeta.icon) : undefined,
          widthPct: rawMeta.widthPct !== undefined ? Number(rawMeta.widthPct) : undefined,
          showIf,
        };
      }
      // Reject circular showIf chains (A shows if B, B shows if A, ...) via
      // cycle detection over the fieldMeta -> showIf.field graph.
      const visitState = new Map<string, "visiting" | "done">();
      const hasCycle = (start: string): boolean => {
        const path = new Set<string>();
        const walk = (node: string): boolean => {
          if (path.has(node)) return true;
          if (visitState.get(node) === "done") return false;
          const next = fieldMeta![node]?.showIf?.field;
          if (!next) return false;
          path.add(node);
          const cyclic = walk(next);
          path.delete(node);
          if (!cyclic) visitState.set(node, "done");
          return cyclic;
        };
        return walk(start);
      };
      for (const fname of Object.keys(fieldMeta)) {
        if (fieldMeta[fname].showIf && hasCycle(fname)) {
          return fail(`ui.fieldMeta has a circular showIf chain starting at "${fname}".`);
        }
      }
    }

    ui = {
      presentation: rawUi.presentation,
      sections,
      fieldMeta,
    };
  }

  const security = d.security ?? { networkEgress: "none" };
  if (!EGRESS_MODES.includes(security.networkEgress)) {
    return fail(`security.networkEgress must be one of: ${EGRESS_MODES.join(", ")}.`);
  }
  if (security.networkEgress === "allowlist" && (!Array.isArray(security.egressAllowlist) || security.egressAllowlist.length === 0)) {
    return fail('security.networkEgress is "allowlist" but egressAllowlist is missing or empty.');
  }

  // Optional — names of env vars/API keys this agent needs. The *values* are
  // never part of the manifest (this file is uploaded and, once approved,
  // effectively public) — the seller enters actual values separately in the
  // listing form, and they're stored encrypted, injected only at run time.
  const rawSecrets = Array.isArray(d.secrets) ? d.secrets : [];
  const secrets: ManifestSecret[] = [];
  for (const [i, s] of rawSecrets.entries()) {
    if (!s || typeof s !== "object" || !s.name) {
      return fail(`secrets[${i}] must have at least "name".`);
    }
    if (!/^[A-Z][A-Z0-9_]*$/.test(s.name)) {
      return fail(`secrets[${i}].name "${s.name}" must look like an env var name — uppercase letters, numbers, underscores, starting with a letter.`);
    }
    // AIKART_* is reserved because secrets are appended to the same container
    // environment array as AIKART_INPUT (see runSandbox) — a secret by that
    // name would shadow the buyer's actual input. AWS_* is reserved so a
    // manifest cannot redirect the AWS SDK's credential/endpoint resolution
    // inside the task.
    if (/^(AIKART|AWS)_/.test(s.name)) {
      return fail(`secrets[${i}].name "${s.name}" uses a reserved prefix — AIKART_* and AWS_* are set by the platform and cannot be overridden.`);
    }
    secrets.push({
      name: String(s.name),
      description: s.description !== undefined ? String(s.description) : undefined,
      required: s.required !== false, // default true — most declared secrets are load-bearing
    });
  }

  return {
    ok: true,
    manifest: {
      apiVersion: d.apiVersion,
      kind: d.kind,
      metadata: {
        name: metadata.name,
        displayName: metadata.displayName,
        description: metadata.description,
      },
      runtime: {
        type: "docker",
        image: runtime.image,
        command: runtime.command,
        mode,
        port,
      },
      resources: { cpu, memoryMb, timeoutSeconds },
      inputs,
      ui,
      output: { format: output.format, display: output.display },
      security: {
        networkEgress: security.networkEgress,
        egressAllowlist: security.egressAllowlist,
      },
      secrets,
    },
  };
}
