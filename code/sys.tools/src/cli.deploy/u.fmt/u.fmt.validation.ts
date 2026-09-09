import { c, Is, Str, type t } from '../common.ts';

export function endpointValidation(
  check: t.DeployTool.Endpoint.Fs.YamlCheck,
  options: {
    width?: number; // Max line width, including indentation (default 78).
    limit?: number; // Max number of errors to show (default 8).
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

    // Some upstream errors may include extra fields; we treat them as optional/opaque.
    readonly code?: string;
  };

  const kindOf = (e: unknown): string | undefined => {
    const k = (e as { readonly kind?: unknown }).kind;
    return Is.str(k) ? k : undefined;
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

  const pathKey = (path?: t.ObjectPath) => (path ?? []).map((p) => String(p)).join('.');

  const isPathPrefix = (a?: t.ObjectPath, b?: t.ObjectPath) => {
    const aa = a ?? [];
    const bb = b ?? [];
    if (aa.length === 0) return false;
    if (bb.length < aa.length) return false;
    for (let i = 0; i < aa.length; i++) {
      if (String(aa[i]) !== String(bb[i])) return false;
    }
    return true;
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

  const looksLikeUnionError = (msg: string) => {
    const s = (msg ?? '').toLowerCase();
    return s.includes('expected union value') || (s.includes('union') && s.includes('expected'));
  };

  const pickUnionDetails = (root: ErrLike, max = 3): readonly ErrLike[] => {
    const rootMsg = oneLine(root.message ?? '');
    if (!looksLikeUnionError(rootMsg)) return [];

    const rootPath = root.path ?? [];
    if (rootPath.length === 0) return [];

    // Prefer errors at the same path (or nested under it) with different messages.
    const out: ErrLike[] = [];
    const seen = new Set<string>();

    for (const raw of errors) {
      const e = raw as ErrLike;
      if (e === root) continue;

      const msg = oneLine(e.message ?? '');
      if (!msg) continue;
      if (looksLikeUnionError(msg)) continue;

      if (!(isPathPrefix(rootPath, e.path) || isPathPrefix(e.path, rootPath))) continue;

      const key = `${pathKey(e.path)}|${msg}`;
      if (seen.has(key)) continue;
      seen.add(key);

      out.push(e);
      if (out.length >= max) break;
    }

    return out;
  };

  const b = Str.builder();
  b.line(titleTone(`Errors (${count})`));

  const shown = errors.slice(0, limit);
  for (const err of shown) {
    const e = err as ErrLike;
    const sev = severityOf(err);

    const msg = oneLine(e?.message ?? '-');
    const at = fmtPath(e?.path);

    const k = oneLine(e?.kind ?? '');
    const kindPrefix = k ? c.gray(c.dim(`[${k}] `)) : '';
    const full = `${kindPrefix}${msg}${at}`;

    const lines = wrap(full, bulletTone(sev)('- '), '  ');
    for (const line of lines) b.line(c.gray(line));

    const details = pickUnionDetails(e, 3);
    for (const d of details) {
      const dMsg = oneLine(d?.message ?? '');
      const dAt = fmtPath(d?.path);
      const dFull = `${dMsg}${dAt}`;
      const dLines = wrap(dFull, c.gray(c.dim('  - ')), c.gray(c.dim('    ')));
      for (const line of dLines) b.line(line);
    }
  }

  if (count > limit) {
    b.line(c.gray(c.dim(`… +${count - limit} more`)));
  }

  return Str.trimEdgeNewlines(String(b));
}
