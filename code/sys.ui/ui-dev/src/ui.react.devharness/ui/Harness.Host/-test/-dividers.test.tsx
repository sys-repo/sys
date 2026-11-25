import { TestReact } from '@sys/ui-react/testing/server';
import {
  afterEach,
  beforeEach,
  describe,
  DomMock,
  expect,
  Is,
  it,
  Rx,
  Signal,
  type t,
  TestSample,
} from '../../../-test.ts';
import { RxBus } from '../../../u/m.RxBus/mod.ts';
import { Theme } from '../../../u/m.Theme/mod.ts';
import { HarnessHost } from '../mod.ts';

const LIGHT = 'rgba(0, 0, 0, 0.1)';
const DARK = 'rgba(255, 255, 255, 0.1)';
const TRANSPARENT = 'rgba(0, 0, 0, 0.0)';

describe('DevHarness host dividers', () => {
  DomMock.init({ beforeEach, afterEach });

  it('Light → Dark → Light, with explicit edge borders taking precedence', async () => {
    const { events, instance } = TestSample.controller();
    try {
      const ctx = await events.ctx.get();
      using view = await TestReact.render(<HarnessHost instance={instance} />);
      const theme = Signal.create<t.CommonTheme>('Light');
      const update = async (change: () => void) => {
        await TestReact.act(async () => {
          const written = RxBus.asPromise.first(
            events.props.changed$.pipe(Rx.filter((e) => e.message === 'props:write')),
            { op: 'host divider props write', timeout: 2000 },
          );
          change();
          const { error } = await written;
          if (error) throw new Error(error.message);
        });
      };
      const edge = (name: 'Header' | 'Footer') =>
        view.container.querySelector(`[data-component="dev.harness:${name}"]`);
      const expectColors = (headerColor: string, footerColor = headerColor) => {
        const header = edge('Header');
        const footer = edge('Footer');
        const window = view.container.ownerDocument.defaultView;
        if (Is.nil(window) || Is.nil(header) || Is.nil(footer)) {
          throw new Error('Expected both host edges in a mounted document');
        }
        expect(window.getComputedStyle(header).borderBottomColor).to.eql(headerColor);
        expect(window.getComputedStyle(footer).borderTopColor).to.eql(footerColor);
      };

      await update(() => {
        ctx.host.header.render(<span>Header</span>);
        ctx.host.footer.render(<span>Footer</span>);
        Theme.signalEffect(ctx, theme);
      });
      expectColors(LIGHT);

      await update(() => void (theme.value = 'Dark'));
      expectColors(DARK);

      // @ts-expect-error Reset an edge with border(null), not the host divider color.
      expect(() => ctx.host.dividerColor(null)).to.throw(TypeError);
      expectColors(DARK);

      await update(() => {
        ctx.host.footer.border(0);
        theme.value = 'Light';
      });
      expectColors(LIGHT, TRANSPARENT);

      await update(() => void (theme.value = 'Dark'));
      expectColors(DARK, TRANSPARENT);

      await update(() => void ctx.host.footer.border(null));
      expectColors(DARK);

      await update(() => void (theme.value = 'Light'));
      expectColors(LIGHT);
    } finally {
      events.dispose();
    }
  });
});
