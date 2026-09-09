import { c, Cli, Fmt, Fs, Is, Obj, Pkg, Str, type t } from '../common.ts';
import { fmtProvider } from './u.fmt.provider.ts';

type EndpointTableOptions = {
  yaml?: t.EndpointYamlFile;
  verification?: t.Pkg.Dist.Local.Verify.Evidence;
};
type EndpointTableResult = {
  readonly text: string;
  readonly yaml: t.EndpointYamlFile | undefined;
};

/**
 * Format one Deploy endpoint and its verified staging metadata.
 */
export async function endpointTable(
  cwd: t.StringDir,
  ref: t.DeployTool.Config.EndpointRef,
  options: EndpointTableOptions = {},
): Promise<EndpointTableResult> {
  const table = Cli.table();

  const childText = (label: string, isLast = false) => ` ${Fmt.Tree.branch(isLast)} ${label}`;
  const child = (label: string, isLast = false) =>
    c.gray(` ${c.dim(Fmt.Tree.branch(isLast))} ${label}`);

  // Never feed Ansi helpers undefined.
  const name = String(ref.name ?? '');
  const file = String(ref.file ?? '');

  // Read YAML once (provider + mappings); never throw.
  let yaml = options.yaml;
  try {
    if (!yaml) {
      const abs = Fs.join(cwd, file);
      const res = await Fs.readYaml<t.EndpointYamlFile>(abs);
      yaml = res.ok ? res.data : undefined;
    }
  } catch {
    yaml = undefined;
  }

  const mappingsCount = yaml?.mappings?.length ?? 0;
  const mappingsLabel = `${String(mappingsCount)} ${Str.plural(mappingsCount, 'bundle')}`;
  const providerFmt = fmtProvider(yaml?.provider);
  const providerDomain = yaml?.provider?.kind === 'r2'
    ? String(yaml.provider.readOrigin ?? '').trim()
    : '';

  // Align mapping "second column" under the endpoint value column.
  const baseLabels = [
    'endpoint',
    childText('config'),
    childText('mappings'),
    ...(providerFmt ? [childText(providerFmt.label)] : []),
    ...(providerDomain ? [childText('domain')] : []),
  ];
  const valuesIndent = baseLabels.reduce((m, s) => Math.max(m, s.length), 0) + 2;

  const rows: Array<{ label: string; value: string }> = [
    { label: 'config', value: c.gray(c.dim(file)) },
    { label: 'mappings', value: c.gray(mappingsLabel) },
  ];

  if (providerFmt) {
    rows.push({ label: providerFmt.label, value: providerFmt.value });
  }

  if (providerDomain) {
    const domain = providerDomain.startsWith('http') ? providerDomain : `https://${providerDomain}`;
    rows.push({ label: 'domain', value: c.cyan(domain) });
  }

  const body: Array<[string, string]> = [[c.gray('endpoint'), c.cyan(name)]];

  for (const [index, row] of rows.entries()) {
    const isLast = index === rows.length - 1;
    body.push([child(row.label, isLast), row.value]);
  }

  table.body(body);

  let mappingsBlock = '';

  try {
    const tail = (path: string) => {
      return Str.splitPathSegments(String(path ?? '')).at(-1) ?? String(path ?? '');
    };

    const mappings = yaml?.mappings ?? [];

    if (mappings.length) {
      const mt = Cli.table();

      type Destination = { readonly path: string; readonly coverage: string };
      type Group = {
        readonly mode: string;
        readonly srcNames: readonly string[];
        readonly dsts: readonly Destination[];
      };
      type MutableGroup = { srcNames: string[]; dsts: Destination[] };

      const groups: Group[] = [];
      const byMode = new Map<string, MutableGroup>();

      for (const m of mappings) {
        const mode = String(m.mode ?? '');
        const src = tail(String(m.dir.source ?? ''));
        const dstRaw = String(m.dir.staging ?? '');
        const coverage = mappingCoverage(options.verification, dstRaw);
        const dst = { path: dstRaw, coverage };

        const hit = byMode.get(mode);
        if (hit) {
          hit.srcNames.push(src);
          hit.dsts.push(dst);
        } else {
          const next: MutableGroup = { srcNames: [src], dsts: [dst] };
          byMode.set(mode, next);
          groups.push({ mode, ...next });
        }
      }

      const maxModeLen = groups.reduce((acc, g) => Math.max(acc, g.mode.length), 0);

      // mt prints: <col1><two spaces><col2>
      // We want col2 to start at `valuesIndent`, while keeping the bullet flush-left.
      const desiredLeftWidth = Math.max(0, valuesIndent - 2);
      const baseLeftWidth = 3 + maxModeLen; // " • " + padded mode
      const extraLeftPad = ' '.repeat(Math.max(0, desiredLeftWidth - baseLeftWidth));

      const flowFor = (g: Group) => {
        const srcLines = g.srcNames.map((x) => c.gray(String(x)));
        const maxDstPathLen = g.dsts.reduce((acc, d) => Math.max(acc, d.path.length), 0);
        const dstLines = g.dsts.map((d) => {
          const path = c.white(d.path);
          if (!d.coverage) return path;
          const pad = ' '.repeat(Math.max(1, maxDstPathLen - d.path.length + 1));
          return `${path}${pad}${c.dim(c.gray(d.coverage))}`;
        });
        return [...srcLines, c.cyan('↓'), ...dstLines].join('\n');
      };

      mt.body(
        groups.map((g) => {
          const mode = g.mode;
          const modePad = ' '.repeat(Math.max(0, maxModeLen - mode.length));
          const left = ` ${c.cyan(`• ${mode}`)}${modePad}${extraLeftPad}`;
          return [left, flowFor(g)];
        }),
      );

      mappingsBlock = String(
        Str.builder()
          .blank()
          .line(Str.trimEdgeNewlines(String(mt))),
      );
    }
  } catch {
    // formatting must never throw
  }

  const str = Str.builder()
    .line(Str.trimEdgeNewlines(String(table)))
    .line(mappingsBlock);

  return {
    get text() {
      return String(str);
    },
    get yaml() {
      return yaml;
    },
  };
}

/** Format one sanitized preview-authority refusal. */
export function previewUnavailable(reason: t.DistServer.StartFailureReason): string {
  return String(
    Str.builder()
      .line(c.yellow('Preview unavailable'))
      .line(c.gray(c.dim(`reason: ${reason}`))),
  );
}

/** Helpers: */
function mappingCoverage(
  evidence: t.Pkg.Dist.Local.Verify.Evidence | undefined,
  destination: string,
): string {
  if (!evidence) return '';
  const relative = destination === '.' ? '' : Str.trimLeadingDotSlash(destination);
  const prefix = relative ? `${relative}/` : '';
  const parts = Obj.entries(evidence.dist.hash.parts).filter(([path]) =>
    !prefix || String(path).startsWith(prefix)
  );
  const totalBytes = parts.reduce((total, [, part]) => {
    const size = Pkg.Dist.Part.parse(part)?.size;
    return total + (Is.num(size) ? size : 0);
  }, 0);
  const files = `${parts.length} ${Str.plural(parts.length, 'file')}`;
  return `${files} | ${Str.bytes(totalBytes)}`;
}
