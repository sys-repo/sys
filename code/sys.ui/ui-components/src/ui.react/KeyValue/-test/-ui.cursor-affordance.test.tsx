import {
  act,
  afterEach,
  beforeEach,
  Color,
  describe,
  DomMock,
  expect,
  it,
  Schedule,
  type t,
  TestReact,
} from '../../../-test.ts';
import { KeyValue } from '../mod.ts';

const currentSelector = '[data-keyvalue-cursor-current="true"]';

describe('KeyValue.UI: cursor affordance', () => {
  DomMock.init({ beforeEach, afterEach });

  it('renders a theme-derived zero-layout-shift current boundary fill', async () => {
    for (const name of ['Light', 'Dark'] as const) {
      const theme = Color.theme(name);
      const res = await TestReact.render(
        <KeyValue.UI
          theme={name}
          items={[row('alpha')]}
          cursor={{ model: { current: KeyValue.Cursor.target(['alpha']) }, onChange: () => undefined }}
        />,
        { strict: false },
      );
      const current = res.container.querySelector(currentSelector) as HTMLElement;
      const style = window.getComputedStyle(current);

      expect(style.backgroundColor).to.eql(Color.alpha(theme.fg, 0.06));
      expect(style.borderTopWidth === '' || style.borderTopWidth === '0px').to.eql(true);

      act(() => res.dispose());
      await Schedule.micro();
    }
  });
});

function row(id: string): t.KeyValue.Item.Row {
  return { id, k: id, v: id };
}
