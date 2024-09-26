import { Testing, describe, expect, it } from './mod.ts';

describe('Test', () => {
  it('exports BDD semantics', () => {
    expect(Testing.Bdd.describe).to.equal(describe);
    expect(Testing.Bdd.it).to.equal(it);
    expect(Testing.Bdd.expect).to.equal(expect);
  });
});

describe('foo', () => {
  describe('bar', () => {
    it('does thing', () => {
      expect(123).to.eql(123);
    });
  });
});

Deno.test('Deno.test: sample', async (test) => {
  await test.step('eql', () => {
    expect(123).to.eql(123);
  });
});
