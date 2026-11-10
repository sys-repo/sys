import {
  act,
  afterAll,
  beforeAll,
  describe,
  DomMock,
  expect,
  it,
  TestReact,
} from '../../../-test.ts';
import { Color, Style } from '../common.ts';
import { StandardLink } from '../-spec/-ui.StandardLink.tsx';

describe('Anchor spec: standards reference', () => {
  DomMock.init({ beforeAll, afterAll });

  for (const theme of ['Light', 'Dark'] as const) {
    it(`${theme}: inherited-font footer → HTMLAnchorElement definition`, async () => {
      const res = await TestReact.render(<StandardLink theme={theme} />);
      try {
        expect(res.container.querySelectorAll('a').length).to.eql(1);
        const link = res.container.querySelector('a')!;
        expect(link.getAttribute('href')).to.eql(
          'https://html.spec.whatwg.org/multipage/text-level-semantics.html#htmlanchorelement',
        );
        expect(link.textContent).to.eql('HTMLAnchorElement · WHATWG');
        expect(link.getAttribute('target')).to.eql('_blank');
        expect(link.getAttribute('rel')).to.eql('noopener noreferrer');
        expect(link.getAttribute('title')).to.eql(
          'HTML Living Standard — HTMLAnchorElement interface (opens in a new tab)',
        );
        const rule = Style.Dom.stylesheet().rules.items.find((item) => {
          return item.selector === `.${link.className}`;
        });
        expect(rule?.style).to.include({ color: Color.theme(theme).fg, fontSize: 12 });
        expect(rule?.style.fontFamily).to.eql(undefined);
      } finally {
        act(() => res.dispose());
      }
    });
  }
});
