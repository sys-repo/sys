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

type ConfigItem = t.Files.InfoPanel.Config.Item;

const componentSelector = '[data-component]';
const currentSelector = '[data-keyvalue-cursor-current="true"]';

describe('Files.InfoPanel.Config.UI: cursor', () => {
  DomMock.init({ beforeEach, afterEach });

  describe('controlled cursor projection', () => {
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
      const res = await renderConfig({
        items: ['title', { kind: 'divider', id: 'divider:1' }, 'error'],
        cursor: { model: { current: { path: ['divider:1'] } }, onChange: () => undefined },
      });
      const current = currentBoundary(res.container);

      expect(current.getAttribute('data-keyvalue-cursor-path')).to.eql('/divider:1');

      act(() => res.dispose());
      await Schedule.micro();
    });
  });

  describe('host-owned divider insertion', () => {
    it('inserts a divider after the visible current cursor target with Option+Enter', async () => {
      let emitted: ConfigItem[] | undefined;
      const res = await renderConfig({
        items: ['title', 'error'],
        onItemsChange: (e) => emitted = e.next,
        cursor: { model: { current: { path: ['error'] } }, onChange: () => undefined },
      });
      const event = dispatchOptionEnter(currentBoundary(res.container));
      await Schedule.micro();

      expect(event.defaultPrevented).to.eql(true);
      expect(emitted).to.eql(['title', 'error', { kind: 'divider', id: 'divider:1' }]);

      act(() => res.dispose());
      await Schedule.micro();
    });

    describe('guards', () => {
      it('does not insert from a hidden current cursor target', async () => {
        let emitted: ConfigItem[] | undefined;
        const res = await renderConfig({
          items: ['title'],
          onItemsChange: (e) => emitted = e.next,
          cursor: { model: { current: { path: ['status'] } }, onChange: () => undefined },
        });
        const event = dispatchOptionEnter(currentBoundary(res.container));
        await Schedule.micro();

        expect(event.defaultPrevented).to.eql(false);
        expect(emitted).to.eql(undefined);

        act(() => res.dispose());
        await Schedule.micro();
      });

      it('does not insert without a structural item source', async () => {
        let emitted: ConfigItem[] | undefined;
        const res = await renderConfig({
          fields: ['title', 'error'],
          onItemsChange: (e) => emitted = e.next,
          cursor: { model: { current: { path: ['error'] } }, onChange: () => undefined },
        });
        const event = dispatchOptionEnter(currentBoundary(res.container));
        await Schedule.micro();

        expect(event.defaultPrevented).to.eql(false);
        expect(emitted).to.eql(undefined);

        act(() => res.dispose());
        await Schedule.micro();
      });

      it('does not insert when the cursor is disabled', async () => {
        let emitted: ConfigItem[] | undefined;
        const res = await renderConfig({
          items: ['title', 'error'],
          onItemsChange: (e) => emitted = e.next,
          cursor: {
            enabled: false,
            model: { current: { path: ['error'] } },
            onChange: () => undefined,
          },
        });
        const event = dispatchOptionEnter(componentRoot(res.container));
        await Schedule.micro();

        expect(event.defaultPrevented).to.eql(false);
        expect(emitted).to.eql(undefined);

        act(() => res.dispose());
        await Schedule.micro();
      });

      it('does not insert from a focused switch control descendant', async () => {
        let emitted: ConfigItem[] | undefined;
        const res = await renderConfig({
          items: ['title', 'error'],
          onItemsChange: (e) => emitted = e.next,
          cursor: { model: { current: { path: ['error'] } }, onChange: () => undefined },
        });
        const button = res.container.querySelector('button') as HTMLButtonElement;

        dispatchOptionEnter(button);
        await Schedule.micro();

        expect(emitted).to.eql(undefined);

        act(() => res.dispose());
        await Schedule.micro();
      });
    });
  });
});

function renderConfig(props: t.Files.InfoPanel.Config.Props) {
  return TestReact.render(<InfoPanelConfig.UI {...props} />, { strict: false });
}

function renderWithCursor(path: t.ObjectPath) {
  return renderConfig({
    fields: ['title'],
    cursor: { model: { current: { path } }, onChange: () => undefined },
  });
}

function currentBoundary(container: HTMLElement): HTMLElement {
  return container.querySelector(currentSelector) as HTMLElement;
}

function componentRoot(container: HTMLElement): HTMLElement {
  return container.querySelector(componentSelector) as HTMLElement;
}

function dispatchOptionEnter(target: EventTarget): KeyboardEvent {
  const event = DomMock.Keyboard.keydownEvent('Enter', {
    altKey: true,
    bubbles: true,
    cancelable: true,
  });
  act(() => target.dispatchEvent(event));
  return event;
}
