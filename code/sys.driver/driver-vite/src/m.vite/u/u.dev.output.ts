import { Is, stripAnsi, type t } from '../common.ts';

type Source = t.Process.StdStream;

type Line = {
  readonly index: number;
  readonly source: Source;
  readonly text: string;
};

type State = {
  readonly lines: Line[];
  readonly pending: Record<Source, string>;
  readonly pendingIndex: Record<Source, number | undefined>;
  nextIndex: number;
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
      pendingIndex: { stdout: undefined, stderr: undefined },
      nextIndex: 1,
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

      clearLines() {
        state.lines.splice(0);
        state.pending.stdout = '';
        state.pending.stderr = '';
        state.pendingIndex.stdout = undefined;
        state.pendingIndex.stderr = undefined;
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
    const pending = parts.pop() ?? '';
    const pendingIndex = state.pendingIndex[source];

    parts.forEach((line, index) => {
      const lineIndex = index === 0 ? pendingIndex : undefined;
      wrangle.pushLine(state, source, line, maxLines, lineIndex);
    });

    state.pending[source] = pending;
    state.pendingIndex[source] = stripAnsi(pending).trim()
      ? parts.length === 0 ? pendingIndex ?? wrangle.nextIndex(state) : wrangle.nextIndex(state)
      : undefined;
  },

  pushLine(state: State, source: Source, text: string, maxLines: number, index?: number) {
    if (!stripAnsi(text).trim()) return;
    state.lines.push({ index: index ?? wrangle.nextIndex(state), source, text });
    while (state.lines.length > maxLines) state.lines.shift();
  },

  snapshot(state: State, maxLines: number): readonly Line[] {
    if (maxLines === 0) return [];
    const pending: Line[] = [];
    wrangle.pushPendingLine(state, pending, 'stdout', state.pending.stdout);
    wrangle.pushPendingLine(state, pending, 'stderr', state.pending.stderr);
    return [...state.lines, ...pending].slice(-maxLines);
  },

  pushPendingLine(state: State, lines: Line[], source: Source, text: string) {
    if (!stripAnsi(text).trim()) return;
    lines.push({ index: state.pendingIndex[source] ?? state.nextIndex, source, text });
  },

  nextIndex(state: State) {
    return state.nextIndex++;
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
