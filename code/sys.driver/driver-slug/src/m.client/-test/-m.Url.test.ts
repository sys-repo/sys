import { describe, expect, it } from '../../-test.ts';
import { SlugUrl } from '../m.Url.ts';
import { SlugClient } from '../mod.ts';

describe('SlugUrl.isAbsoluteHref', () => {
  it('API', () => {
    expect(SlugClient.Url).to.equal(SlugUrl);
  });

  it('returns true for http URLs', () => {
    expect(SlugUrl.isAbsoluteHref('http://example.com')).to.eql(true);
  });

  it('returns true for https URLs', () => {
    expect(SlugUrl.isAbsoluteHref('https://example.com/path')).to.eql(true);
  });

  it('returns false for protocol-relative URLs', () => {
    expect(SlugUrl.isAbsoluteHref('//example.com')).to.eql(false);
  });

  it('returns false for relative paths', () => {
    expect(SlugUrl.isAbsoluteHref('/assets/video.mp4')).to.eql(false);
    expect(SlugUrl.isAbsoluteHref('assets/video.mp4')).to.eql(false);
  });

  it('returns false for empty or undefined input', () => {
    expect(SlugUrl.isAbsoluteHref('')).to.eql(false);
    expect(SlugUrl.isAbsoluteHref(undefined as unknown as string)).to.eql(false);
  });

  it('computes slug-tree filenames', () => {
    const docid = 'crdt:tree-test';
    const expected = `slug-tree.${SlugUrl.clean(docid)}.json`;
    expect(SlugUrl.treeFilename(docid)).to.eql(expected);
  });
});
