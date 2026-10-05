import { SPACE, type t } from '../common.ts';

export const builder: t.Str.Lib['builder'] = (options = {}) => {
  const {
    eol = '\n',
    defaultEmpty = SPACE,
    defaultBlank = SPACE,
    trimEnd: defaultTrimEnd = true,
  } = options;
  const chunks: string[] = [];

  const render = (options?: t.Str.Builder.ToTextOptions) => {
    const { trimEnd = defaultTrimEnd, trailingNewline = false } = options ?? {};
    let output = chunks.join('');

    if (trimEnd) {
      // Preserve Str.SPACE (ZWSP): it encodes intentional CLI/TTY whitespace.
      output = output.replace(
        /[ \t\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000\r\n]+$/u,
        '',
      );
    }

    if (trailingNewline && !output.endsWith(eol)) output += eol;
    return output;
  };

  const createBuilder = (prefix: string): t.Str.Builder => {
    const appendLines = (content: string, count: number) => {
      let remaining = count;
      while (remaining > 0) {
        chunks.push(prefix, content, eol);
        remaining -= 1;
      }
    };

    const self: t.Str.Builder = {
      line(input = defaultEmpty) {
        chunks.push(prefix, String(input), eol);
        return self;
      },

      blank(count = 1) {
        appendLines(defaultBlank, count);
        return self;
      },

      empty(count = 1) {
        appendLines('', count);
        return self;
      },

      raw(text) {
        chunks.push(text);
        return self;
      },

      lines(items) {
        items.forEach((item) => self.line(item));
        return self;
      },

      indent(spaces, fn) {
        const width = Number.isFinite(spaces) && spaces > 0 ? spaces : 0;
        if (width === 0) {
          fn(self);
          return self;
        }

        fn(createBuilder(prefix + ' '.repeat(width)));
        return self;
      },

      toString() {
        return render();
      },

      toText(options) {
        return render(options);
      },
    };

    return self;
  };

  return createBuilder('');
};
