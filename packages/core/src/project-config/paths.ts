import type { ProjectConfig } from "./schema.js";

export function getConfigValue(config: ProjectConfig, keyPath: string): unknown {
  const parts = keyPath.split(".").filter(Boolean);
  let current: unknown = config;
  for (const part of parts) {
    if (current === null || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function setConfigValue(
  config: ProjectConfig,
  keyPath: string,
  value: unknown,
): ProjectConfig {
  const parts = keyPath.split(".").filter(Boolean);
  if (parts.length === 0) {
    throw new Error("Config key path is required, e.g. defaultChain or rpc.base");
  }

  const clone = structuredClone(config) as Record<string, unknown>;
  let cursor: Record<string, unknown> = clone;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]!;
    const next = cursor[part];
    if (next === undefined || typeof next !== "object" || next === null) {
      cursor[part] = {};
    }
    cursor = cursor[part] as Record<string, unknown>;
  }

  const last = parts[parts.length - 1]!;
  if (typeof value === "string" && (value === "true" || value === "false")) {
    cursor[last] = value === "true";
  } else {
    cursor[last] = value;
  }

  return clone as ProjectConfig;
}

export function parseSetValue(raw: string): unknown {
  const trimmed = raw.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return trimmed;
  }
}
