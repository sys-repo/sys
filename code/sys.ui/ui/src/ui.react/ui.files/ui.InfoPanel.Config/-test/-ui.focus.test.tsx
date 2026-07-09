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

const activeSelector = '[data-keyvalue-focus-active="true"]';

describe('Files.InfoPanel.Config.UI: focus', () => {
  DomMock.init({ beforeEach, afterEach });

  it('threads controlled KeyValue focus into the visible switch root', async () => {
    const res = await renderWithFocus(['group:title']);

    expect(res.container.querySelectorAll(activeSelector).length).to.eql(1);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('threads controlled KeyValue focus into the hidden switch root', async () => {
    const res = await renderWithFocus(['status']);

    expect(res.container.querySelectorAll(activeSelector).length).to.eql(1);

    act(() => res.dispose());
    await Schedule.micro();
  });
});

function renderWithFocus(path: t.ObjectPath) {
  return TestReact.render(
    <InfoPanelConfig.UI
      fields={['title']}
      focus={{ model: { active: { path } }, onChange: () => undefined }}
    />,
    { strict: false },
  );
}
