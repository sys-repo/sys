import { Color, describe, expect, it } from './common.ts';
import { createStyles } from '../u/u.styles.ts';

describe('Prose.Markdown: styles', () => {
  it('contains block-flow margins inside the renderer root', () => {
    const styles = createStyles({ debug: false, theme: Color.theme('Light') });

    const paragraph = styles.paragraph.style as Record<string, unknown>;
    const list = styles.list.style as Record<string, unknown>;

    expect(styles.base.style.display).to.eql('flow-root');
    expect(paragraph[':last-child']).to.eql({ marginBottom: 0 });
    expect(list[':first-child']).to.eql({ marginTop: 0 });
    expect(list[':last-child']).to.eql({ marginBottom: 0 });
  });
});
