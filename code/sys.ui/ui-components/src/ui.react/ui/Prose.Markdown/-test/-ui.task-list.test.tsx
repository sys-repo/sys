import {
  afterEach,
  beforeEach,
  describe,
  DomMock,
  expect,
  it,
  Str,
  type t,
  TestReact,
} from './common.ts';
import { ProseMarkdown } from '../mod.ts';

describe('Prose.Markdown.UI: task lists', () => {
  DomMock.init({ beforeEach, afterEach });

  it('projects checked state without changing ordinary or nested list content', async () => {
    const source = Str.dedent(`
      - Plain bullet
      - [x] Checked task
      - [ ] Unchecked task
        - Nested detail
    `);

    const res = await TestReact.render(<ProseMarkdown.UI value={source} />, { strict: false });
    try {
      const list = res.container.querySelector('ul')!;
      const items = [...list.children] as HTMLLIElement[];
      const inputs = [...list.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')];
      const nested = items[2].querySelector('ul > li');

      expect(items.length).to.eql(3);
      expect(items.map((item) => item.querySelectorAll('input').length)).to.eql([0, 1, 1]);
      expect(items[0].textContent).to.eql('Plain bullet');
      expect(items[1].textContent).to.eql('Checked task');
      expect(inputs.map((input) => ({
        checked: input.checked,
        disabled: input.disabled,
        readOnly: input.readOnly,
        tabIndex: input.tabIndex,
        ariaLabel: input.getAttribute('aria-label'),
        ariaReadonly: input.getAttribute('aria-readonly'),
        pointerEvents: window.getComputedStyle(input).pointerEvents,
      }))).to.eql([
        {
          checked: true,
          disabled: false,
          readOnly: true,
          tabIndex: -1,
          ariaLabel: 'Completed task',
          ariaReadonly: 'true',
          pointerEvents: 'none',
        },
        {
          checked: false,
          disabled: false,
          readOnly: true,
          tabIndex: -1,
          ariaLabel: 'Incomplete task',
          ariaReadonly: 'true',
          pointerEvents: 'none',
        },
      ]);

      const clicks = inputs.map((input) => DomMock.Mouse.click(input));
      expect(clicks.map(({ dispatched, event }) => ({
        dispatched,
        defaultPrevented: event.defaultPrevented,
      }))).to.eql([
        { dispatched: false, defaultPrevented: true },
        { dispatched: false, defaultPrevented: true },
      ]);
      expect(inputs.map((input) => input.checked)).to.eql([true, false]);
      expect(nested?.textContent).to.eql('Nested detail');
    } finally {
      res.dispose();
    }
  });

  it('treats malformed task state as an ordinary list item', async () => {
    const ast = {
      type: 'root',
      children: [{
        type: 'list',
        ordered: false,
        children: [{
          type: 'listItem',
          checked: 'yes',
          children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Plain item' }] }],
        }],
      }],
    } as unknown as t.Markdown.Ast;

    const res = await TestReact.render(<ProseMarkdown.UI value={ast} />, { strict: false });
    try {
      expect(res.container.querySelector('li')?.textContent).to.eql('Plain item');
      expect(res.container.querySelector('input')).to.eql(null);
    } finally {
      res.dispose();
    }
  });
});
