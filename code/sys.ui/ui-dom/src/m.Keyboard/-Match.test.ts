import { describe, it, expect, type t } from '../-test.ts';
import { Keyboard } from './mod.ts';

describe('Keyboard.Match', () => {
  it('parse.pattern', () => {
    const test = (input: t.KeyPattern, expected: string[]) => {
      const res = Keyboard.Match.pattern(input);
      expect(res.pattern).to.eql(expected);
    };

    [undefined, null, {}, [], 123, true].forEach((value) => test(value as any, []));
    test('', []);
    test('  ', []);
    test('KeyP', ['KeyP']);
    test('p', ['p']);
    test('P', ['P']);

    test('=', ['=']);
    test('\\+', ['+']); // NB: escape character on divider.
    test('ALT + \\+', ['ALT', '+']);
    test(' SHIFT  +ALT    + P + KeyL ', ['SHIFT', 'ALT', 'P', 'KeyL']);
    test('shift + alt + ctrl + meta + K', ['SHIFT', 'ALT', 'CTRL', 'META', 'K']);
    test('cmd + K', ['META', 'K']); // NB: CMD converted to META.
  });

  it('parse.isMatch', () => {
    const test = (
      input: t.KeyPattern,
      pressed: string[],
      modifiers: Partial<t.KeyboardModifierFlags>,
      expected: boolean,
    ) => {
      const pattern = Keyboard.Match.pattern(input);
      const res = pattern.isMatch(pressed, modifiers);
      expect(res).to.eql(expected, input);
    };

    test('cmd + p', ['p'], {}, false);
    test('cmd + p', ['p'], { meta: true }, true);
    test('cmd + KeyP', ['KeyP'], { meta: true }, true);
    test('cmd + P', ['p'], { meta: true }, true); // NB: case-insensitive.
    test('cmd + p', ['P'], { meta: true }, true); // NB: case-insensitive.
    test('cmd + p', ['p'], { meta: true, shift: true }, false);
    test('cmd + Shift + p', ['p'], { meta: true, shift: true }, true);

    test('cmd + P', ['A'], { meta: true }, false);
    test('cmd + P', [], { meta: true }, false);
    test('cmd + P', ['P'], { meta: true }, true);

    test('Cmd', [], { meta: true }, true);
    test('Cmd', [], { meta: true, shift: false }, true);
    test('Cmd + meta', [], { meta: true }, true);
    test('Meta', [], { meta: true }, true);
    test('Shift', [], { shift: true }, true);
    test('Alt', [], { alt: true }, true);
    test('Ctrl', [], { ctrl: true }, true);
    test('Cmd + SHIFT', [], { meta: true, shift: true }, true);
    test('Cmd + SHIFT', [], { meta: true, shift: true, alt: true }, false);

    test('k', ['k'], {}, true);
    test('k', [], {}, false);
    test('k + P', ['k'], {}, false);
    test('k + P', ['k', 'p'], {}, true);
    test('k + P', ['k', 'p', 'F'], {}, true);

    test('KeyP', ['KeyP'], {}, true);
    test('KeyP + NumpadAdd', ['KeyP', 'NumpadAdd'], {}, true);
  });
});
