import { Color, describe, expect, it } from './common.ts';
import { createStyles } from '../u/u.styles.ts';

describe('Prose.Markdown: styles', () => {
  it('contains block-flow margins inside the renderer root', () => {
    const styles = createStyles({ debug: false, theme: Color.theme('Light') });

    const paragraph = styles.paragraph.style as Record<string, unknown>;
    const codeBlock = styles.codeBlock.style as Record<string, unknown>;
    const heading = styles.heading.style as Record<string, unknown>;
    const list = styles.list.style as Record<string, unknown>;

    expect(styles.base.style.display).to.eql('flow-root');
    [paragraph, codeBlock, heading, list].forEach((block) => {
      expect(block[':first-child']).to.eql({ marginTop: 0 });
      expect(block[':last-child']).to.eql({ marginBottom: 0 });
    });
    expect(codeBlock.maxWidth).to.eql('100%');
    expect(codeBlock.overflowX).to.eql('auto');
  });
});
