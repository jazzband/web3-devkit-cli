import fs from "node:fs/promises";
import path from "node:path";

const PLACEHOLDER_PATTERN = /\{\{(\w+)\}\}/g;

const SKIP_DIRS = new Set(["node_modules", ".git", "dist"]);

export function applyPlaceholders(content: string, ctx: Record<string, string>): string {
  return content.replace(PLACEHOLDER_PATTERN, (_, key: string) => ctx[key] ?? `{{${key}}}`);
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function collectFiles(dir: string, base = dir): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath, base)));
    } else if (entry.isFile()) {
      files.push(path.relative(base, fullPath));
    }
  }

  return files;
}

function isTextFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  const textExtensions = new Set([
    "",
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".json",
    ".md",
    ".sol",
    ".rs",
    ".toml",
    ".yaml",
    ".yml",
    ".env",
    ".example",
    ".sh",
    ".css",
    ".html",
    ".gitignore",
  ]);
  const base = path.basename(filePath);
  return textExtensions.has(ext) || base === ".env.example" || base.endsWith(".example");
}

export interface RenderTemplateOptions {
  templateDir: string;
  targetDir: string;
  context: Record<string, string>;
  /** Skip writing if target file already exists */
  skipExisting?: boolean;
  filter?: (relativePath: string) => boolean;
}

export interface RenderTemplateResult {
  targetDir: string;
  filesWritten: number;
  filesSkipped: number;
}

export async function renderTemplate(
  options: RenderTemplateOptions,
): Promise<RenderTemplateResult> {
  const { templateDir, targetDir, context, skipExisting = false, filter } = options;

  if (!(await pathExists(templateDir))) {
    throw new Error(`Generator template not found at ${templateDir}`);
  }

  const relativeFiles = await collectFiles(templateDir);
  let filesWritten = 0;
  let filesSkipped = 0;

  await fs.mkdir(targetDir, { recursive: true });

  for (const relativePath of relativeFiles) {
    if (filter && !filter(relativePath)) continue;

    const destRelative = applyPlaceholders(relativePath, context);
    const src = path.join(templateDir, relativePath);
    const dest = path.join(targetDir, destRelative);

    if (skipExisting && (await pathExists(dest))) {
      filesSkipped++;
      continue;
    }

    await fs.mkdir(path.dirname(dest), { recursive: true });

    if (isTextFile(relativePath)) {
      const raw = await fs.readFile(src, "utf8");
      await fs.writeFile(dest, applyPlaceholders(raw, context), "utf8");
    } else {
      await fs.copyFile(src, dest);
    }

    filesWritten++;
  }

  return {
    targetDir: path.resolve(targetDir),
    filesWritten,
    filesSkipped,
  };
}
