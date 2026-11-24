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
import { Style, type t } from '../common.ts';
import { Anchor } from '../mod.ts';

const cases: readonly Pick<t.Anchor.Props, 'mono'>[] = [{}, { mono: false }, { mono: true }];

describe('Anchor typography', () => {
  DomMock.init({ beforeAll, afterAll });

  for (const [name, Link] of [['Anchor.UI', Anchor.UI], ['Anchor.Link', Anchor.Link]] as const) {
    for (const enabled of [true, false]) {
      it(`${name}, enabled=${enabled}: mono is opt-in and caller font styles win`, async () => {
        for (const props of cases) {
          const res = await TestReact.render(
            <>
              <Link href='#destination' enabled={enabled} {...props}>Label</Link>
              <Link
                href='#destination'
                enabled={enabled}
                {...props}
                style={{ fontFamily: 'serif' }}
              >
                Caller font
              </Link>
            </>,
          );
          try {
            const [plain, custom] = res.container.querySelectorAll('a');
            expect(fontFamily(plain)).to.eql(props.mono ? 'monospace' : undefined);
            expect(fontFamily(custom)).to.eql('serif');
            expect(plain.hasAttribute('mono')).to.eql(false);
            expect(plain.hasAttribute('href')).to.eql(enabled);
          } finally {
            act(() => res.dispose());
          }
        }
      });
    }

    it(`${name}: mono does not wrap children when the destination is missing`, async () => {
      const res = await TestReact.render(
        <Link mono>
          <em>Label</em>
        </Link>,
      );
      try {
        expect(res.container.innerHTML).to.eql('<em>Label</em>');
      } finally {
        act(() => res.dispose());
      }
    });
  }
});

/** Declaration inspection only; browser font rendering remains separate proof. */
function fontFamily(element: Element) {
  const rule = Style.Dom.stylesheet().rules.items.find(({ selector }) => {
    return selector === `.${element.className}`;
  });
  expect(rule).not.to.eql(undefined);
  return rule!.style.fontFamily;
}
