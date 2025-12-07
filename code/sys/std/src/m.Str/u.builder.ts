import { type t, SPACE } from './common.ts';

export const builder: t.StrLib['builder'] = (options = {}) => {
  const { eol = '\n', defaultEmpty = SPACE, trimEnd: defaultTrimEnd = true } = options;
  const chunks: string[] = [];

  const render = (opts?: t.StrBuilderToTextOptions) => {
    const { trimEnd = defaultTrimEnd, trailingNewline = false } = opts ?? {};

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

  /**
   * Core builder factory.
   * Everything is expressed as "a builder with a prefix".
   * The root is just prefix === ''.
   */
  const createBuilder = (prefix: string): t.StrBuilder => {
    const self: t.StrBuilder = {
      /**
       * Append a line followed by EOL.
       * Uses `defaultEmpty` when called without an argument.
       */
      line(input: string = defaultEmpty) {
        chunks.push(prefix, String(input), eol);
        return self;
      },

      /**
       * Append `count` blank lines.
       *
       * For the root (prefix === ''), this yields just `eol`.
       * For indented builders, this yields lines with only the prefix.
       */
      blank(count = 1) {
        for (let i = 0; i < count; i += 1) {
          chunks.push(prefix, eol);
        }
        return self;
      },

      /**
       * Append text verbatim (no EOL automatically added, no prefix).
       */
      raw(text: string) {
        chunks.push(text);
        return self;
      },

      /**
       * Append many lines (each item passed through `line`).
       */
      lines(items: readonly string[]) {
        items.forEach((item) => self.line(item));
        return self;
      },

      /**
       * Scoped indentation: all `line()` calls within the callback are prefixed
       * with the given number of spaces, while writing into the same buffer.
       *
       * Nested indentation composes prefixes (e.g., indent(2) inside indent(2)
       * results in 4 spaces).
       */
      indent(spaces: number, fn: (b: t.StrBuilder) => void) {
        const width = Number.isFinite(spaces) && spaces > 0 ? spaces : 0;
        if (!width) {
          // No-op indentation: callback receives the current builder.
          fn(self);
          return self;
        }

        const nestedPrefix = prefix + ' '.repeat(width);
        const nested = createBuilder(nestedPrefix);
        fn(nested);

        return self;
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
      toText(opts?: t.StrBuilderToTextOptions) {
        return render(opts);
      },
    };

    return self;
  };

  // Root builder = "indented builder" with an empty prefix.
  return createBuilder('');
};
