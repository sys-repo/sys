import { renderToStaticMarkup } from 'react-dom/server';
import { LuGlobe } from 'react-icons/lu';
import { Html } from '@sys/html';
import {
  act,
  afterAll,
  beforeAll,
  describe,
  DomMock,
  expect,
  it,
  TestReact,
} from '../../../../-test.ts';
import { Style } from '../common.ts';
import { Icon } from '../mod.ts';

const Globe = Icon.renderer(LuGlobe);

describe('Icon: root element', () => {
  DomMock.init({ beforeAll, afterAll });

  for (const as of [undefined, 'div', 'span'] as const) {
    it(`${as ?? 'default'} → preserves sizing and handlers independently of the root`, async () => {
      let clicks = 0;
      const res = await TestReact.render(
        <Globe as={as} size={14} tooltip='World' onClick={() => clicks++} />,
      );
      try {
        const root = res.container.firstElementChild!;
        expect(root.tagName).to.eql((as ?? 'div').toUpperCase());
        expect(root.getAttribute('title')).to.eql('World');
        expect(root.querySelector('svg')?.getAttribute('width')).to.eql('14');
        expect(root.hasAttribute('tabindex')).to.eql(false);
        const rule = Style.Dom.stylesheet().rules.items.find((item) => {
          return item.selector === `.${root.className}`;
        });
        expect(rule?.style).to.include({ display: 'inline-block', width: 14, height: 14 });
        act(() => DomMock.Mouse.click(root));
        expect(clicks).to.eql(1);
      } finally {
        act(() => res.dispose());
      }
    });
  }

  it('default pixels and CSS lengths reach both the root and SVG', async () => {
    for (const size of [undefined, '1em', '0.875em'] as const) {
      const res = await TestReact.render(<Globe as='span' size={size} />);
      try {
        const root = res.container.firstElementChild!;
        const svg = root.querySelector('svg')!;
        expect(svg.getAttribute('width')).to.eql(`${size ?? 24}`);
        expect(svg.getAttribute('height')).to.eql(`${size ?? 24}`);
        const rule = Style.Dom.stylesheet().rules.items.find((item) => {
          return item.selector === `.${root.className}`;
        });
        expect(rule?.rule).to.contain(`width: ${size ?? '24px'};`);
        expect(rule?.rule).to.contain(`height: ${size ?? '24px'};`);
      } finally {
        act(() => res.dispose());
      }
    }
  });

  it('span → actual factory output survives HTML paragraph parsing', () => {
    const markup = renderToStaticMarkup(
      <p>
        Before <Globe as='span' /> after.
      </p>,
    );
    const fragment = Html.parseFragment(markup);
    expect(fragment.childNodes.length).to.eql(1);
    const paragraph = fragment.childNodes[0];
    if (!Html.Is.element(paragraph)) throw new Error('Expected paragraph.');
    expect(paragraph.tagName).to.eql('p');
    const marker = paragraph.childNodes.find(Html.Is.element);
    expect(marker?.tagName).to.eql('span');
    expect(markup).not.to.contain('<div');
  });

  it('element choice does not override caller CSS display', async () => {
    const res = await TestReact.render(<Globe as='span' style={{ display: 'block' }} />);
    try {
      const root = res.container.firstElementChild!;
      expect(root.tagName).to.eql('SPAN');
      const rule = Style.Dom.stylesheet().rules.items.find((item) => {
        return item.selector === `.${root.className}`;
      });
      expect(rule?.style?.display).to.eql('block');
    } finally {
      act(() => res.dispose());
    }
  });
});
