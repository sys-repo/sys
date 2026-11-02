import { useState } from 'react';
import {
  act,
  afterAll,
  beforeAll,
  describe,
  DomMock,
  expect,
  expectTypeOf,
  it,
  TestReact,
} from '../../../-test.ts';
import { Color, Is, Obj, Style, type t } from '../common.ts';
import { Switch, SwitchTheme } from '../mod.ts';
import { base, button, focus, rules } from './u.fixture.ts';

// Literal expectations stay independent of the shared policy implementation.
const animation = '220ms ease-out 70ms 1 normal backwards running var(--sys-focus-animation)';

describe('Buttons.Switch: focus styling', () => {
  DomMock.init({ beforeAll, afterAll });

  it('retains the CssValue caller-style contract', () => {
    expectTypeOf<t.Switch.Props['style']>(undefined).toEqualTypeOf<t.CssValue | undefined>();
  });

  for (const name of ['Light', 'Dark'] as const) {
    for (const palette of ['blue', 'green', 'yellow'] as const) {
      it(`${name}/${palette}: shared arrival settles into the existing themed 3px halo`, async () => {
        const theme = SwitchTheme.fromName(name)[palette];
        const res = await TestReact.render(<Switch theme={theme} />);
        try {
          const root = button(res.container);
          const color = theme.trackColor.on;
          if (!Is.str(color)) throw new Error('Expected a string preset colour.');
          const rest = `0 0 0 3px ${Color.alpha(color, 0.28)}`;
          const arrival = `0 0 0 3px ${Color.alpha(color, 1)}`;
          const rootStyle = base(root);
          const focusStyle = focus(root);

          expect(focusStyle).to.include({ outline: 'none', boxShadow: rest });
          expect(focusStyle?.animation).to.eql(animation);
          expect(rootStyle['--sys-focus-animation']).to.eql('sys-focus-arrival-shadow');
          expect(rootStyle['--sys-focus-arrival-shadow']).to.eql(arrival);
          expect(rootStyle).to.include({ width: 51.2, height: 32, borderRadius: 16 });
          expect(rootStyle).not.to.have.property('animation');
          expect(rootStyle).not.to.have.property('transition');
          expect(root.children.length).to.eql(2);

          const items = Style.Dom.stylesheet().rules.items;
          const context = '@keyframes sys-focus-arrival-shadow ';
          const frames = items.filter((item) => item.rule.startsWith(context));
          const frameStyles = frames.map((item) => item.style);
          expect(frameStyles).to.eql([{ boxShadow: 'var(--sys-focus-arrival-shadow)' }]);
          expect(frames[0].selector).to.eql('from');
        } finally {
          act(() => res.dispose());
        }
      });
    }
  }

  const numericColors = [
    { color: -0.35, rest: 'rgba(0, 0, 0, 0.35)', arrival: 'rgb(0, 0, 0)' },
    { color: 0, rest: 'rgba(0, 0, 0, 0.0)', arrival: 'rgb(0, 0, 0)' },
    { color: 0.4, rest: 'rgba(255, 255, 255, 0.4)', arrival: 'rgb(255, 255, 255)' },
    { color: -1e-7, rest: 'rgba(0, 0, 0, 1e-7)', arrival: 'rgb(0, 0, 0)' },
    { color: 1e-7, rest: 'rgba(255, 255, 255, 1e-7)', arrival: 'rgb(255, 255, 255)' },
  ];
  for (const { color, rest, arrival } of numericColors) {
    it(`numeric ${color}: retains signed gray-alpha rest, not 28% alpha`, async () => {
      const theme = SwitchTheme.light.blue;
      theme.trackColor.on = color;
      const res = await TestReact.render(<Switch theme={theme} />);
      try {
        const root = button(res.container);
        const rootStyle = base(root);
        const focusStyle = focus(root);

        expect(focusStyle?.boxShadow).to.eql(`0 0 0 3px ${rest}`);
        expect(rootStyle['--sys-focus-arrival-shadow']).to.eql(`0 0 0 3px ${arrival}`);
        expect(focusStyle?.animation).to.eql(animation);
      } finally {
        act(() => res.dispose());
      }
    });
  }

  it('scopes static preferences to the final class and forced paint to focus', async () => {
    const style = { padding: 4, borderRadius: 7 };
    const res = await TestReact.render(<Switch height={40} style={style} />);
    try {
      const root = button(res.container);
      const rootStyle = base(root);
      const own = rules(root);
      const selectors = own.map((item) => item.selector);
      const selector = `.${root.className}`;
      const [, , , reducedMotion, forcedColors, forcedFocus] = own;

      expect(rootStyle).to.include({ padding: 4, borderRadius: 7, height: 40 });
      expect(selectors).to.eql([
        selector,
        `${selector}:focus`,
        `${selector}:focus-visible`,
        selector,
        selector,
        `${selector}:focus-visible`,
      ]);
      expect(reducedMotion.rule).to.include('@media (prefers-reduced-motion: reduce)');
      expect(reducedMotion.style).to.eql({ '--sys-focus-animation': 'none' });
      expect(forcedColors.rule).to.include('@media (forced-colors: active)');
      expect(forcedColors.style).to.eql({ '--sys-focus-animation': 'none' });
      expect(forcedFocus.style).to.eql({
        outline: 'var(--sys-focus-forced-outline)',
        outlineOffset: 'var(--sys-focus-forced-offset)',
        boxShadow: 'var(--sys-focus-forced-shadow)',
      });
      expect(rootStyle['--sys-focus-forced-outline']).to.eql('3px solid Highlight');
      expect(rootStyle['--sys-focus-forced-offset']).to.eql('0px');
      expect(rootStyle['--sys-focus-forced-shadow']).to.eql('none');
      expect(forcedFocus.rule).not.to.include('forced-color-adjust');
    } finally {
      act(() => res.dispose());
    }
  });

  const replacements: { name: string; style: t.CssValue }[] = [
    { name: 'replacement', style: { ':focus-visible': { outline: '2px dotted red' } } },
    { name: 'explicit clear', style: { ':focus-visible': undefined } },
  ];
  for (const { name, style } of replacements) {
    it(`${name}: removes the default focus policy but retains caller layout`, async () => {
      const res = await TestReact.render(<Switch style={{ padding: 4, ...style }} />);
      try {
        const root = button(res.container);
        const rootStyle = base(root);
        const variables = Obj.keys(rootStyle).filter((key) => key.startsWith('--sys-focus'));
        const mediaRules = rules(root).filter((item) => item.rule.startsWith('@media'));

        expect(rootStyle.padding).to.eql(4);
        expect(variables).to.eql([]);
        expect(focus(root)).to.eql(style[':focus-visible']);
        expect(mediaRules).to.eql([]);
      } finally {
        act(() => res.dispose());
      }
    });
  }

  const animations: { name: string; style: t.CssValue }[] = [
    { name: 'shorthand', style: { animation: 'caller-pulse 2s linear infinite' } },
    { name: 'longhand', style: { animationName: 'caller-pulse', animationDuration: '2s' } },
    { name: 'timing-only', style: { animationDuration: '2s' } },
  ];
  for (const { name, style } of animations) {
    it(`${name}: preserves caller animation and leaves focus static`, async () => {
      const res = await TestReact.render(<Switch style={style} />);
      try {
        const root = button(res.container);
        const focusStyle = focus(root);
        const rest = `0 0 0 3px ${Color.alpha(Color.BLUE, 0.28)}`;

        expect(base(root)).to.include(style);
        expect(focusStyle?.animation).to.eql(undefined);
        expect(focusStyle?.boxShadow).to.eql(rest);
      } finally {
        act(() => res.dispose());
      }
    });
  }

  it('isolates palettes, shares keyframes and deduplicates equivalent instances', async () => {
    const res = await TestReact.render(
      <div>
        <Switch theme={SwitchTheme.light.blue} />
        <Switch theme={SwitchTheme.dark.green} />
        <Switch theme={SwitchTheme.light.blue} />
      </div>,
    );
    try {
      const roots = [...res.container.querySelectorAll('button')];
      const [blue, green, duplicate] = roots;
      const names = roots.map((el) => base(el)['--sys-focus-animation']);
      const blueArrival = base(blue)['--sys-focus-arrival-shadow'];
      const greenArrival = base(green)['--sys-focus-arrival-shadow'];

      expect(blue.className).not.to.eql(green.className);
      expect(blue.className).to.eql(duplicate.className);
      expect(names).to.eql(Array(3).fill('sys-focus-arrival-shadow'));
      expect(blueArrival).not.to.eql(greenArrival);

      const count = Style.Dom.stylesheet().rules.length;
      const again = await TestReact.render(<Switch theme={SwitchTheme.light.blue} />);
      try {
        expect(Style.Dom.stylesheet().rules.length).to.eql(count);
      } finally {
        act(() => again.dispose());
      }
    } finally {
      act(() => res.dispose());
    }
  });

  it('retains root and focus on toggle while track/thumb transition', async () => {
    function Subject() {
      const [value, setValue] = useState(false);
      return <Switch value={value} transitionSpeed={345} onToggle={(e) => setValue(e.next)} />;
    }
    const res = await TestReact.render(<Subject />);
    try {
      const root = button(res.container);
      const className = root.className;
      const focusStyle = focus(root);
      const [track, thumb] = [...root.children];
      const off = base(thumb).left;

      act(() => root.focus());
      act(() => DomMock.Mouse.click(root));

      expect(button(res.container)).to.equal(root);
      expect(root.ownerDocument.activeElement).to.equal(root);
      expect(root.getAttribute('aria-checked')).to.eql('true');
      expect(root.className).to.eql(className);
      expect(focus(root)).to.eql(focusStyle);
      expect(focus(root)?.animation).to.eql(animation);
      expect([...root.children]).to.eql([track, thumb]);
      expect(base(track).transition).to.eql('border-color 345ms, background-color 345ms');
      expect(base(thumb).transition).to.eql('left 345ms, background-color 345ms');
      expect(base(thumb).left).not.to.eql(off);
      expect(base(root)).not.to.have.property('transition');
      // Identity and declarations do not prove native focus heuristics or animation replay.
    } finally {
      act(() => res.dispose());
    }
  });
});
