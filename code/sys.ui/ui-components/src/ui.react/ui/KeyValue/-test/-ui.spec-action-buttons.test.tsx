import React from 'react';
import { afterAll, beforeAll, describe, DomMock, expect, it, TestReact } from '../../../-test.ts';
import { SAMPLE } from '../-spec/-samples.tsx';
import { createDebugSignals } from '../-spec/-SPEC.Debug.tsx';
import { SampleButtons } from '../-spec/-ui.Buttons.Samples.tsx';
import { KeyValue } from '../mod.ts';
import { selectElement } from './u.fixture.cursor.ts';

describe('KeyValue spec UI: action buttons', () => {
  DomMock.init({ beforeAll, afterAll });

  it('comprehensive → ends with a divider and Save action', async () => {
    const items = SAMPLE.items('comprehensive')!;
    expect(items.at(-2)?.kind).to.eql('hr');
    const res = await TestReact.render(<KeyValue.UI items={items.slice(-2)} />);
    try {
      expect(res.container.textContent).to.eql('actionSave');
      const action = selectElement(res.container, '[role="button"]');
      expect(action.textContent).to.eql('Save');
      expect(action.tabIndex).to.eql(0);
    } finally {
      React.act(() => res.dispose());
    }
  });

  it('sample selector → adjacent enabled actions and an explicitly disabled action', async () => {
    const debug = createDebugSignals();
    const previousSample = debug.props.sample.value;
    debug.props.sample.value = 'comprehensive';
    const selector = await TestReact.render(<SampleButtons debug={debug} />);
    try {
      const button = Array.from(selector.container.querySelectorAll<HTMLElement>('[role="button"]'))
        .find((el) => el.textContent === 'sample: action buttons');
      expect(button, 'action buttons sample selector').to.exist;
      React.act(() => button!.click());
      expect(debug.props.sample.value).to.eql('action-buttons');

      const items = debug.props.items.value!;
      expect(items.length).to.eql(6);
      expect(new Set(items.map((item) => item.id)).size).to.eql(items.length);
      const res = await TestReact.render(<KeyValue.UI items={items} />);
      try {
        const actions = Array.from(res.container.querySelectorAll<HTMLElement>('[role="button"]'));
        expect(actions.map((el) => el.textContent)).to.eql([
          'Save',
          'Save a Copy',
          'Delete',
          'Cancel',
          'Save',
        ]);
        expect(actions.map((el) => el.tabIndex)).to.eql([0, 0, -1, 0, 0]);
        expect(actions[2].getAttribute('aria-disabled')).to.eql('true');
      } finally {
        React.act(() => res.dispose());
      }
    } finally {
      React.act(() => selector.dispose());
      debug.props.sample.value = previousSample;
    }
  });

  for (const kind of ['spaced', 'table'] as const) {
    it(`${kind}: action sample → divider and an unlabeled Cancel/Save pair`, async () => {
      const items = SAMPLE.items('action-buttons')!;
      expect(items.at(-2)?.kind).to.eql('hr');
      expect(items.at(-1)).to.include({ k: '' });
      const res = await TestReact.render(
        <KeyValue.UI items={items.slice(-2)} layout={{ kind }} />,
      );
      try {
        expect(res.container.textContent).to.eql('CancelSave');
        const actions = Array.from(res.container.querySelectorAll<HTMLElement>('[role="button"]'));
        expect(actions.map((el) => el.textContent)).to.eql(['Cancel', 'Save']);
        const group = actions[0].parentElement!;
        expect(actions[1].parentElement).to.equal(group);
        const style = group.ownerDocument.defaultView!.getComputedStyle(group);
        expect(style.display).to.eql('inline-flex');
        expect(style.gap).to.eql('8px');
      } finally {
        React.act(() => res.dispose());
      }
    });
  }
});
