import { describe, expect, it } from '../../-test.ts';
import { Test } from '../mod.ts';
import { Total } from './mod.ts';

describe('Total', () => {
  it('count: no constraints', async () => {
    const root = Test.describe('root', (e) => {
      e.it('hello world', () => null);
      e.describe('child', (e) => {
        e.describe('grandchild', (e) => {
          e.it('foo');
          e.it('bar');
        });
      });
    });
    await root.init();

    const res = Total.count(root);
    expect(res.total).to.eql(3);
    expect(res.skipped).to.eql(0);
    expect(res.only).to.eql(0);
  });

  it('count: .only AND .skip constraints', async () => {
    const root = Test.describe('root', (e) => {
      e.it('hello 1');
      e.it('hello 2');
      e.describe('child', (e) => {
        e.describe.only('grandchild', (e) => {
          e.it.skip('foo');
          e.it('bar');
          e.it('baz');
        });
      });
    });
    await root.init();

    const res = Total.count(root);

    expect(res.total).to.eql(5);
    expect(res.runnable).to.eql(2);
    expect(res.only).to.eql(2);
    expect(res.skipped).to.eql(1);
  });

  it('count: .only constraints (on spec)', async () => {
    const root = Test.describe('root', (e) => {
      e.it('hello 1');
      e.it('hello 2');
      e.describe('child', (e) => {
        e.describe('grandchild', (e) => {
          e.it.skip('foo');
          e.it('bar');
          e.it.only('baz');
        });
      });
    });
    await root.init();

    const res = Total.count(root);

    expect(res.total).to.eql(5);
    expect(res.runnable).to.eql(1);
    expect(res.skipped).to.eql(1);
    expect(res.only).to.eql(1);
  });
});
