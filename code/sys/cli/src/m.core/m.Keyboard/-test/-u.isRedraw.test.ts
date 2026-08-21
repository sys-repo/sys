import { describe, expect, it } from '../../../-test.ts';
import { Cli } from '../../m.Cli/mod.ts';

const exact = {
  key: 'r',
  ctrlKey: false,
  altKey: false,
  metaKey: false,
  shiftKey: false,
} as const;
const rejected = [
  { ...exact, key: 'R' },
  { ...exact, key: 'x' },
  { ...exact, ctrlKey: true },
  { ...exact, altKey: true },
  { ...exact, metaKey: true },
  { ...exact, shiftKey: true },
];
const incomplete = [
  { ctrlKey: false, altKey: false, metaKey: false, shiftKey: false },
  { key: 'r', altKey: false, metaKey: false, shiftKey: false },
  { key: 'r', ctrlKey: false, metaKey: false, shiftKey: false },
  { key: 'r', ctrlKey: false, altKey: false, shiftKey: false },
  { key: 'r', ctrlKey: false, altKey: false, metaKey: false },
];

describe('Cli.Keyboard.isRedraw', () => {
  it('admits only unmodified lowercase r', () => {
    expect(Cli.Keyboard.isRedraw(exact)).to.eql(true);
    for (const event of rejected) expect(Cli.Keyboard.isRedraw(event)).to.eql(false);
  });

  it('rejects every missing key or modifier field', () => {
    for (const event of incomplete) expect(Cli.Keyboard.isRedraw(event)).to.eql(false);
  });
});
