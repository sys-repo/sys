import { Is, stripAnsi, type t } from './common.ts';

type Source = t.Process.StdStream;

type Line = {
  readonly source: Source;
  readonly text: string;
};

type State = {
  readonly lines: Line[];
  readonly pending: Record<Source, string>;
  stderr: string;
};

const DEFAULT_MAX_LINES = 40;
const DEFAULT_MAX_STDERR_CHARS = 60_000;

/** Capture bounded child-process output for dev startup diagnostics and future reporters. */
export const DevOutputLog = {
  create(options: { maxLines?: number; maxStderrChars?: number } = {}) {
    const maxLines = wrangle.maxLines(options.maxLines);
    const maxStderrChars = wrangle.maxStderrChars(options.maxStderrChars);
    const state: State = {
      lines: [],
      pending: { stdout: '', stderr: '' },
      stderr: '',
    };

    return {
      push(e: t.Process.Event) {
        const text = e.toString();
        const source = e.source;
        if (source === 'stderr') wrangle.pushStderr(state, text, maxStderrChars);
        wrangle.pushText(state, source, text, maxLines);
      },

      stderr() {
        return state.stderr;
      },

      lines() {
        return wrangle.snapshot(state, maxLines);
      },

      tailText() {
        return wrangle.tailText(wrangle.snapshot(state, maxLines));
      },
    } as const;
  },
} as const;

/**
 * Helpers:
 */
const wrangle = {
  maxLines(input?: number) {
    return Is.num(input) ? Math.max(0, Math.floor(input)) : DEFAULT_MAX_LINES;
  },

  maxStderrChars(input?: number) {
    return Is.num(input) ? Math.max(0, Math.floor(input)) : DEFAULT_MAX_STDERR_CHARS;
  },

  pushStderr(state: State, text: string, maxStderrChars: number) {
    state.stderr = `${state.stderr}${text}`.slice(-maxStderrChars);
  },

  pushText(state: State, source: Source, input: string, maxLines: number) {
    const text = input.replaceAll('\r', '\n');
    const parts = `${state.pending[source]}${text}`.split('\n');
    state.pending[source] = parts.pop() ?? '';

    parts.forEach((line) => wrangle.pushLine(state, source, line, maxLines));
  },

  pushLine(state: State, source: Source, text: string, maxLines: number) {
    if (!stripAnsi(text).trim()) return;
    state.lines.push({ source, text });
    while (state.lines.length > maxLines) state.lines.shift();
  },

  snapshot(state: State, maxLines: number): readonly Line[] {
    if (maxLines === 0) return [];
    const pending: Line[] = [];
    wrangle.pushPendingLine(pending, 'stdout', state.pending.stdout);
    wrangle.pushPendingLine(pending, 'stderr', state.pending.stderr);
    return [...state.lines, ...pending].slice(-maxLines);
  },

  pushPendingLine(lines: Line[], source: Source, text: string) {
    if (stripAnsi(text).trim()) lines.push({ source, text });
  },

  tailText(lines: readonly Line[]) {
    return lines
      .map((line) => {
        const source = line.source === 'stderr' ? 'err' : 'out';
        return ` ${source}   ${stripAnsi(line.text).trimEnd()}`;
      })
      .join('\n');
  },
} as const;
