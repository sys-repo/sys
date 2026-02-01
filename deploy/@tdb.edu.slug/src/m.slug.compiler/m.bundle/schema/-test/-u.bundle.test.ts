import { describe, expect, it } from '../../../-test.ts';
import { Schema } from '../../common.ts';
import { SchemaBundleConfig } from '../mod.ts';

describe('SchemaBundleConfig', () => {
  it('accepts bundles array with discriminated kinds', () => {
    const doc = {
      bundles: [
        {
          kind: 'slug-tree:fs',
          crdt: { docid: 'slug:test', path: '/slug' },
        },
        {
          kind: 'slug-tree:media:seq',
          crdt: { docid: 'slug:test', path: '/slug' },
        },
      ],
    };
    const ok = Schema.Value.Check(SchemaBundleConfig, doc);
    expect(ok).to.eql(true);
  });

  it('rejects bundle entries without kind', () => {
    const doc = { bundles: [{ crdt: { docid: 'slug:test', path: '/slug' } }] };
    const ok = Schema.Value.Check(SchemaBundleConfig, doc);
    expect(ok).to.eql(false);
  });
});
