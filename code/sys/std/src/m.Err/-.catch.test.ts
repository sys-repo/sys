// deno-lint-ignore-file require-await
import { describe, it, expect, type t } from '../-test.ts';
import { Err } from './mod.ts';

describe('Err.catch', () => {
  const getUser = async (id: number, throwErr?: boolean) => {
    if (throwErr) throw new Error(`Boom:${id}`, { cause: `getUser(${id})` });
    return { id };
  };

  it('success', async () => {
    const res = await Err.catch(getUser(1));
    expect(res.ok).to.eql(true);
    expect(res.data).to.eql({ id: 1 });
    expect(res.data?.id).to.equal(1);
    if (res.ok) expect(res.data.id).to.equal(1);
  });

  it('fail (error)', async () => {
    const res = await Err.catch(getUser(123, true));
    expect(res.ok).to.eql(false);
    expect(res.data).to.eql(undefined);

    expect(res.error?.name).to.eql('Error');
    expect(res.error?.message).to.eql('Boom:123');
    expect(res.error?.cause?.message).to.eql('getUser(123)');
  });
});
