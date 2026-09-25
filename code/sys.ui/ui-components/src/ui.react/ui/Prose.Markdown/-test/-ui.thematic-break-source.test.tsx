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

describe('Prose.Markdown.UI: thematic-break source DSL', () => {
  DomMock.init({ beforeEach, afterEach });

  it('maps marker, count, and spacing to native rule texture, thickness, and density', async () => {
    const source = Str.dedent(`
      Solid three.

      ---

      Dashed four.

      ____

      Dotted spaced six.

      * * * * * *

      Solid clamped twelve.

      ------------
    `);
    const res = await TestReact.render(
      <ProseMarkdown.UI
        value={source}
        renderers={{ thematicBreak: ProseMarkdown.ThematicBreak.source }}
      />,
      { strict: false },
    );

    try {
      const rules = [...res.container.querySelectorAll('hr')];
      expect(rules.map((element) => {
        const view = element.ownerDocument.defaultView;
        if (!view) throw new Error('Expected a DOM window for computed styles.');
        const style = view.getComputedStyle(element);
        return {
          element: element.localName,
          texture: style.borderTopStyle,
          thickness: style.borderTopWidth,
          density: style.opacity,
          height: style.height,
          width: style.width,
        };
      })).to.eql([
        {
          element: 'hr',
          texture: 'solid',
          thickness: '1px',
          density: '0.7',
          height: '0px',
          width: '100%',
        },
        {
          element: 'hr',
          texture: 'dashed',
          thickness: '2px',
          density: '0.7',
          height: '0px',
          width: '100%',
        },
        {
          element: 'hr',
          texture: 'dotted',
          thickness: '4px',
          density: '0.4',
          height: '0px',
          width: '100%',
        },
        {
          element: 'hr',
          texture: 'solid',
          thickness: '10px',
          density: '0.7',
          height: '0px',
          width: '100%',
        },
      ]);
    } finally {
      res.dispose();
    }
  });

  it('inherits the resolved prose color across themes', async () => {
    const themes: t.CommonTheme[] = ['Light', 'Dark'];

    for (const theme of themes) {
      const res = await TestReact.render(
        <ProseMarkdown.UI
          value='---'
          theme={theme}
          renderers={{ thematicBreak: ProseMarkdown.ThematicBreak.source }}
        />,
        { strict: false },
      );

      try {
        const root = res.container.firstElementChild;
        const rule = res.container.querySelector('hr');
        const view = res.container.ownerDocument.defaultView;
        if (!root || !rule || !view) throw new Error('Expected rendered thematic-break elements.');

        expect(view.getComputedStyle(rule).borderTopColor).to.eql(
          view.getComputedStyle(root).color,
        );
      } finally {
        res.dispose();
      }
    }
  });

  it('preserves the neutral native rule when source lexemes are unavailable', async () => {
    const ast: t.Markdown.Ast = { type: 'root', children: [{ type: 'thematicBreak' }] };
    const res = await TestReact.render(
      <ProseMarkdown.UI
        value={ast}
        renderers={{ thematicBreak: ProseMarkdown.ThematicBreak.source }}
      />,
      { strict: false },
    );

    try {
      const rule = res.container.querySelector('hr');
      expect(rule?.getAttribute('class')).to.eql(null);
    } finally {
      res.dispose();
    }
  });
});
