import { type t, Fs, Is, Path } from './common.ts';

type WorkspaceInput = Pick<t.DenoWorkspace, 'dir' | 'children'>;
type ExportKind = 'value';
type ExportInfo = { readonly name: string; readonly kind: ExportKind };

/** Derive safe narrow-import rewrite rules from workspace package public exports. */
export async function deriveWorkspacePackageRules(
  workspace: WorkspaceInput,
): Promise<readonly t.OptimizeImportsPlugin.PackageRule[]> {
  const rules = await Array.fromAsync(workspace.children.map((child) => derivePackageRule(workspace.dir, child)));
  return rules.flatMap((rule) => rule ? [rule] : []);
}

async function derivePackageRule(
  workspaceDir: string,
  child: t.DenoWorkspaceChild,
): Promise<t.OptimizeImportsPlugin.PackageRule | undefined> {
  const pkgId = child.denofile.name;
  const exports = child.denofile.exports;
  if (!Is.string(pkgId) || !Is.record<Record<string, unknown>>(exports)) return undefined;

  const rootTarget = exports['.'];
  if (!Is.string(rootTarget)) return undefined;

  const pkgDir = Path.join(workspaceDir, child.path.dir);
  const rootSymbols = await readValueExports(Path.join(pkgDir, rootTarget));
  if (rootSymbols.size === 0) return undefined;

  const candidates = new Map<string, string>();
  const ambiguous = new Set<string>();
  const subpaths = Object.entries(exports)
    .filter(([subpath, target]) => subpath !== '.' && Is.string(target))
    .map(([subpath, target]) => ({ subpath, target: String(target) }));

  for (const { subpath, target } of subpaths) {
    const symbols = await readValueExports(Path.join(pkgDir, target));
    for (const symbol of symbols) {
      if (!rootSymbols.has(symbol)) continue;
      const existing = candidates.get(symbol);
      if (existing && existing !== subpath) {
        candidates.delete(symbol);
        ambiguous.add(symbol);
        continue;
      }
      if (!ambiguous.has(symbol)) candidates.set(symbol, subpath);
    }
  }

  const imports = [...candidates.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([importName, subpath]) => ({ importName, subpath, kind: 'value' as const }));

  if (imports.length === 0) return undefined;
  return { packageId: pkgId, imports };
}

async function readValueExports(path: string) {
  const text = (await Fs.readText(path)).data ?? '';
  return new Set(collectValueExports(text).map((item) => item.name));
}

function collectValueExports(text: string) {
  const items: ExportInfo[] = [];

  for (const match of text.matchAll(/export\s*\{([\s\S]*?)\}\s*(?:from\s*['"][^'"]+['"])?\s*;?/gm)) {
    items.push(...parseExportList(match[1] ?? ''));
  }

  for (const match of text.matchAll(/export\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\s*['"][^'"]+['"]\s*;?/gm)) {
    items.push({ name: match[1], kind: 'value' });
  }

  for (const match of text.matchAll(/export\s+(?:const|class|function|let|var|enum)\s+([A-Za-z_$][\w$]*)\b/gm)) {
    items.push({ name: match[1], kind: 'value' });
  }

  return dedupe(items);
}

function parseExportList(raw: string) {
  return raw.split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .flatMap((part) => {
      if (part.startsWith('type ')) return [];
      const [head] = part.split(/\s+as\s+/u);
      const name = head?.trim();
      return name ? [{ name, kind: 'value' as const }] : [];
    });
}

function dedupe(items: readonly ExportInfo[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.kind}:${item.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
