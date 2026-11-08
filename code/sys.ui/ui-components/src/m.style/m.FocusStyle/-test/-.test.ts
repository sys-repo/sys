import { afterAll, beforeAll, describe, expect, expectTypeOf, it } from '@sys/testing/server';
import { DomMock } from '@sys/testing/server/dom';
import { FocusStyle } from '@sys/ui-components/style/focus';
import { Color, css, Obj, Style, type t } from '../common.ts';
import { base, focus, halo, outline, rules } from './u.fixture.ts';

describe('FocusStyle', () => {
  DomMock.init({ beforeAll, afterAll });

  it('standard outline recipe → one palette and geometry with caller-owned token names', () => {
    const recipe = FocusStyle.outline('--example-focus');
    expectTypeOf(recipe).toEqualTypeOf<t.FocusStyle.Outline>();
    expect(recipe).to.eql({
      base: { borderRadius: 1 },
      paint: {
        defaults: {
          '--example-focus-accent': Color.BLUE,
          '--example-focus-rest': Color.alpha(Color.BLUE, 0.2),
          '--example-focus-width': '2px',
          '--example-focus-offset': '2px',
        },
        arrival: { outlineColor: 'var(--example-focus-accent)' },
        settled: {
          outline: 'var(--example-focus-width) solid var(--example-focus-rest)',
          outlineOffset: 'var(--example-focus-offset)',
        },
        forcedColors: {
          outline: 'var(--example-focus-width) solid Highlight',
          outlineOffset: 'var(--example-focus-offset)',
        },
      },
    });
  });

  it('types the three consumers without component props or a recomposable result', () => {
    const button = FocusStyle.compose({ base: { borderRadius: 1 }, paint: outline });
    const child = FocusStyle.compose({
      base: { position: 'absolute' },
      paint: outline,
      via: '--run-focus',
    });
    const toggle = FocusStyle.compose({ base: { borderRadius: 16 }, paint: halo });
    expectTypeOf(button).toEqualTypeOf<t.FocusStyle.Target>();
    expectTypeOf(child).toEqualTypeOf<t.FocusStyle.Child>();
    expectTypeOf(toggle).toEqualTypeOf<t.FocusStyle.Target>();
    expectTypeOf(child.activation[':focus-visible']).toEqualTypeOf<Readonly<t.Style.Props>>();
    expect(Obj.keys(button)).to.eql(['class']);
    expect(Obj.keys(child)).to.eql(['class', 'activation']);
  });

  it('holds arrival immediately, then settles to ordinary paint without forwards fill', () => {
    const result = FocusStyle.compose({ paint: outline });
    expect(focus(result)).to.include(outline.settled);
    expect(focus(result)?.animation).to.eql(
      '220ms ease-out 70ms 1 normal backwards running var(--sys-focus-animation)',
    );
    expect(base(result)['--sys-focus-arrival-outline']).to.eql('blue');
    const name = base(result)['--sys-focus-animation'];
    const items = Style.Dom.stylesheet().rules.items;
    const frames = items.filter((item) => item.rule.startsWith(`@keyframes ${name} `));
    expect(frames.map((item) => item.style)).to.eql([
      { outlineColor: 'var(--sys-focus-arrival-outline)' },
    ]);
    expect(frames[0].selector).to.eql('from');
  });

  it('composes settled link decoration with the outline and replaces both on caller override', () => {
    const paint: t.FocusStyle.Paint = {
      ...outline,
      settled: { ...outline.settled, textDecoration: 'underline solid currentColor' },
    };
    const result = FocusStyle.compose({ paint });
    expect(focus(result)).to.include(paint.settled);
    expect(base(result)).not.to.have.property('textDecoration');

    for (const replacement of [{ outline: '3px dotted red' }, {}, undefined]) {
      const custom = FocusStyle.compose({ paint, style: { ':focus-visible': replacement } });
      expect(focus(custom)).to.eql(replacement);
      expect(Obj.keys(base(custom)).filter((key) => key.startsWith('--sys-focus'))).to.eql([]);
      expect(rules(custom).filter((item) => item.rule.startsWith('@media'))).to.eql([]);
    }
  });

  it('registers preferences against the final composed target after ordinary declarations', () => {
    const result = FocusStyle.compose({
      base: { padding: 1 },
      style: [{ padding: 4 }, css({ borderRadius: 5 })],
      paint: outline,
    });
    const own = rules(result);
    expect(base(result).padding).to.eql(4);
    expect(base(result).borderRadius).to.eql(5);
    expect(own.map((item) => item.selector)).to.eql([
      `.${result.class}`,
      `.${result.class}:focus-visible`,
      `.${result.class}`,
      `.${result.class}`,
      `.${result.class}:focus-visible`,
    ]);
    expect(own[2].rule).to.include('@media (prefers-reduced-motion: reduce)');
    expect(own[2].style).to.eql({ '--sys-focus-animation': 'none' });
    expect(own[3].rule).to.include('@media (forced-colors: active)');
    expect(own[3].style).to.eql({ '--sys-focus-animation': 'none' });
    expect(own[4].style).to.eql({
      outline: 'var(--sys-focus-forced-outline)',
      outlineOffset: 'var(--sys-focus-forced-offset)',
    });
    expect(base(result)['--sys-focus-forced-outline']).to.eql(outline.forcedColors.outline);
    expect(own[4].rule).not.to.include('forced-color-adjust');
  });

  it('keeps paint-structure names stable across palettes and isolates different structures', () => {
    const first = FocusStyle.compose({ paint: outline });
    const second = FocusStyle.compose({ paint: { ...outline, arrival: { outlineColor: 'red' } } });
    const shadow = FocusStyle.compose({ paint: halo });
    const both = FocusStyle.compose({
      paint: { ...outline, arrival: { ...halo.arrival, ...outline.arrival } },
    });
    expect(base(first)['--sys-focus-animation']).to.eql(base(second)['--sys-focus-animation']);
    expect(first.class).not.to.eql(second.class);
    expect(base(first)['--sys-focus-arrival-outline']).to.eql('blue');
    expect(base(second)['--sys-focus-arrival-outline']).to.eql('red');
    expect(base(shadow)['--sys-focus-arrival-shadow']).to.eql(halo.arrival.boxShadow);
    const names = [first, shadow, both].map((item) => base(item)['--sys-focus-animation']);
    expect(new Set(names).size).to.eql(3);
    const count = Style.Dom.stylesheet().rules.length;
    expect(FocusStyle.compose({ paint: outline }).class).to.eql(first.class);
    expect(Style.Dom.stylesheet().rules.length).to.eql(count);
  });

  it('isolates recipes differing only in forced-colour paint and preserves offset units', () => {
    const first = FocusStyle.compose({ paint: outline });
    const second = FocusStyle.compose({
      paint: { ...outline, forcedColors: { outline: '3px dotted CanvasText', outlineOffset: -2 } },
    });
    expect(first.class).not.to.eql(second.class);
    expect(base(first)['--sys-focus-forced-outline']).to.eql('2px solid Highlight');
    expect(base(second)['--sys-focus-forced-outline']).to.eql('3px dotted CanvasText');
    expect(base(second)['--sys-focus-forced-offset']).to.eql('-2px');
  });

  it('initializes default tokens per target and lets original caller input override or clear them', () => {
    const paint = { ...outline, defaults: { '--palette': 'blue', '--width': '2px' } };
    const first = FocusStyle.compose({ paint, style: { '--palette': 'red' } });
    const second = FocusStyle.compose({ paint });
    const cleared = FocusStyle.compose({
      base: { minWidth: 120 },
      paint,
      style: [false, { Padding: 4, minWidth: undefined, '--width': undefined }],
    });
    expect(base(first)['--palette']).to.eql('red');
    expect(base(second)['--palette']).to.eql('blue');
    expect(base(second)['--width']).to.eql('2px');
    expect(base(cleared)).not.to.have.property('minWidth');
    expect(base(cleared)).not.to.have.property('--width');
  });

  const replacements: { name: string; style: () => t.Style.Input }[] = [
    { name: 'plain', style: () => ({ ':focus-visible': { outline: 'none' } }) },
    { name: 'explicit clear', style: () => [false, { ':focus-visible': undefined, Padding: 4 }] },
    { name: 'transformed', style: () => css({ ':focus-visible': { outline: '3px dotted red' } }) },
  ];
  for (const { name, style } of replacements) {
    it(`${name}: caller focus replacement omits all default variables and preferences`, () => {
      const result = FocusStyle.compose({
        base: { margin: 2 },
        style: style(),
        paint: { ...outline, defaults: { '--owned-default': 'blue' } },
      });
      expect(Obj.keys(base(result)).filter((key) => key.startsWith('--'))).to.eql([]);
      expect(rules(result).filter((item) => item.rule.startsWith('@media'))).to.eql([]);
      expect(focus(result)?.animation).to.eql(undefined);
    });
  }

  const animations: { name: string; style: t.Style.Value }[] = [
    { name: 'shorthand', style: { animation: 'caller 2s linear infinite' } },
    { name: 'longhand', style: { animationName: 'caller', animationDuration: '2s' } },
    { name: 'timing-only', style: { animationDuration: '2s' } },
  ];
  for (const { name, style } of animations) {
    it(`preserves caller ${name} animation and keeps default focus static`, () => {
      const result = FocusStyle.compose({ paint: outline, style });
      expect(base(result)).to.include(style);
      expect(focus(result)?.animation).to.eql(undefined);
      expect(focus(result)).to.include(outline.settled);
    });
  }

  for (const { name, style } of animations) {
    it(`preserves caller hover ${name} animation and keeps default focus static`, () => {
      const result = FocusStyle.compose({
        base: { ':hover': { color: 'blue' } },
        style: [false, css({ ':hover': style })],
        paint: outline,
      });
      const hover = Style.Dom.stylesheet().rules.items.find((item) => {
        return item.selector === `.${result.class}:hover`;
      });
      expect(hover?.style).to.include(style);
      expect(focus(result)?.animation).to.eql(undefined);
      expect(focus(result)).to.include(outline.settled);
    });
  }

  for (const pseudo of [':focus', ':active', ':focus-within'] as const) {
    it(`${pseudo}: caller animation ownership applies to self and child paint targets`, () => {
      const style: t.Style.Value = {};
      style[pseudo] = { animationName: 'caller' };
      const self = FocusStyle.compose({ paint: outline, style });
      const child = FocusStyle.compose({ paint: outline, style, via: '--animated-child' });
      expect(focus(self)?.animation).to.eql(undefined);
      expect(base(child).animation).to.eql(undefined);
      expect(base(child)).to.include(outline.settled);
    });
  }

  it('cleared animations and pseudo-element animations do not own the target animation', () => {
    const result = FocusStyle.compose({
      paint: outline,
      style: {
        animation: undefined,
        ':hover': { animationName: undefined },
        '::placeholder': { animation: 'placeholder 2s linear infinite' },
      },
    });
    expect(focus(result)?.animation).to.eql(
      '220ms ease-out 70ms 1 normal backwards running var(--sys-focus-animation)',
    );
  });

  it('binds ancestor entry/exit to the child animation as well as indicator visibility', () => {
    const child = FocusStyle.compose({ paint: outline, via: '--run-focus' });
    expect(child.activation).to.eql({
      '--run-focus': 'none',
      '--run-focus-visible': 0,
      ':focus-visible': {
        '--run-focus': 'sys-focus-arrival-outline',
        '--run-focus-visible': 1,
      },
    });
    expect(base(child).opacity).to.eql('var(--run-focus-visible, 0)');
    expect(base(child)['--sys-focus-animation']).to.eql('var(--run-focus, none)');
    expect(base(child).animation).to.eql(
      '220ms ease-out 70ms 1 normal backwards running var(--sys-focus-animation)',
    );
    expect(base(child)).to.include(outline.settled);
    expect(focus(child)).to.eql(undefined);
    const preferences = rules(child).filter((item) => item.rule.startsWith('@media'));
    expect(preferences.every((item) => item.selector === `.${child.class}`)).to.eql(true);
    expect(preferences.at(-1)?.style).to.eql({
      outline: 'var(--sys-focus-forced-outline)',
      outlineOffset: 'var(--sys-focus-forced-offset)',
    });
    const again = FocusStyle.compose({ paint: outline, via: '--run-focus' });
    expect(again).to.eql(child);
    const independent = FocusStyle.compose({ paint: halo, via: '--other-focus' });
    expect(independent.activation).to.have.property('--other-focus', 'none');
    expect(independent.activation).not.to.have.property('--run-focus');
  });
});
