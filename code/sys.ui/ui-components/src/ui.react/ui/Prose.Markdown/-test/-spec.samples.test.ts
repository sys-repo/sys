import { MarkdownSample } from '../-spec/-samples.ts';
import { describe, expect, it } from './common.ts';

describe('Prose.Markdown: spec samples', () => {
  it('derives centered or scrolling subject presentation from sample metadata', () => {
    expect(MarkdownSample.viewport('intro')).to.equal('center');
    expect(MarkdownSample.viewport('code-blocks')).to.equal('center');
    expect(MarkdownSample.viewport('lists')).to.equal('center');
    expect(MarkdownSample.viewport('thematic-breaks')).to.equal('scroll');
  });
});
