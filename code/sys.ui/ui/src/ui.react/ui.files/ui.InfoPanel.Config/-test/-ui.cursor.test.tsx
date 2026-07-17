import React from 'react';
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
const cursorRootSelector = '[data-keyvalue-cursor-root="true"]';

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

  describe('host-owned keyboard entry', () => {
    it('enters the focused visible switch cursor root with Option+Enter', async () => {
      let emitted: t.KeyValue.Cursor.Change | undefined;
      const res = await renderConfig({
        items: ['title', 'error'],
        cursor: {
          model: {},
          onChange: (e) => emitted = e,
        },
      });
      const root = cursorRoot(res.container);
      act(() => root.focus());

      const event = dispatchOptionEnter(root);
      await Schedule.micro();

      const change = entryChange(emitted);
      expect(event.defaultPrevented).to.eql(true);
      expect(change.entry).to.eql('option-enter');
      expect(change.target.path).to.eql(['group:title']);
      expect(document.activeElement).to.equal(root);

      act(() => res.dispose());
      await Schedule.micro();
    });

    it('exits the focused cursor root with Escape', async () => {
      let current: t.KeyValue.Cursor.Target | undefined = { path: ['error'] };

      const Probe = () => (
        <InfoPanelConfig.UI
          items={['title', 'error']}
          cursor={{
            model: { current },
            onChange: (e) => current = e.next.current,
          }}
        />
      );

      const res = await TestReact.render(<Probe />, { strict: false });
      const root = cursorRoot(res.container);
      act(() => root.focus());

      const event = dispatchKey(root, 'Escape');
      await Schedule.micro();

      expect(event.defaultPrevented).to.eql(true);
      expect(current).to.eql(undefined);

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
      it('does not repeatedly insert after the same current target', async () => {
        const emitted: ConfigItem[][] = [];

        const Probe: React.FC = () => {
          const [items, setItems] = React.useState<ConfigItem[]>(['title', 'error']);
          return (
            <InfoPanelConfig.UI
              items={items}
              onItemsChange={(e) => {
                emitted.push(e.next);
                setItems(e.next);
              }}
              cursor={{ model: { current: { path: ['error'] } }, onChange: () => undefined }}
            />
          );
        };

        const res = await TestReact.render(<Probe />, { strict: false });
        const first = dispatchOptionEnter(currentBoundary(res.container));
        await Schedule.micro();
        const second = dispatchOptionEnter(currentBoundary(res.container));
        await Schedule.micro();
        const repeated = dispatchKey(currentBoundary(res.container), 'Enter', {
          altKey: true,
          repeat: true,
        });
        await Schedule.micro();

        expect(first.defaultPrevented).to.eql(true);
        expect(second.defaultPrevented).to.eql(false);
        expect(repeated.defaultPrevented).to.eql(false);
        expect(emitted).to.eql([['title', 'error', { kind: 'divider', id: 'divider:1' }]]);

        act(() => res.dispose());
        await Schedule.micro();
      });

      it('does not insert when the current target is already before a divider', async () => {
        let emitted: ConfigItem[] | undefined;
        const res = await renderConfig({
          items: ['error', { kind: 'divider', id: 'divider:1' }, 'events'],
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
        const button = selectElement(res.container, 'button');

        dispatchOptionEnter(button);
        await Schedule.micro();

        expect(emitted).to.eql(undefined);

        act(() => res.dispose());
        await Schedule.micro();
      });
    });
  });
});

/**
 * Helpers:
 */

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
  return selectElement(container, currentSelector);
}

function cursorRoot(container: HTMLElement): HTMLElement {
  return selectElement(container, cursorRootSelector);
}

function componentRoot(container: HTMLElement): HTMLElement {
  return selectElement(container, componentSelector);
}

function selectElement(container: HTMLElement, selector: string): HTMLElement {
  const el = container.querySelector(selector);
  if (el === null) throw new Error(`Expected test element matching selector: ${selector}`);
  return el as HTMLElement;
}

function dispatchOptionEnter(target: EventTarget): KeyboardEvent {
  return dispatchKey(target, 'Enter', { altKey: true });
}

function dispatchKey(
  target: EventTarget,
  key: string,
  init: KeyboardEventInit = {},
): KeyboardEvent {
  const event = DomMock.Keyboard.keydownEvent(key, {
    bubbles: true,
    cancelable: true,
    ...init,
  });
  act(() => target.dispatchEvent(event));
  return event;
}

function entryChange(change?: t.KeyValue.Cursor.Change): t.KeyValue.Cursor.EntryChange {
  expect(change?.reason).to.eql('cursor:entry');
  return change as t.KeyValue.Cursor.EntryChange;
}
