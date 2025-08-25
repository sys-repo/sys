import { describe, expect, it } from '../-test.ts';
import { Token } from './mod.ts';

describe('GPT', () => {
  it('API', async () => {
    const m = await import('@sys/text/gpt');
    expect(m.Token).to.equal(Token);
  });

  describe('Token', () => {
    describe('Token.count', () => {
      it('empty → 0', () => {
        expect(Token.count('')).to.eql(0);
      });

      it('hello world → 2 (o200k_base)', () => {
        const text = 'hello world';
        const n = Token.count(text);
        expect(n).to.eql(2); // current default encoding behavior
      });

      it('deterministic across calls', () => {
        const a = Token.count('repeatable');
        const b = Token.count('repeatable');
        expect(a).to.eql(b);
      });
    });

    describe('Token.encode', () => {
      it('encodes to numeric ids', () => {
        const ids = Token.encode('hello');
        expect(Array.isArray(ids)).to.eql(true);
        ids.forEach((x) => expect(x).to.be.a('number'));
      });

      it('length equals count', () => {
        const text = 'sample text';
        expect(Token.encode(text).length).to.eql(Token.count(text));
      });

      it('different inputs produce different encodings', () => {
        expect(Token.encode('cat')).to.not.deep.eql(Token.encode('dog'));
      });
    });
  });
});
