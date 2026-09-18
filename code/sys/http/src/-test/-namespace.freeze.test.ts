import { describe, expect, it } from '../-test.ts';
import { Http } from '../http/mod.ts';
import { Cache, Fetch, HttpClient, Preload, ServiceWorker } from '../http.client/mod.ts';
import { CacheCmd } from '../http.client/m.HttpCache.Cmd/mod.ts';
import { PkgCache } from '../http.client/m.HttpCache/u.pkg.names.ts';
import { HttpCmd } from '../http.cmd/mod.ts';
import { Fmt as ProxyFmt } from '../http.server/m.HttpProxy/m.cli/u.fmt.ts';
import { ProxyConfigPath } from '../http.server/m.HttpProxy/u.config/u.path.ts';
import { StaticConfigPath } from '../http.server/m.HttpStatic/u.config.path.ts';
import { Fmt as StaticFmt } from '../http.server/m.HttpStatic/u.fmt.ts';
import { HttpProxy, HttpPull, HttpServer, HttpStatic } from '../http.server/mod.ts';

describe('http namespace freeze contract', () => {
  it('freezes every exported namespace API and nested namespace', () => {
    const namespaces = [
      Http,
      Http.Client,
      Http.Server,
      HttpClient,
      HttpClient.Url,
      Fetch,
      Preload,
      Cache,
      Cache.Cmd,
      Cache.Pkg,
      ServiceWorker,
      CacheCmd,
      CacheCmd.Handlers,
      PkgCache,
      HttpCmd,
      HttpServer,
      HttpStatic,
      HttpStatic.Config,
      HttpProxy,
      HttpProxy.Config,
      HttpProxy.Root,
      HttpProxy.Mount,
      ProxyConfigPath,
      ProxyFmt,
      StaticConfigPath,
      StaticFmt,
      HttpPull,
    ];
    for (const namespace of namespaces) expect(Object.isFrozen(namespace)).to.eql(true);
  });
});
