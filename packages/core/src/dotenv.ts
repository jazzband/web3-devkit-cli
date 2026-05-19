import fs from "node:fs/promises";
import path from "node:path";

export async function loadDotEnv(cwd: string): Promise<Record<string, string>> {
  const envPath = path.join(cwd, ".env");
  const vars: Record<string, string> = {};

  try {
    const raw = await fs.readFile(envPath, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      vars[key] = value;
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // no .env — use process.env only
  }

  return { ...process.env, ...vars } as Record<string, string>;
}
