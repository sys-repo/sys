import { type t, c, Cli, Fmt, Fs, Is, Pkg, Str } from '../common.ts';
import { Provider } from '../u.providers/mod.ts';
import { fmtProvider } from './u.fmt.provider.ts';

export async function endpointTable(cwd: t.StringDir, ref: t.DeployTool.Config.EndpointRef) {
  const table = Cli.table();

  const childText = (label: string, isLast = false) => ` ${Fmt.Tree.branch(isLast)} ${label}`;
  const child = (label: string, isLast = false) =>
    c.gray(` ${c.dim(Fmt.Tree.branch(isLast))} ${label}`);

  // Never feed Ansi helpers undefined.
  const name = String(ref.name ?? '');
  const file = String(ref.file ?? '');

  // Read YAML once (provider + mappings); never throw.
  let yaml: t.EndpointYamlFile | undefined;
  try {
    const abs = Fs.join(cwd, file);
    const res = await Fs.readYaml<t.EndpointYamlFile>(abs);
    yaml = res.ok ? res.data : undefined;
  } catch {
    yaml = undefined;
  }

  const mappingsCount = yaml?.mappings?.length ?? 0;
  const shardTotal = yaml?.provider?.kind === 'orbiter' ? yaml?.provider?.shards?.total : undefined;
  const mappingsLabel =
    Is.num(shardTotal) && Number.isFinite(shardTotal) && shardTotal > 0
      ? `${mappingsCount} ${Str.plural(mappingsCount, 'bundle')} over ${c.white(`${shardTotal}-shards`)}`
      : `${String(mappingsCount)} ${Str.plural(mappingsCount, 'bundle')}`;
  const providerFmt = fmtProvider(yaml?.provider);
  const providerDomain =
    yaml?.provider?.kind === 'orbiter' ? String(yaml.provider.domain ?? '').trim() : '';

  let providerProbe: t.PushProbe | undefined;
  try {
    const provider = yaml?.provider;
    if (provider) providerProbe = await Provider.probe(cwd, provider);
  } catch {
    providerProbe = undefined;
  }

  // Align mapping "second column" under the endpoint value column.
  const baseLabels = [
    'Endpoint',
    childText('config'),
    childText('mappings'),
    ...(providerFmt ? [childText(providerFmt.label)] : []),
    ...(providerDomain ? [childText('domain')] : []),
    ...(providerFmt && providerProbe && !providerProbe.ok
      ? [childText('provider probe', true)]
      : []),
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
    rows.push({ label: 'domain', value: c.white(`https://${providerDomain}`) });
  }

  const body: Array<[string, string]> = [[c.gray('Endpoint'), c.cyan(name)]];

  rows.forEach((row, index) => {
    const isLast =
      index === rows.length - 1 && !(providerFmt && providerProbe && !providerProbe.ok);
    body.push([child(row.label, isLast), row.value]);
  });

  if (providerFmt && providerProbe && !providerProbe.ok) {
    const reason = String(providerProbe.reason ?? 'unavailable');
    const hint = String(providerProbe.hint ?? '').trim();

    // 1) main row: only the reason (yellow)
    body.push([child('provider probe', true), c.yellow(reason)]);

    // 2) second line: install hint (dim), drawn as a nested tree line
    if (hint) {
      const tree = ` ${c.dim(Fmt.Tree.vert)}  `;
      body.push([c.gray(`${tree}`), c.gray(c.dim(c.italic(hint)))]);
    }
  }

  table.body(body);

  let mappingsBlock = '';

  try {
    const tail = (p: string) => {
      const parts = Str.splitPathSegments(String(p ?? ''));
      return parts.length ? parts[parts.length - 1]! : String(p ?? '');
    };

    const mappings = yaml?.mappings ?? [];
    const stagingRootRel = String(yaml?.staging?.dir ?? '').trim() || '.';
    const stagingRootAbs = Fs.join(cwd, stagingRootRel);
    const hashSuffix = (digest?: string) => {
      const value = String(digest ?? '').trim();
      if (!value) return '';
      return `${c.dim(c.gray('#'))}${c.green(value.slice(-5))}`;
    };

    if (mappings.length) {
      const mt = Cli.table();

      type Group = {
        readonly mode: string;
        readonly srcNames: readonly string[];
        readonly dsts: readonly { readonly path: string; readonly hash: string }[];
      };

      const groups: Group[] = [];
      const byMode = new Map<string, { srcNames: string[]; dsts: Array<{ path: string; hash: string }> }>();

      for (const m of mappings) {
        const mode = String(m.mode ?? '');
        const src = tail(String(m.dir.source ?? ''));
        const dstRaw = String(m.dir.staging ?? '');
        const targetAbs = Fs.join(stagingRootAbs, dstRaw || '.');
        const dist = (await Pkg.Dist.load(targetAbs)).dist;
        const hash = hashSuffix(dist?.hash?.digest);
        const dst = { path: dstRaw, hash };

        const hit = byMode.get(mode);
        if (hit) {
          hit.srcNames.push(src);
          hit.dsts.push(dst);
        } else {
          const next = { srcNames: [src], dsts: [dst] };
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
          if (!d.hash) return path;
          const pad = ' '.repeat(Math.max(1, maxDstPathLen - d.path.length + 1));
          return `${path}${pad}${d.hash}`;
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
