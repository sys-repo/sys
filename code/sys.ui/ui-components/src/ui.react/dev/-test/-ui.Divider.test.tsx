import { act, afterAll, beforeAll, describe, DomMock, expect, it, TestReact } from '../../-test.ts';
import { Color, css, Is, Style, type t } from '../common.ts';
import { Dev } from '../mod.ts';
import { DevDivider } from '../ui.Divider.tsx';
import { FocusExamples as ButtonExamples } from '../../ui/Button/-spec/-ui.FocusExamples.tsx';
import { FocusExamples } from '../../ui/Anchor/-spec/-ui.FocusExamples.tsx';
import { LinkExamples } from '../../ui/Anchor/-spec/-ui.LinkExamples.tsx';

describe('@sys/ui-components/react/dev: Dev.Divider', () => {
  DomMock.init({ beforeAll, afterAll });

  it('exports the primitive through the existing Dev leaf and type surface', async () => {
    const m = await import('@sys/ui-components/react/dev');
    expect(m.Dev).to.equal(Dev);
    expect(m.Dev.Divider).to.equal(DevDivider);
    const props: t.Dev.Divider.Props = { theme: 'Dark' };
    expect(DevDivider(props).type).to.eql('div');
  });

  for (const theme of [undefined, 'Light', 'Dark'] as const) {
    it(`${theme ?? 'default'}: one decorative rule shared by all three specimen layouts`, async () => {
      const res = await TestReact.render(
        <>
          <Dev.Divider theme={theme} />
          <ButtonExamples theme={theme} />
          <FocusExamples theme={theme} />
          <LinkExamples theme={theme} />
        </>,
      );
      try {
        const [divider, ...frames] = res.container.children;
        expect(divider.tagName).to.eql('DIV');
        expect(divider.getAttribute('aria-hidden')).to.eql('true');
        expect(divider.hasAttribute('tabindex')).to.eql(false);
        expect(divider.hasAttribute('role')).to.eql(false);
        expect(divider.childNodes.length).to.eql(0);
        const rule = ruleText(divider);
        expect(rule).to.include('height: 5px;');
        expect(rule).to.include('margin-top: 14px;');
        expect(rule).to.include('margin-bottom: 10px;');
        expect(rule).to.include('margin-left: -25px;');
        expect(rule).to.include('margin-right: -25px;');
        expect(rule).to.include(`background-color: ${Color.alpha(Color.theme(theme).fg, 0.1)};`);
        expect(rule).to.include('pointer-events: none;');

        const counts = [4, 6, 12];
        for (const [index, frame] of frames.entries()) {
          const children = [...frame.children];
          const rules = children.filter((el) => el.getAttribute('aria-hidden') === 'true');
          expect(rules.length).to.eql(counts[index]);
          for (const item of rules) {
            expect(item.className).to.eql(divider.className);
            expect(item.previousElementSibling?.tagName).to.eql('SECTION');
            expect(item.nextElementSibling?.tagName).to.eql('SECTION');
            expect(item.hasAttribute('tabindex')).to.eql(false);
          }
        }
      } finally {
        act(() => res.dispose());
      }
    });
  }

  it('applies nested overrides and clears a raw background declaration', async () => {
    const style: t.CssInput = [
      { height: 1 },
      [false, { Margin: [2, -4, 6, -4], backgroundColor: undefined }],
    ];
    const res = await TestReact.render(<Dev.Divider theme='Dark' style={style} />);
    try {
      const divider = res.container.firstElementChild!;
      const rule = ruleText(divider);
      expect(rule).to.include('height: 1px;');
      expect(rule).to.include('margin-top: 2px;');
      expect(rule).to.include('margin-bottom: 6px;');
      expect(rule).to.include('margin-left: -4px;');
      expect(rule).to.include('margin-right: -4px;');
      expect(rule).not.to.include('background-color:');
      expect(divider.getAttribute('aria-hidden')).to.eql('true');
    } finally {
      act(() => res.dispose());
    }
  });

  it('clears raw margin declarations, but not expanded margins through an undefined template', async () => {
    const res = await TestReact.render(
      <>
        <Dev.Divider
          style={{
            marginTop: undefined,
            marginRight: undefined,
            marginBottom: undefined,
            marginLeft: undefined,
            backgroundColor: undefined,
          }}
        />
        <Dev.Divider style={{ Margin: undefined }} />
      </>,
    );
    try {
      const [raw, template] = res.container.children;
      const rawRule = ruleText(raw);
      expect(rawRule).not.to.include('margin-');
      expect(rawRule).not.to.include('background-color:');
      expect(rawRule).to.include('height: 5px;');

      const templateRule = ruleText(template);
      expect(templateRule).to.include('margin-top: 14px;');
      expect(templateRule).to.include('margin-bottom: 10px;');
      expect(templateRule).to.include('margin-left: -25px;');
      expect(templateRule).to.include('margin-right: -25px;');
    } finally {
      act(() => res.dispose());
    }
  });

  it('pre-transforming a margin override discards the raw background clear', async () => {
    const style = css({ Margin: [2, -4, 6, -4], backgroundColor: undefined });
    const res = await TestReact.render(<Dev.Divider theme='Dark' style={style} />);
    try {
      const rule = ruleText(res.container.firstElementChild!);
      expect(rule).to.include('margin-top: 2px;');
      expect(rule).to.include('margin-bottom: 6px;');
      expect(rule).to.include('margin-left: -4px;');
      expect(rule).to.include('margin-right: -4px;');
      expect(rule).to.include(`background-color: ${Color.alpha(Color.theme('Dark').fg, 0.1)};`);
    } finally {
      act(() => res.dispose());
    }
  });
});

/** Registered CSS only; DOM mocks do not establish browser geometry. */
function ruleText(element: Element) {
  const selector = `.${element.className}`;
  const rule = Style.Dom.stylesheet().rules.items.find((item) => item.selector === selector);
  if (Is.nil(rule)) throw new Error(`Missing CSS rule: ${selector}`);
  return rule.rule;
}
