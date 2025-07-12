import { describe, expect, it } from '../../-test.ts';
import { LooksLike } from './u.LooksLike.ts';

describe('LooksLike', () => {
  describe('LooksLike.yaml (YAML):', () => {
    const cases = [
      {
        name: 'document start marker',
        src: `---
foo: bar`,
        expected: true,
      },
      {
        name: 'top-level key/value pair',
        src: `title: My Document`,
        expected: true,
      },
      {
        name: 'list item',
        src: `
- apples
- oranges`,
        expected: true,
      },
      {
        name: 'plain English text',
        src: 'This is just ordinary prose.',
        expected: false,
      },
      {
        name: 'JavaScript code',
        src: 'const foo = { bar: 123 };',
        expected: false,
      },
    ] as const;

    cases.forEach(({ name, src, expected }) => {
      it(name, () => expect(LooksLike.yaml(src)).to.eql(expected));
    });
  });

  describe('LooksLike.md (markdown)', () => {
    const cases = [
      {
        name: 'ATX heading',
        src: '# Hello World',
        expected: true,
      },
      {
        name: 'horizontal rule',
        src: 'Title\n---\nNext line',
        expected: true,
      },
      {
        name: 'emphasis (*italic*)',
        src: 'This is *italic* text.',
        expected: true,
      },
      {
        name: 'link/image bracket syntax',
        src: '[example](https://example.com)',
        expected: true, // bracket part '[example]' triggers the detector
      },
      {
        name: 'inline math fence',
        src: '$begin:math:text$ x+1 $end:math:text$',
        expected: true,
      },
      {
        name: 'plain prose (negative)',
        src: 'Just a plain sentence with nothing special.',
        expected: false,
      },
      {
        name: 'JavaScript code (negative)',
        src: 'const foo = 123;',
        expected: false,
      },
    ] as const;

    cases.forEach(({ name, src, expected }) => {
      it(name, () => expect(LooksLike.md(src)).to.eql(expected));
    });
  });
});
