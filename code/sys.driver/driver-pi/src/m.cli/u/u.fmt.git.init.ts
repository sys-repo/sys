import { c, Cli, Fs, Is, Num, Path, Str, type t } from '../common.ts';

type GitInitFmtOptions = {
  readonly width?: number;
};

const EDGE_MARGIN = 1;
const ELLIPSIS = '..';
const OMISSION_TOKEN = '\u{E000}';
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

type DisplayFit = {
  readonly text: string;
  readonly omission?: { readonly at: number; readonly text: string };
};

function formatTitle(width: number) {
  const budget = Math.max(0, width - SECTION.length);
  const title = formatTextFit(fitToBudget(TITLE, budget), (text) => c.bold(c.green(text)));
  const meta = formatTitleMeta(Math.max(0, budget - visibleWidth(title)));
  return `${title}${meta}`;
}

function formatTitleMeta(budget: number) {
  if (budget <= 0) return '';

  const fitted = fitToBudget(` ${TITLE_META}`, budget);
  if (fitted.text.trim().length === 0 || fitted.text === '.' || fitted.text === ELLIPSIS) return '';
  return formatTextFit(fitted, c.gray);
}

function formatTarget(cwd: t.StringDir, width: number) {
  const path = Fs.join(cwd, '.git');
  const budget = Math.max(0, width - DETAIL.length);
  return formatPathFit(fitDisplayPath(path, budget));
}

function fitDisplayPath(path: string, budget: number): DisplayFit {
  if (budget <= 0) return { text: '' };
  if (visibleWidth(path) <= budget) return { text: path };

  const basename = Path.basename(path);
  if (basename.length === 0 || basename === path) return fitToBudget(path, budget);
  if (visibleWidth(basename) >= budget) return fitToBudget(basename, budget);

  const dirname = Path.dirname(path);
  const separatorWidth = visibleWidth('/');
  const dirBudget = budget - visibleWidth(basename) - separatorWidth;
  if (dirBudget <= 0) return fitToBudget(basename, budget);
  if (visibleWidth(dirname) <= dirBudget) return { text: `${dirname}/${basename}` };

  const left = dirBudget > PATH_DIR_PREFIX_WIDTH + ELLIPSIS.length ? PATH_DIR_PREFIX_WIDTH : 0;
  const right = Math.max(0, dirBudget - left - ELLIPSIS.length);
  const shortenedDir = Str.ellipsize(dirname, [left, right], ELLIPSIS);
  return {
    text: `${shortenedDir}/${basename}`,
    omission: { at: left, text: ELLIPSIS },
  };
}

function fitToBudget(text: string, budget: number): DisplayFit {
  if (budget <= 0) return { text: '' };
  if (visibleWidth(text) <= budget) return { text };
  if (budget === 1) return { text: '.', omission: { at: 0, text: '.' } };
  if (budget === 2) return { text: ELLIPSIS, omission: { at: 0, text: ELLIPSIS } };

  const fitted = Str.ellipsize(text, [0, budget - ELLIPSIS.length], ELLIPSIS);
  return {
    text: fitted,
    omission: { at: fitted.length - ELLIPSIS.length, text: ELLIPSIS },
  };
}

function formatTextFit(fit: DisplayFit, color: (value: string) => string) {
  if (!fit.omission) return color(fit.text);
  const { at, text } = fit.omission;
  return `${color(fit.text.slice(0, at))}${Cli.Fmt.omission(text)}${
    color(fit.text.slice(at + text.length))
  }`;
}

function formatPathFit(fit: DisplayFit) {
  if (!fit.omission) return formatPath(fit.text);

  const { at, text } = fit.omission;
  const display = `${fit.text.slice(0, at)}${OMISSION_TOKEN}${fit.text.slice(at + text.length)}`;
  return Cli.Fmt.path(display, (entry) => {
    const color = entry.is.basename ? c.white : c.gray;
    const index = entry.part.indexOf(OMISSION_TOKEN);
    if (index < 0) return entry.change(color(entry.part));
    return entry.change(
      `${color(entry.part.slice(0, index))}${Cli.Fmt.omission(text)}${
        color(entry.part.slice(index + OMISSION_TOKEN.length))
      }`,
    );
  });
}

function formatPath(path: string) {
  return Cli.Fmt.path(path, (entry) => {
    entry.change(entry.is.basename ? c.white(entry.part) : c.gray(entry.part));
  });
}

function visibleWidth(text: string) {
  return Cli.stripAnsi(text).length;
}
