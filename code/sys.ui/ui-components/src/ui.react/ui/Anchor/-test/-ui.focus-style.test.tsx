import { afterAll, beforeAll, describe, DomMock, expect, it, TestReact } from '../../../-test.ts';
import { Style } from '../common.ts';
import { A, Anchor } from '../mod.ts';

describe('Anchor: underline and caller-owned keyboard focus', () => {
  DomMock.init({ beforeAll, afterAll });

  it('links and inline actions emphasize the existing underline on hover and focus', async () => {
    using res = await TestReact.render(
      <>
        <A href='/docs'>Docs</A>
        <Anchor.Button onClick={() => {}}>Details</Anchor.Button>
      </>,
    );
    for (const el of res.container.children) {
      expect(declarations(el)?.textDecoration).to.include('underline dashed');
      expect(declarations(el)?.textUnderlinePosition).to.eql('under');
      for (const state of [':hover', ':focus-visible']) {
        expect(declarations(el, state)?.textDecoration).to.eql('underline solid currentColor');
      }
    }
  });

  it('an inline action honors a replacement indicator or explicit clear', async () => {
    const custom = { outline: '3px dotted red' };
    for (const focus of [custom, undefined]) {
      using res = await TestReact.render(
        <Anchor.Button onClick={() => {}} style={{ ':focus-visible': focus }}>Open</Anchor.Button>,
      );
      expect(declarations(res.container.querySelector('button')!, ':focus-visible')).to.eql(focus);
    }
  });
});

function declarations(el: Element, state = '') {
  return Style.Dom.stylesheet().rules.items.find((rule) => {
    return rule.selector === `.${el.className}${state}` && !rule.rule.startsWith('@media');
  })?.style;
}
