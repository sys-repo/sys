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
import { Sample } from '../-spec/-ui.Sample.tsx';

describe('Prose.Markdown.UI: task-state renderer', () => {
  DomMock.init({ beforeEach, afterEach });

  it('projects validated task state through a caller override', async () => {
    const calls: Array<{
      nodeType: string;
      nodeChecked: boolean;
      checked: boolean;
      ariaLabel: string;
    }> = [];
    const renderers: t.ProseMarkdown.Renderers = {
      taskState: ({ node, checked, ariaLabel }) => {
        calls.push({ nodeType: node.type, nodeChecked: node.checked, checked, ariaLabel });
        return (
          <span
            aria-label={ariaLabel}
            data-task-state={checked ? 'checked' : 'unchecked'}
          />
        );
      },
    };
    const source = Str.dedent(`
      - Plain bullet
      - [x] Checked task
      - [ ] Unchecked task
    `);

    const res = await TestReact.render(
      <ProseMarkdown.UI value={source} renderers={renderers} />,
      { strict: false },
    );
    try {
      const list = res.container.querySelector('ul')!;
      const items = [...list.children] as HTMLLIElement[];
      const markers = [...list.querySelectorAll<HTMLElement>('[data-task-state]')];

      expect(calls).to.eql([
        {
          nodeType: 'listItem',
          nodeChecked: true,
          checked: true,
          ariaLabel: 'Completed task',
        },
        {
          nodeType: 'listItem',
          nodeChecked: false,
          checked: false,
          ariaLabel: 'Incomplete task',
        },
      ]);
      expect(items.length).to.eql(3);
      expect(items[0].textContent).to.eql('Plain bullet');
      expect(markers.map((marker) => ({
        state: marker.dataset.taskState,
        ariaLabel: marker.getAttribute('aria-label'),
        body: marker.parentElement?.nextElementSibling?.textContent,
      }))).to.eql([
        { state: 'checked', ariaLabel: 'Completed task', body: 'Checked task' },
        { state: 'unchecked', ariaLabel: 'Incomplete task', body: 'Unchecked task' },
      ]);
      expect(list.querySelector('input')).to.eql(null);
    } finally {
      res.dispose();
    }
  });

  it('composes an active-looking Switch as inert caller-owned state', async () => {
    const renderers = Sample.renderersFor('task-state', 'Light');
    const res = await TestReact.render(
      <ProseMarkdown.UI value={'- [x] Checked task'} renderers={renderers} />,
      { strict: false },
    );
    try {
      const state = res.container.querySelector<HTMLElement>('span[role="switch"]')!;
      const visual = state.querySelector<HTMLButtonElement>('button[role="switch"]')!;
      const inert = visual.parentElement!;

      expect(state.getAttribute('aria-checked')).to.eql('true');
      expect(state.getAttribute('aria-label')).to.eql('Completed task');
      expect(state.getAttribute('aria-readonly')).to.eql('true');
      expect(visual.getAttribute('aria-checked')).to.eql('true');
      expect(visual.disabled).to.eql(false);
      expect(inert.getAttribute('aria-hidden')).to.eql('true');
      expect(inert.hasAttribute('inert')).to.eql(true);
      expect(res.container.querySelector('input')).to.eql(null);
    } finally {
      res.dispose();
    }
  });

  it('does not invoke the override for malformed task state', async () => {
    let calls = 0;
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
    const renderers: t.ProseMarkdown.Renderers = {
      taskState: () => {
        calls += 1;
        return <span data-task-state />;
      },
    };

    const res = await TestReact.render(<ProseMarkdown.UI value={ast} renderers={renderers} />, {
      strict: false,
    });
    try {
      expect(calls).to.eql(0);
      expect(res.container.querySelector('[data-task-state]')).to.eql(null);
      expect(res.container.querySelector('li')?.textContent).to.eql('Plain item');
    } finally {
      res.dispose();
    }
  });
});
