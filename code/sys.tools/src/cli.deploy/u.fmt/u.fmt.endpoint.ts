import { type t, c, Cli, Fmt, Fs, Str, Time } from '../common.ts';
import { probeProvider } from '../u.push/u.probe.ts';
import { fmtProvider } from './u.fmt.provider.ts';

export async function endpointTable(cwd: t.StringDir, ref: t.DeployTool.Config.EndpointRef) {
  const table = Cli.table();

  const fmtTime = (ts?: t.UnixTimestamp) => {
    if (!ts) return c.gray(c.dim('-'));
    try {
      return c.gray(`${String(Time.elapsed(ts))} ago`);
    } catch {
      return c.gray(String(ts));
    }
  };

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

  const providerFmt = fmtProvider(yaml?.provider);

  let providerProbe: t.PushProbe | undefined;
  try {
    const provider = yaml?.provider;
    if (provider) {
      providerProbe = await probeProvider(provider);
    }
  } catch {
    providerProbe = undefined;
  }

  // Align mapping "second column" under the endpoint value column.
  const baseLabels = [
    'Endpoint',
    childText('config'),
    childText('mappings'),
    ...(providerFmt ? [childText(providerFmt.label)] : []),
    ...(providerFmt && providerProbe && !providerProbe.ok ? [childText('provider probe')] : []),
    childText('created'),
    childText('last used', true),
  ];
  const valuesIndent = baseLabels.reduce((m, s) => Math.max(m, s.length), 0) + 2;

  const body: Array<[string, string]> = [
    [c.gray('Endpoint'), c.cyan(name)],
    [child('config'), c.gray(c.dim(file))],
    [child('mappings'), c.gray(String(mappingsCount))],
  ];

  if (providerFmt) {
    body.push([child(providerFmt.label), providerFmt.value]);
  }

  if (providerFmt && providerProbe && !providerProbe.ok) {
    const reason = String(providerProbe.reason ?? 'unavailable');
    const hint = String(providerProbe.hint ?? '').trim();

    // 1) main row: only the reason (yellow)
    body.push([child('provider probe'), c.yellow(reason)]);

    // 2) second line: install hint (dim), drawn as a nested tree line
    if (hint) {
      const tree = ` ${c.dim(Fmt.Tree.vert)}  `;
      body.push([c.gray(`${tree}`), c.gray(c.dim(c.italic(hint)))]);
    }
  }

  body.push([child('created'), fmtTime(ref.createdAt)]);
  body.push([child('last used', true), fmtTime(ref.lastUsedAt)]);
  table.body(body);

  let mappingsBlock = '';

  try {
    const tail = (p: string) => {
      const parts = Str.splitPathSegments(String(p ?? ''));
      return parts.length ? parts[parts.length - 1]! : String(p ?? '');
    };

    const mappings = yaml?.mappings ?? [];

    if (mappings.length) {
      const mt = Cli.table();

      type Group = {
        readonly mode: string;
        readonly srcNames: readonly string[];
        readonly dsts: readonly string[];
      };

      const groups: Group[] = [];
      const byMode = new Map<string, { srcNames: string[]; dsts: string[] }>();

      for (const m of mappings) {
        const mode = String(m.mode ?? '');
        const src = tail(String(m.dir.source ?? ''));
        const dst = String(m.dir.staging ?? '');

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
        const srcLines = g.srcNames.map((x) => c.white(String(x)));
        const dstLines = g.dsts.map((x) => c.white(String(x)));
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
