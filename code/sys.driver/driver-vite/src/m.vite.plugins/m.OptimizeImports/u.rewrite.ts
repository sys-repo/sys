import type { t } from './common.ts';

type ParsedSpecifier = {
  readonly localKind: t.OptimizeImportsPlugin.ImportRuleKind;
  readonly importName: string;
  readonly clause: string;
};

type RewriteResult = {
  readonly changed: boolean;
  readonly code: string;
};

type RuleIndex = ReadonlyMap<string, ReadonlyMap<string, t.OptimizeImportsPlugin.ImportRule>>;
type RuleInput = readonly t.OptimizeImportsPlugin.PackageRule[] | RuleIndex;

const NAMED_IMPORT_RE =
  /(^|\n)([ \t]*)import(\s+type)?\s*\{([\s\S]*?)\}\s*from\s*(['"])([^'"\n]+)\5\s*;?/gm;

/** Rewrite supported broad imports to approved public narrow imports. */
export function rewriteImports(
  code: string,
  rules: RuleInput,
): RewriteResult {
  const index = toRuleIndexInput(rules);
  const matches = [...code.matchAll(NAMED_IMPORT_RE)];
  if (matches.length === 0) return { changed: false, code };

  let changed = false;
  let output = '';
  let cursor = 0;

  for (const match of matches) {
    const full = match[0];
    const start = match.index ?? 0;
    const end = start + full.length;
    const indent = match[2] ?? '';
    const importType = Boolean(match[3]);
    const clauses = parseClauses(match[4] ?? '');
    const packageId = match[6] ?? '';
    const packageRules = index.get(packageId);

    if (!packageRules || clauses.length === 0) continue;

    const rewritten = rewriteDeclaration({
      clauses,
      importType,
      indent,
      packageId,
      packageRules,
    });
    if (!rewritten.changed) continue;

    changed = true;
    output += code.slice(cursor, start);
    output += rewritten.code;
    cursor = end;
  }

  if (!changed) return { changed: false, code };
  output += code.slice(cursor);
  return { changed: true, code: output };
}

/**
 * Helpers:
 */
function toRuleIndexInput(rules: RuleInput): RuleIndex {
  if (Array.isArray(rules)) return toRuleIndex(rules);
  return rules as RuleIndex;
}

function toRuleIndex(rules: readonly t.OptimizeImportsPlugin.PackageRule[]): RuleIndex {
  return new Map(
    rules.map((rule) => [
      rule.packageId,
      new Map(rule.imports.map((item) => [item.importName, item] as const)),
    ] as const),
  );
}

function parseClauses(raw: string): readonly ParsedSpecifier[] {
  return raw.split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .flatMap((clause) => {
      const parsed = parseClause(clause);
      return parsed ? [parsed] : [];
    });
}

function parseClause(clause: string): ParsedSpecifier | undefined {
  const localKind = clause.startsWith('type ') ? 'type' : 'value';
  const body = localKind === 'type' ? clause.slice(5).trim() : clause;
  const [head] = body.split(/\s+as\s+/u);
  const importName = head?.trim();
  if (!importName) return undefined;
  return { localKind, importName, clause: body };
}

function rewriteDeclaration(args: {
  clauses: readonly ParsedSpecifier[];
  importType: boolean;
  indent: string;
  packageId: string;
  packageRules: ReadonlyMap<string, t.OptimizeImportsPlugin.ImportRule>;
}): RewriteResult {
  const remaining: string[] = [];
  const rewrittenValue = new Map<string, string[]>();
  const rewrittenType = new Map<string, string[]>();
  let changed = false;

  for (const clause of args.clauses) {
    const importKind: t.OptimizeImportsPlugin.ImportRuleKind = args.importType ? 'type' : clause.localKind;
    const rule = args.packageRules.get(clause.importName);
    if (!rule || !ruleApplies(rule.kind, importKind)) {
      remaining.push(renderRemainingClause(clause, args.importType));
      continue;
    }

    changed = true;
    const target = targetPackageId(args.packageId, rule.subpath);
    const groups = importKind === 'type' ? rewrittenType : rewrittenValue;
    const current = groups.get(target) ?? [];
    groups.set(target, [...current, clause.clause]);
  }

  if (!changed) return { changed: false, code: '' };

  const declarations: string[] = [];
  declarations.push(...renderGroup(args.indent, 'value', rewrittenValue));
  declarations.push(...renderGroup(args.indent, 'type', rewrittenType));
  if (remaining.length > 0) {
    declarations.push(
      `${args.indent}import${args.importType ? ' type' : ''} { ${remaining.join(', ')} } from '${args.packageId}';`,
    );
  }

  return { changed: true, code: declarations.join('\n') };
}

function renderGroup(
  indent: string,
  kind: 'value' | 'type',
  groups: ReadonlyMap<string, readonly string[]>,
) {
  return [...groups.entries()].map(([target, clauses]) =>
    `${indent}import${kind === 'type' ? ' type' : ''} { ${clauses.join(', ')} } from '${target}';`
  );
}

function renderRemainingClause(clause: ParsedSpecifier, importType: boolean) {
  return importType || clause.localKind === 'value' ? clause.clause : `type ${clause.clause}`;
}

function targetPackageId(packageId: string, subpath: string) {
  const suffix = subpath.startsWith('./') ? subpath.slice(1) : subpath;
  return `${packageId}${suffix}`;
}

function ruleApplies(
  kind: t.OptimizeImportsPlugin.ImportRuleKind | undefined,
  importKind: t.OptimizeImportsPlugin.ImportRuleKind,
) {
  const ruleKind = kind ?? 'both';
  if (ruleKind === 'both') return true;
  return ruleKind === importKind;
}
