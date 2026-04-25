import { c, Cli, Fs, Is, Num, Path, Str, type t } from './common.ts';

type GitInitFmtOptions = {
  readonly width?: number;
};

const EDGE_MARGIN = 1;
const ELLIPSIS = '..';
const PATH_DIR_PREFIX_WIDTH = 4;
const SECTION = '  ';
const DETAIL = '    ';
const TITLE = 'Agent:Directory Setup' as const;
const TITLE_META = '· read, write, edit, bash' as const;
const BODY = [
  'This directory is not inside a git repository.',
  'Initialize one here to continue.',
] as const;
const ADDS = ['.gitignore', '.gitattributes (Git LFS)'] as const;

export const GitInitFmt = {
  block(cwd: t.StringDir, opts: GitInitFmtOptions = {}) {
    const width = renderWidth(opts.width);
    const target = formatTarget(cwd, width);
    const title = formatTitle(width);
    const str = Str.builder();

    str.line(Cli.Fmt.hr(width, 'green'));
    str.line(`${SECTION}${title}`);
    str.blank();
    for (const line of BODY) {
      for (const wrapped of wrapLine(line, SECTION, width)) str.line(wrapped);
    }
    str.blank();
    str.line(`${SECTION}${c.gray('Target')}`);
    str.line(`${DETAIL}${target}`);
    str.blank();
    str.line(`${SECTION}${c.gray('Adds')}`);
    for (const item of ADDS) str.line(`${DETAIL}• ${item}`);
    str.line(Cli.Fmt.hr(width, 'green'));

    return Str.trimEdgeNewlines(String(str));
  },
} as const;

function renderWidth(width = Cli.Screen.size().width) {
  const measured = Is.num(width) && width > 0 ? width : Cli.Screen.size().width;
  return Num.clamp(0, measured, measured - EDGE_MARGIN);
}

function wrapLine(text: string, indent: string, width: number) {
  const budget = Math.max(10, width - indent.length);
  const words = text.split(' ').filter(Boolean);
  const lines: string[] = [];

  let cursor = 0;
  let line = '';

  while (cursor < words.length) {
    const word = words[cursor] ?? '';
    const next = line ? `${line} ${word}` : word;

    if (visibleWidth(next) <= budget) {
      line = next;
      cursor += 1;
      continue;
    }

    if (!line) {
      lines.push(word.slice(0, budget));
      const rest = word.slice(budget);
      if (rest) words[cursor] = rest;
      else cursor += 1;
      continue;
    }

    lines.push(line);
    line = '';
  }

  if (line) lines.push(line);
  return lines.map((entry) => `${indent}${entry}`);
}

function formatTitle(width: number) {
  const budget = Math.max(0, width - SECTION.length);
  const title = fitToBudget(TITLE, budget);
  const meta = formatTitleMeta(Math.max(0, budget - visibleWidth(title)));
  return `${c.bold(c.green(title))}${meta ? c.gray(meta) : ''}`;
}

function formatTitleMeta(budget: number) {
  if (budget <= 0) return '';

  const meta = ` ${TITLE_META}`;
  if (visibleWidth(meta) <= budget) return meta;

  const fitted = fitToBudget(meta, budget);
  return fitted.trim().length > 0 && fitted !== '.' && fitted !== '..' ? fitted : '';
}

function formatTarget(cwd: t.StringDir, width: number) {
  const path = Fs.join(cwd, '.git');
  const budget = Math.max(0, width - DETAIL.length);
  const fitted = fitDisplayPath(path, budget);
  return Cli.Fmt.path(fitted, (e) => {
    if (e.is.basename) e.change(c.white(e.part));
    else e.change(c.gray(e.part));
  });
}

function fitDisplayPath(path: string, budget: number) {
  if (budget <= 0) return '';
  if (visibleWidth(path) <= budget) return path;

  const basename = Path.basename(path);
  if (basename.length === 0 || basename === path) return fitToBudget(path, budget);
  if (visibleWidth(basename) >= budget) return fitToBudget(basename, budget);

  const dirname = Path.dirname(path);
  const separatorWidth = visibleWidth('/');
  const dirBudget = budget - visibleWidth(basename) - separatorWidth;
  if (dirBudget <= 0) return fitToBudget(basename, budget);
  if (visibleWidth(dirname) <= dirBudget) return `${dirname}/${basename}`;

  const left = dirBudget > PATH_DIR_PREFIX_WIDTH + ELLIPSIS.length ? PATH_DIR_PREFIX_WIDTH : 0;
  const right = Math.max(0, dirBudget - left - ELLIPSIS.length);
  const shortenedDir = Str.ellipsize(dirname, [left, right], ELLIPSIS);
  return `${shortenedDir}/${basename}`;
}

function fitToBudget(text: string, budget: number) {
  if (budget <= 0) return '';
  if (visibleWidth(text) <= budget) return text;
  if (budget === 1) return '.';
  if (budget === 2) return ELLIPSIS;
  return Str.ellipsize(text, [0, budget - ELLIPSIS.length], ELLIPSIS);
}

function visibleWidth(text: string) {
  return Cli.stripAnsi(text).length;
}
