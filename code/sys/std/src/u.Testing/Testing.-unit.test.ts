import { Testing, describe, expect, it } from './mod.ts';

Deno.test('Deno.test: sample (down at the test runner metal)', async (test) => {
  await test.step('eql', () => {
    expect(123).to.eql(123);
  });
});

describe('Testing', () => {
  it('exports BDD semantics', () => {
    expect(Testing.Bdd.describe).to.equal(describe);
    expect(Testing.Bdd.it).to.equal(it);
    expect(Testing.Bdd.expect).to.equal(expect);
  });

  it('randomPort', () => {
    const a = Testing.randomPort();
    const b = Testing.randomPort();

    expect(typeof a === 'number').to.be.true;
    expect(a).to.not.eql(b);
  });
});
