import { Cli, c } from '@sys/cli';
import { Fs } from '@sys/fs';
import { Str } from '@sys/std';
import { Token } from '@sys/text/gpt';
import { DenoFile } from './common.ts';
import { makeHeader } from './Task.-copy.u.header.ts';

type Section = {
  header: Awaited<ReturnType<typeof makeHeader>>;
  body: string; //      trimmed body (no trailing newline)
  block: string; //     full rendered block including sentinels + header + body + end sentinel + newline
  lines: number; //     number of lines in `block`
  bytes: number; //     bytes in `block` when UTF-8 encoded
  tokens: number; //    total number GPT tokens.
};

const shaPreview = (hex: string, lead = 12) =>
  hex.length <= lead ? hex : `${hex.slice(0, lead)}..`;

const enc = new TextEncoder();
const countLines = (s: string) =>
  s === '' ? 0 : s.split('\n').length - (s.endsWith('\n') ? 0 : 1);

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Build a single concatenated string from a list of file paths.
 * Emits a TOC with totals + per-file lineStart offsets, and wraps each file with FILE BEGIN/END sentinels.
 */
export async function pathsToFileStrings(paths: string[], repoRootAbs: string) {
  const sections: Section[] = [];

  // First pass: build each section block and capture sizes.
  for (const path of paths) {
    const res = await Fs.readText(path);
    if (!res.data) continue;

    const body = res.data.trimEnd();
    const denofile = path.endsWith('/deno.json') ? undefined : await DenoFile.nearest(path);
    const header = await makeHeader(path, repoRootAbs, denofile);

    // Render block (always ends with a newline)
    const block = '# === FILE:BEGIN ===\n' + header.toString() + body + '\n# === FILE:END ===\n\n';

    const lines = countLines(block);
    const bytes = enc.encode(block).length;
    const tokens = Token.count(body);

    sections.push({ header, body, block, lines, bytes, tokens });
  }

  // Totals (of the file blocks section only — everything after the TOC).
  const blocksJoined = sections.map((s) => s.block).join('');
  const bytesTotal = enc.encode(blocksJoined).length;
  const shaBundle = await sha256(blocksJoined);

  // Compute per-file lineStart offsets (1-based), relative to the whole bundle.
  // TOC line count is deterministic and independent of offsets:
  //   1 line:  "# === TOC:BEGIN ==="
  //   1 line:  "# files: N"
  //   N lines: entries
  //   1 line:  "# bytes.total: X"
  //   1 line:  "# sha256.bundle: <full hash>"
  //   1 line:  "# === TOC:END ==="
  //   1 line:  ""  (blank spacer)
  const tocFixedLines = 1 + 1 + sections.length + 1 + 1 + 1 + 1;

  // Correct the effective TOC line count (includes tokens + token.urn + extra spacer)
  // We currently emit extra TOC lines:
  //   +1 line: "# tokens: <sum of bodies>"
  //   +1 line: "# tokens.urn: <urn string>"
  //   +1 line: ""  (second blank spacer)
  const tocEffectiveLines = tocFixedLines + 3;

  let running = tocEffectiveLines + 1; // first file begins after the blank spacer; 1-based line number
  const lineStarts: number[] = [];
  for (const s of sections) {
    lineStarts.push(running);
    running += s.lines;
  }

  // Build compact TOC (use preview hash here; full hash is in headers and summary).
  const pad3 = (n: number) => String(n).padStart(3, '0');
  const tocLines = sections.map((s, i) => {
    const idx = pad3(i + 1);
    const bytes = `${s.header.bytes}B`;
    const sha = shaPreview(s.header.sha256, 12);
    const mod = s.header.module;
    const lang = s.header.lang;
    const pmod = s.header.path.module;
    const lineStart = lineStarts[i];
    return `# ${idx} | ${lang} | ${bytes} | ${sha} | ${mod} | ${pmod} | lineStart=${lineStart}`;
  });

  const tokenCount = sections.reduce((acc, next) => acc + next.tokens, 0);

  const tocHeader = [
    `# tokens: ${tokenCount}`,
    `# tokens.urn: ${Token.info.urn}`,
    `# files: ${sections.length}`,
    `# files.bytes: ${bytesTotal} B`,
    `# files.sha256: ${shaBundle}`,
  ];

  const toc = [
    //
    '# === TOC:BEGIN ===',
    ...tocHeader,
    ...tocLines,
    '# === TOC:END ===',
  ].join('\n');

  const stats = [
    //
    '# === STATS:BEGIN ===',
    ...tocHeader,
    '# === STATS:END ===',
  ].join('\n');

  // Assemble final:
  return `${toc}\n\n${blocksJoined}${stats}\n`;
}

type SelectAndCopyOptions = {
  dir: string;
  repoRootAbs: string;
  message: string;
  totalLabel?: string;
  defaultChecked?: (path: string) => boolean;
  sort?: boolean;
  maxRows?: number;
};

export async function selectAndCopy(paths: string[], opts: SelectAndCopyOptions) {
  const {
    dir,
    repoRootAbs,
    message,
    totalLabel = 'files',
    defaultChecked = () => false,
    sort = false,
    maxRows = 20,
  } = opts;

  console.info(Str.SPACE);
  console.info(c.gray(`Total: ${paths.length.toLocaleString()} ${totalLabel}`));

  let options = paths.map((path) => {
    const name = path.slice(dir.length + 1);
    const checked = defaultChecked(path);
    return {
      name: checked ? c.green(name) : name,
      value: path,
      checked,
    };
  });

  if (sort) options = options.sort((a, b) => a.value.localeCompare(b.value));

  const selected = await Cli.Prompt.Checkbox.prompt({
    message,
    options,
    check: c.green('●'),
    uncheck: c.gray('○'),
    maxRows,
  });

  if (selected.length > 0) {
    const text = await pathsToFileStrings(selected, repoRootAbs);

    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    Cli.copyToClipboard(text);

    const tokens = Token.count(text);
    const total = selected.length;
    const filesLabel = Str.plural(total, 'file', 'files');
    const linesLabel = Str.plural(lines.length, 'line', 'lines');
    const tokensLabel = Str.plural(tokens, 'token', 'tokens');

    let stats = `${lines.length.toLocaleString()} ${linesLabel}`;
    stats += `, ${tokens.toLocaleString()} ${tokensLabel}`;

    let msg = '\n';
    msg += `${total.toLocaleString()} ${filesLabel}`;
    msg += ` (${c.white(c.bold(`${stats}`))})`;
    msg += ` copied to clipboard\n`;

    console.info(c.gray(msg));
  } else {
    console.info(c.gray('\nNo files selected.\n'));
  }
}
