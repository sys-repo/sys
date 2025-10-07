import { describe, expect, it } from '../../-test.ts';

import { CrdtIs } from './common.ts';
import { DocumentId } from './mod.ts';
import { Parse } from './u.Parse.ts';
import { View } from './ui.tsx';
import { useController } from './use.Controller.ts';

describe('DocumentId', () => {
  it('API', () => {
    expect(DocumentId.View).to.equal(View);
    expect(DocumentId.Parse).to.equal(Parse);
    expect(DocumentId.useController).to.equal(useController);
  });

  describe('Parse.textbox', () => {
    const VALID_ID = '28pHMgPCrMR82eexLbPzvXq3RnSy';

    it('returns empty id/path for an empty string', () => {
      const result = Parse.textbox('');
      expect(result).to.eql({ text: '', id: '' });
    });

    it('recognizes a bare valid ID with no slash', () => {
      expect(CrdtIs.id(VALID_ID)).to.be.true;
      const result = Parse.textbox(VALID_ID);
      expect(result).to.eql({ text: VALID_ID, id: VALID_ID });
    });

    it('extracts single-segment path', () => {
      const input = `${VALID_ID}/foo`;
      const result = Parse.textbox(input);
      expect(result).to.eql({
        text: input,
        id: VALID_ID,
        path: ['foo'],
      });
    });

    it('extracts multi-segment path', () => {
      const input = `${VALID_ID}/foo/bar/baz`;
      const result = Parse.textbox(input);
      expect(result).to.eql({
        text: input,
        id: VALID_ID,
        path: ['foo', 'bar', 'baz'],
      });
    });

    it('ignores trailing slash without creating empty segment', () => {
      const input = `${VALID_ID}/`;
      const result = Parse.textbox(input);
      expect(result).to.eql({ text: input, id: VALID_ID });
    });

    it('collapses consecutive slashes into proper segments', () => {
      const input = `${VALID_ID}//one///two/`;
      const result = Parse.textbox(input);
      expect(result).to.eql({
        text: input,
        id: VALID_ID,
        path: ['one', 'two'],
      });
    });

    it('treats everything as text when ID is invalid', () => {
      const badId = 'not-an-id';
      expect(CrdtIs.id(badId)).to.be.false;
      const input = `${badId}/foo/bar`;
      const result = Parse.textbox(input);
      expect(result).to.eql({ text: input, id: '' });
    });

    it('does not extract path when ID is invalid, even if slash present', () => {
      const input = 'foo/bar';
      const result = Parse.textbox(input);
      expect(result).to.eql({ text: input, id: '' });
    });

    it('handles leading slash (empty id candidate)', () => {
      const input = '/foo/bar';
      const result = Parse.textbox(input);
      expect(result).to.eql({ text: input, id: '' });
    });

    it('preserves whitespace in path segments', () => {
      const input = `${VALID_ID}/  space here /end  `;
      const result = Parse.textbox(input);
      expect(result).to.eql({
        text: input,
        id: VALID_ID,
        path: ['  space here ', 'end  '],
      });
    });
  });
});
