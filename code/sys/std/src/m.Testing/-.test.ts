import { Id } from '../m.Id/mod.ts';
import { Testing, describe, expect, it, expectError } from './mod.ts';

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

  it('slug', () => {
    const id = Testing.slug();
    expect(Id.Is.slug(id)).to.be.true;
  });

  describe('expectError', () => {
    const throwError = (message: string) => {
      throw new Error(message);
    };

    it('succeeds (default message)', async () => {
      await expectError(async () => {
        await Testing.wait(0);
        throwError('Foo');
      });
    });

    it('succeeds (custom message)', async () => {
      await expectError(() => throwError('Bar'), 'Bar');
    });

    it('fails when error not thrown', async () => {
      await expectError(async () => {
        await expectError(() => null);
      });
    });
  });
});
