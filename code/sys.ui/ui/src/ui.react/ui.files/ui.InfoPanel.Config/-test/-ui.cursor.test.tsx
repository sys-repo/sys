import { act, TestReact } from '@sys/ui-react/testing/server';
import {
  afterEach,
  beforeEach,
  describe,
  DomMock,
  expect,
  it,
  Schedule,
  type t,
} from '../../../../-test.ts';
import { InfoPanelConfig } from '../mod.ts';

const currentSelector = '[data-keyvalue-cursor-current="true"]';

describe('Files.InfoPanel.Config.UI: cursor', () => {
  DomMock.init({ beforeEach, afterEach });

  it('threads controlled KeyValue cursor into the visible switch root', async () => {
    const res = await renderWithCursor(['group:title']);

    expect(res.container.querySelectorAll(currentSelector).length).to.eql(1);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('threads controlled KeyValue cursor into the hidden switch root', async () => {
    const res = await renderWithCursor(['status']);

    expect(res.container.querySelectorAll(currentSelector).length).to.eql(1);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('renders structural divider items as cursor-addressable visible config items', async () => {
    const res = await TestReact.render(
      <InfoPanelConfig.UI
        items={['title', { kind: 'divider', id: 'divider:1' }, 'error']}
        cursor={{ model: { current: { path: ['divider:1'] } }, onChange: () => undefined }}
      />,
      { strict: false },
    );
    const current = res.container.querySelector(currentSelector) as HTMLElement;

    expect(current.getAttribute('data-keyvalue-cursor-path')).to.eql('/divider:1');

    act(() => res.dispose());
    await Schedule.micro();
  });
});

function renderWithCursor(path: t.ObjectPath) {
  return TestReact.render(
    <InfoPanelConfig.UI
      fields={['title']}
      cursor={{ model: { current: { path } }, onChange: () => undefined }}
    />,
    { strict: false },
  );
}
