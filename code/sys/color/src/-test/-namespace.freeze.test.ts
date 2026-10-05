import { describe, expect, it } from '../-test/mod.ts';
import { c, Color as AnsiColor } from '../m.Ansi/mod.ts';
import { escape } from '../m.Ansi/u.escape.ts';
import { foreground } from '../m.Ansi/u.foreground.ts';
import { Color } from '../m.Rgb/m.Color/mod.ts';
import { Theme } from '../m.Rgb/m.Theme/mod.ts';

describe('color namespace freeze contract', () => {
  it('freezes every exported namespace API and nested namespace', () => {
    const namespaces = [
      AnsiColor,
      AnsiColor.foreground,
      AnsiColor.escape,
      AnsiColor.rgb,
      Color,
      Color.Theme,
      Theme,
    ];
    for (const namespace of namespaces) expect(Object.isFrozen(namespace)).to.eql(true);

    expect(AnsiColor.foreground).to.equal(foreground);
    expect(AnsiColor.escape).to.equal(escape);
    expect(AnsiColor.rgb).to.equal(Color);
    expect(Color.Theme).to.equal(Theme);
  });

  it('classifies the ANSI ESM module namespace exception', () => {
    const ansi = AnsiColor.ansi;

    expect(ansi).to.equal(c);
    expect(Object.isExtensible(ansi)).to.eql(false);
    expect(Object.isSealed(ansi)).to.eql(true);
    expect(Object.isFrozen(ansi)).to.eql(false);
    expect(Reflect.set(ansi, 'red', ansi.red)).to.eql(false);
  });
});
