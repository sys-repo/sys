import React from 'react';

import { afterEach, beforeEach, describe, DomMock, expect, it, TestReact } from '../../../-test.ts';
import { D as ChipD } from '../../Chip/common.ts';
import { D as ProseMarkdownD } from '../../Prose.Markdown/common.ts';
import { CursorHelp } from '../-spec/-ui.CursorHelp.tsx';

describe('KeyValue CursorHelp', () => {
  DomMock.init({ beforeEach, afterEach });

  it('renders through Prose.Markdown with caller-owned Chip inline-code tokens', async () => {
    const extra = { gesture: 'Option + Enter', text: 'inserts an hr after current.' };
    const res = await TestReact.render(<CursorHelp extraSteps={[extra]} />, { strict: false });

    try {
      const root = res.container.querySelector(`[data-component="${ProseMarkdownD.displayName}"]`);
      const listItems = [...res.container.querySelectorAll('li')];
      const extraRow = listItems.find((el) => el.textContent?.includes(extra.text));
      const extraChip = extraRow?.querySelector(`[data-component="${ChipD.displayName}"]`);

      expect(root).to.not.eql(null);
      expect(listItems.length).to.eql(7);
      expect(extraRow).to.not.eql(undefined);
      expect(extraChip?.textContent).to.eql(extra.gesture);
    } finally {
      res.dispose();
    }
  });
});
