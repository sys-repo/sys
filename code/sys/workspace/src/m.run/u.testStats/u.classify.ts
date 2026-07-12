import { type t } from '../common.ts';

export type NativeTestTaskClassification =
  | { readonly kind: 'supported'; readonly command: string; readonly tokens: readonly string[] }
  | {
    readonly kind: 'unsupported';
    readonly command: string;
    readonly reason: t.WorkspaceRun.Test.Stats.UnsupportedReason;
    readonly tokens?: readonly string[];
  };

/** Classify a deno task script for safe additive `--junit-path` instrumentation. */
export function classifyNativeTestTask(command: string): NativeTestTaskClassification {
  const trimmed = command.trim();
  if (!trimmed) return wrangle.unsupported(command, 'task:empty');

  const tokens = wrangle.tokenize(trimmed);
  if (!tokens.ok) return wrangle.unsupported(command, tokens.reason);
  if (tokens.tokens[0] !== 'deno' || tokens.tokens[1] !== 'test') {
    return wrangle.unsupported(command, 'task:not-native-deno-test', tokens.tokens);
  }
  if (tokens.tokens.includes('--')) {
    return wrangle.unsupported(command, 'task:unsupported-args', tokens.tokens);
  }
  if (
    tokens.tokens.some((token) => token === '--junit-path' || token.startsWith('--junit-path='))
  ) {
    return wrangle.unsupported(command, 'task:existing-junit-path', tokens.tokens);
  }

  return { kind: 'supported', command, tokens: tokens.tokens };
}

/**
 * Helpers:
 */
const wrangle = {
  unsupported(
    command: string,
    reason: t.WorkspaceRun.Test.Stats.UnsupportedReason,
    tokens?: readonly string[],
  ): NativeTestTaskClassification {
    return { kind: 'unsupported', command, reason, tokens };
  },

  tokenize(command: string):
    | { readonly ok: true; readonly tokens: readonly string[] }
    | { readonly ok: false; readonly reason: t.WorkspaceRun.Test.Stats.UnsupportedReason } {
    const tokens: string[] = [];
    let token = '';
    let quote: 'single' | 'double' | undefined;
    let escaping = false;

    for (const char of command) {
      if (escaping) {
        token += char;
        escaping = false;
        continue;
      }

      if (char === '\\' && quote !== 'single') {
        escaping = true;
        continue;
      }

      if (!quote && wrangle.isShellControl(char)) return { ok: false, reason: 'task:composite' };

      if (char === "'" && !quote) {
        quote = 'single';
        continue;
      }
      if (char === "'" && quote === 'single') {
        quote = undefined;
        continue;
      }
      if (char === '"' && !quote) {
        quote = 'double';
        continue;
      }
      if (char === '"' && quote === 'double') {
        quote = undefined;
        continue;
      }

      if (!quote && /\s/.test(char)) {
        if (token) tokens.push(token);
        token = '';
        continue;
      }

      token += char;
    }

    if (escaping || quote) return { ok: false, reason: 'task:parse-failed' };
    if (token) tokens.push(token);
    return { ok: true, tokens };
  },

  isShellControl(char: string) {
    return char === '&' || char === '|' || char === ';' || char === '<' || char === '>' ||
      char === '\n' || char === '\r';
  },
} as const;
