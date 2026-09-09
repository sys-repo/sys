import { describe, expect, it } from '../-test.ts';
import { Jsr as JsrClient } from '../m.jsr/m.client/mod.ts';
import { Jsr as JsrServer, Manifest } from '../m.jsr/m.server/mod.ts';
import { Npm as NpmClient } from '../m.npm/m.client/mod.ts';
import { Npm as NpmServer } from '../m.npm/m.server/mod.ts';
import { graph } from '../m.jsr/m.client/m.Fetch/u.graph.ts';

describe('registry namespace freeze contract', () => {
  it('freezes every exported namespace API and nested namespace', () => {
    const namespaces = [
      JsrClient,
      JsrClient.Fetch,
      JsrClient.Fetch.Pkg,
      JsrClient.Fetch.Url,
      JsrClient.Is,
      JsrClient.Import,
      JsrServer,
      JsrServer.Manifest,
      Manifest,
      NpmClient,
      NpmClient.Fetch,
      NpmClient.Fetch.Pkg,
      NpmClient.Fetch.Url,
      NpmClient.Fetch.Url.Pkg,
      NpmClient.Is,
      NpmClient.Import,
      NpmServer,
      graph,
    ];
    for (const namespace of namespaces) expect(Object.isFrozen(namespace)).to.eql(true);
  });
});
