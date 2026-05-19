import fs from "node:fs/promises";
import path from "node:path";

interface PackageJson {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export async function mergeFrontendDependencies(
  frontendDir: string,
  dependencies: Record<string, string>,
  devDependencies?: Record<string, string>,
): Promise<{ added: string[]; skipped: string[] }> {
  const pkgPath = path.join(frontendDir, "package.json");
  let pkg: PackageJson;

  try {
    pkg = JSON.parse(await fs.readFile(pkgPath, "utf8")) as PackageJson;
  } catch {
    return { added: [], skipped: Object.keys(dependencies) };
  }

  pkg.dependencies ??= {};
  pkg.devDependencies ??= {};

  const added: string[] = [];
  const skipped: string[] = [];

  for (const [name, version] of Object.entries(dependencies)) {
    if (pkg.dependencies[name] || pkg.devDependencies[name]) {
      skipped.push(name);
      continue;
    }
    pkg.dependencies[name] = version;
    added.push(name);
  }

  if (devDependencies) {
    for (const [name, version] of Object.entries(devDependencies)) {
      if (pkg.dependencies[name] || pkg.devDependencies[name]) {
        skipped.push(name);
        continue;
      }
      pkg.devDependencies[name] = version;
      added.push(name);
    }
  }

  if (added.length > 0) {
    await fs.writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
  }

  return { added, skipped };
}
