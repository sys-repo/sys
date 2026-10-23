import { describe, expect, it } from '../-test/mod.ts';
import { HashFmt } from '../m.Fmt/mod.ts';
import { CompositeHash, FileHashUri } from '../m.Hash.Composite/mod.ts';
import { Wrangle } from '../m.Hash.Composite/u.wrangle.ts';
import { Hash } from '../m.Hash/mod.ts';
import { SignEd25519 } from '../m.Sign.Ed25519/mod.ts';

describe('crypto namespace freeze contract', () => {
  it('freezes every exported namespace API and nested namespace', () => {
    const namespaces = [
      FileHashUri,
      CompositeHash,
      CompositeHash.Uri,
      Wrangle,
      SignEd25519,
      Hash,
      Hash.Is,
      HashFmt,
    ];
    for (const namespace of namespaces) expect(Object.isFrozen(namespace)).to.eql(true);

    expect(CompositeHash.Uri.File).to.equal(FileHashUri);
  });
});
