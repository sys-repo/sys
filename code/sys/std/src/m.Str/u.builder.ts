import { type t, SPACE } from './common.ts';

export const builder: t.StrLib['builder'] = () => {
  const eol = '\n';
  const chunks: string[] = [];

  const render = (options?: t.StrBuilderToTextOptions) => {
    const { trimEnd = true, trailingNewline = false } = options ?? {};

    let out = chunks.join('');

    if (trimEnd) {
      // Strip trailing whitespace/newlines, preserve internal layout.
      out = out.replace(/[ \t\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000\r\n]+$/u, '');
    }

    if (trailingNewline && !out.endsWith(eol)) {
      out += eol;
    }

    return out;
  };

  const api: t.StrBuilder = {
    /**
     * Append a line followed by EOL. If omitted, uses SPACE as the default.
     */
    line(input: string = SPACE) {
      chunks.push(String(input), eol);
      return api;
    },

    /**
     * Append `count` empty lines (just EOLs).
     */
    blank(count = 1) {
      for (let i = 0; i < count; i += 1) {
        chunks.push(eol);
      }
      return api;
    },

    /**
     * Append text verbatim (no EOL automatically added).
     */
    raw(text: string) {
      chunks.push(text);
      return api;
    },

    /**
     * Append many lines (each item passed through `line`).
     */
    lines(items: readonly string[]) {
      for (const item of items) {
        api.line(item);
      }
      return api;
    },

    /**
     * Render using default shaping (trim trailing whitespace/newlines).
     */
    toString() {
      return render();
    },

    /**
     * Render with per-call shaping overrides.
     */
    toText(options?: t.StrBuilderToTextOptions) {
      return render(options);
    },
  };

  return api;
};
