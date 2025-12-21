import { type t, c, Str } from '../common.ts';

export function endpointValidation(
  check: t.DeployTool.EndpointsFs.YamlCheck,
  options: {
    /** Max line width, including indentation (default 78). */
    readonly width?: number;
    /** Max number of errors to show (default 8). */
    readonly limit?: number;
  } = {},
): string {
  if (check.ok) return '';

  const width = options?.width ?? 78;
  const limit = options?.limit ?? 8;

  const errors = check.errors ?? [];
  const count = errors.length;

  type ErrLike = {
    readonly kind?: string;
    readonly message?: string;
    readonly path?: t.ObjectPath;
  };

  const kindOf = (e: unknown): string | undefined => {
    const k = (e as { readonly kind?: unknown }).kind;
    return typeof k === 'string' ? k : undefined;
  };

  const severityOf = (e: unknown): 'error' | 'warn' => {
    const kind = (kindOf(e) ?? '').toLowerCase();
    if (kind.includes('yaml')) return 'error';
    if (kind.includes('parse')) return 'error';
    return 'warn'; // schema + everything else
  };

  const fmtPath = (path?: t.ObjectPath) => {
    if (!path || path.length === 0) return '';
    return ` @ ${path.map((p) => String(p)).join('.')}`;
  };

  const oneLine = (s: string) =>
    String(s ?? '')
      .replace(/\s+/g, ' ')
      .trim();

  const wrap = (text: string, firstIndent: string, nextIndent: string) => {
    const maxFirst = Math.max(10, width - firstIndent.length);
    const maxNext = Math.max(10, width - nextIndent.length);

    const words = text.split(' ').filter(Boolean);
    const lines: string[] = [];

    let i = 0;
    let line = '';
    let max = maxFirst;

    const pushLine = () => {
      if (line) lines.push(line);
      line = '';
    };

    while (i < words.length) {
      const w = words[i] ?? '';
      const candidate = line ? `${line} ${w}` : w;

      if (candidate.length <= max) {
        line = candidate;
        i++;
        continue;
      }

      if (!line) {
        // single giant token → hard cut
        lines.push(w.slice(0, max));
        const rest = w.slice(max);
        if (rest) {
          words[i] = rest;
        } else {
          i++;
        }
      } else {
        pushLine();
      }

      max = maxNext;
    }

    pushLine();

    return lines.map((l, idx) => `${idx === 0 ? firstIndent : nextIndent}${l}`);
  };

  const titleTone = errors.some((e) => severityOf(e) === 'error')
    ? (s: string) => c.red(s)
    : (s: string) => c.yellow(s);

  const bulletTone = (sev: 'error' | 'warn') => {
    if (sev === 'error') return (s: string) => c.red(s);
    return (s: string) => c.yellow(s);
  };

  const b = Str.builder();
  b.line(titleTone(`Errors (${count})`));

  const shown = errors.slice(0, limit);
  for (const err of shown) {
    const e = err as ErrLike;
    const sev = severityOf(err);

    const msg = oneLine(e?.message ?? '-');
    const at = fmtPath(e?.path);
    const full = `${msg}${at}`;

    const lines = wrap(full, bulletTone(sev)('- '), '  ');
    for (const line of lines) b.line(c.gray(line));
    b.line(); // spacer
  }

  if (count > limit) {
    b.line(c.gray(c.dim(`… +${count - limit} more`)));
  }

  return Str.trimEdgeNewlines(String(b));
}
