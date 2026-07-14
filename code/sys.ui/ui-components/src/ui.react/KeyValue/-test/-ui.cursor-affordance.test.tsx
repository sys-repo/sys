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
const arrivalSelector = '[data-keyvalue-cursor-arrival-cue="true"]';

describe('KeyValue.UI: cursor affordance', () => {
  DomMock.init({ beforeEach, afterEach });

  it('renders a theme-derived zero-layout-shift current boundary fill', async () => {
    for (const name of ['Light', 'Dark'] as const) {
      const theme = Color.theme(name);
      const res = await TestReact.render(
        <KeyValue.UI
          theme={name}
          items={[row('alpha')]}
          cursor={{
            model: { current: KeyValue.Cursor.target(['alpha']) },
            onChange: () => undefined,
          }}
        />,
        { strict: false },
      );
      const current = res.container.querySelector(currentSelector) as HTMLElement;
      const style = window.getComputedStyle(current);

      expect(style.backgroundColor).to.eql(Color.alpha(theme.fg, 0.06));
      expect(style.borderTopWidth === '' || style.borderTopWidth === '0px').to.eql(true);

      const cue = current.querySelector(arrivalSelector) as HTMLElement;
      const cueStyle = window.getComputedStyle(cue);
      expect(cueStyle.position).to.eql('absolute');
      expect(cueStyle.pointerEvents).to.eql('none');
      expect(cueStyle.backgroundColor).to.eql(Color.alpha(theme.fg, 0.14));
      expect(current.querySelector('style')?.textContent?.includes('keyvalue-cursor-arrival-cue'))
        .to.eql(true);
      expect(cue.getAttribute('data-keyvalue-cursor-arrival-key')).to.eql('/alpha:atom');

      act(() => res.dispose());
      await Schedule.micro();
    }
  });

  it('keys the arrival cue by cursor lane without changing target identity', async () => {
    const res = await TestReact.render(
      <KeyValue.UI
        items={[row('alpha')]}
        cursor={{
          model: { current: KeyValue.Cursor.target(['alpha'], 'value') },
          onChange: () => undefined,
        }}
      />,
      { strict: false },
    );
    const current = res.container.querySelector(currentSelector) as HTMLElement;
    const cue = current.querySelector(arrivalSelector) as HTMLElement;

    expect(current.getAttribute('data-keyvalue-cursor-path')).to.eql('/alpha');
    expect(current.getAttribute('data-keyvalue-cursor-current-part')).to.eql('value');
    expect(cue.getAttribute('data-keyvalue-cursor-arrival-key')).to.eql('/alpha:value');

    act(() => res.dispose());
    await Schedule.micro();
  });
});

function row(id: string): t.KeyValue.Item.Row {
  return { id, k: id, v: id };
}
