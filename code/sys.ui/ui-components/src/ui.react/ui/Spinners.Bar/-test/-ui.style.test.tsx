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
import { Spinners } from '../../Spinners/mod.ts';
import { D, Is, Style } from '../common.ts';

/**
 * Inspect registered declarations, not browser paint or animation.
 */
describe('Spinners.Bar: root styling', () => {
  DomMock.init({ beforeAll, afterAll });

  it('keeps the default dimensions and composes caller styles over custom dimensions', async () => {
    const res = await TestReact.render(
      <>
        <Spinners.Bar />
        <Spinners.Bar width={30} height={5} transparentTrack />
        <Spinners.Bar
          width={20}
          height={5}
          transparentTrack
          style={{ height: 6, position: 'static' }}
        />
      </>,
    );
    try {
      const [normal, transparent, styled] = [...res.container.children].map(baseStyle);
      expect(normal).to.include({ width: D.width, height: D.height, overflow: 'hidden' });
      expect(normal.backgroundColor).to.be.a('string');
      expect(transparent).to.include({ width: 30, height: 5, overflow: 'hidden' });
      expect(transparent.backgroundColor).to.eql(undefined);
      expect(styled).to.include({ width: 20, height: 6, position: 'static', contain: 'layout' });
    } finally {
      act(() => res.dispose());
    }
  });
});

/**
 * Helpers:
 */
function baseStyle(el: Element) {
  const sheet = Style.Dom.stylesheet();
  const rule = sheet.rules.items.find((item) => item.selector === `.${el.className}`);
  if (Is.nil(rule)) throw new Error('Expected a registered root style.');
  return rule.style;
}
