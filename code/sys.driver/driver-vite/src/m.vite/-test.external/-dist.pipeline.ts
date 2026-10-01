import type { Pkg as FsPkg } from '@sys/fs/t';
import { Dist, DistServer } from '@sys/server/dist';
import type { Dist as DistContract } from '@sys/server/t';
import {
  describe,
  expect,
  Fs,
  Hash,
  HashFmt,
  Is,
  it,
  Json,
  Obj,
  Pkg,
  stripAnsi,
  type t,
  Testing,
} from '../../-test.ts';
import { writeIntegrityProject } from './u.html-integrity.project.ts';
import { Vite } from '../mod.ts';
import { removeStores, runPipeline } from './u.dist.pipeline.cleanup.ts';

type Build = Extract<t.Vite.Build.Response, { ok: true }>;
type Audience = 'private' | 'public';
type Revision = 'first' | 'second';
type RevisionRecord = {
  readonly name: Revision;
  readonly build: Build;
  readonly selection: t.DistPins<Audience>;
  readonly dirs: Readonly<Record<Audience, string>>;
};
type HostedAudience = {
  readonly dir: string;
  readonly pin: t.DistPin;
  readonly evidence: FsPkg.Dist.Verify.Evidence;
  readonly storeDir: string;
  readonly host: t.DistServer.Started;
};
type HostedRevision = Readonly<Record<Audience, HostedAudience>>;
type Transport = {
  readonly origin: URL;
  readonly policy: DistContract.Policy;
  readonly responses: Map<string, Uint8Array<ArrayBuffer>>;
  readonly hosts: t.DistServer.Started[];
};

const audiences = ['private', 'public'] as const;
const base = 'https://assets.example.test/pipeline/';
const DIST_LIMITS = {
  manifestBytes: 65_536,
  entries: 256,
  fileBytes: 1_048_576,
  totalBytes: 4_194_304,
};
const DIST_BATCH_LIMITS = { inventories: 2, totalBytes: DIST_LIMITS.totalBytes };

describe('Dist content pipeline', () => {
  it('two real builds → recorded projections → materialization → pinned serving and SRI bytes', async () => {
    const fixture: {
      root?: string;
      source?: ReturnType<typeof Testing.Http.server>;
    } = {};
    const responses = new Map<string, Uint8Array<ArrayBuffer>>();
    const requests: string[] = [];
    const hosts: t.DistServer.Started[] = []; // Cleanup registry, never an audience lookup.
    await runPipeline(async () => {
      // The local fixture inherits existing workspace authority; no synthetic graph or lock.
      const parent = Fs.resolve('./.tmp/test');
      await Fs.ensureDir(parent);
      const temp = await Fs.makeTempDir({ dir: parent, prefix: 'vite-dist-pipeline-' });
      fixture.root = temp.absolute; // Own the root before canonicalization can fail.
      const root = await Fs.realPath(temp.absolute);
      fixture.root = root;
      const source = Testing.Http.server((request) => {
        const path = new URL(request.url).pathname;
        requests.push(path);
        const bytes = responses.get(path);
        return bytes ? new Response(bytes) : new Response(null, { status: 404 });
      });
      fixture.source = source; // Own the listener before URL/policy/project setup can fail.
      const origin = new URL(source.url.href);
      origin.hostname = '127.0.0.1';
      const policy = transportPolicy(origin.origin);
      await writeIntegrityProject(root, { mode: 'local-asset-composition' });
      const revisions = {
        first: await buildProjectCapture(root, 'first'),
        second: await buildProjectCapture(root, 'second'),
      };
      expect(revisions.first.build.dist.hash).to.eql(revisions.second.build.dist.hash);
      expect(revisions.first.build.pin).to.eql(revisions.second.build.pin);
      expect(revisions.first.build.dist.build.time).not.to.eql(
        revisions.second.build.dist.build.time,
      );
      expect(revisions.first.build.manifestChecksum).not.to.eql(
        revisions.second.build.manifestChecksum,
      );
      expect(revisions.first.selection).to.eql(revisions.second.selection);
      const digests = [
        revisions.first.build.pin.digest,
        revisions.first.selection.pins.private.digest,
        revisions.first.selection.pins.public.digest,
      ];
      expect(new Set(digests).size).to.eql(3);

      // A separately observed document may change layout/root labels without changing authority.
      for (const audience of audiences) {
        const path = Fs.join(root, revisions.second.dirs[audience], 'dist.json');
        const manifest = (await Fs.readJson<t.DistPkg>(path)).data;
        if (!manifest) throw new Error('Missing second projection manifest.');
        const observation = {
          ...manifest,
          pkg: { name: '@descriptive/only', version: '9.9.9' },
          build: { ...manifest.build, time: 1 },
        };
        await Fs.write(path, Json.stringify(observation, 0), { throw: true });
      }

      const transport = { origin, policy, responses, hosts };
      const served = {
        first: await materializeServeAttest(root, revisions.first, transport),
        second: await materializeServeAttest(root, revisions.second, transport),
      };
      for (const audience of audiences) {
        expect(served.first[audience].evidence.manifestChecksum).not.to.eql(
          served.second[audience].evidence.manifestChecksum,
        );
      }
      await verifySri(served.first);
      await verifySri(served.second);

      // Warm reuse is offline and retains the first document, not the second build's metadata.
      const calls = requests.length;
      responses.clear();
      for (const audience of audiences) {
        const reused = await Dist.materialize({
          manifestUrl: new URL(`second/${audience}/dist.json`, origin).href,
          pin: served.second[audience].pin,
          storeDir: served.first[audience].storeDir,
          policy,
        });
        if (reused.kind !== 'existing') throw new Error(Json.stringify(reused));
        expect(reused.verification.manifestChecksum).to.eql(
          served.first[audience].evidence.manifestChecksum,
        );
      }
      expect(requests.length).to.eql(calls);

      // Pinned reads and whole-tree verification still refuse changed bytes after startup.
      const { dir, pin, evidence } = served.second.public;
      const hosted = await DistServer.start({
        dir,
        pin,
        limits: DIST_LIMITS,
        silent: true,
        keyboard: false,
      });
      hosts.push(hosted); // Register before the first request/assertion can fail.
      const path = 'toolchain.json';
      const original = await fetch(`${hosted.origin}/${path}`);
      const originalBytes = new Uint8Array(await original.arrayBuffer());
      expect(original.status).to.eql(200);
      expect(Hash.sha256(originalBytes)).to.eql(Pkg.Dist.Part.hash(evidence.content.parts[path]));
      expect(originalBytes.byteLength).to.eql(Pkg.Dist.Part.size(evidence.content.parts[path]));
      await Fs.write(Fs.join(dir, path), 'changed payload', { throw: true });
      const corrupt = await fetch(`${hosted.origin}/${path}`);
      await corrupt.arrayBuffer();
      expect(corrupt.status).to.eql(412);
      const changedBytes = await Pkg.Dist.Pinned.verify({ dir, pin, limits: DIST_LIMITS });
      expect(changedBytes.kind).to.eql('content-mismatch');
      const changed = await Pkg.Dist.compute({ dir, save: true });
      if (changed.kind !== 'computed') throw new Error(changed.error.message);
      expect(changed.pin).not.to.eql(pin);
      const stalePin = await Pkg.Dist.Pinned.verify({ dir, pin, limits: DIST_LIMITS });
      expect(stalePin.kind).to.eql('pin-mismatch');
      await Fs.rename(Fs.join(dir, path), Fs.join(dir, 'renamed.json'));
      const renamed = await Pkg.Dist.compute({ dir, save: true });
      if (renamed.kind !== 'computed') throw new Error(renamed.error.message);
      expect(renamed.pin).not.to.eql(changed.pin);
      const stalePath = await Pkg.Dist.Pinned.verify({
        dir,
        pin: changed.pin,
        limits: DIST_LIMITS,
      });
      expect(stalePath.kind).to.eql('pin-mismatch');

      responses.set('/stale/dist.json', await readBytes(Fs.join(dir, 'dist.json')));
      const before = requests.length;
      const refused = await Dist.materialize({
        manifestUrl: new URL('stale/dist.json', origin).href,
        pin,
        storeDir: Fs.join(root, 'stores', 'stale'),
        policy,
      });
      expect(refused).to.eql({
        kind: 'failed',
        stage: 'manifest-admission',
        reason: 'pin-mismatch',
        cleanup: 'not-needed',
      });
      expect(requests.slice(before)).to.eql(['/stale/dist.json']);
    }, {
      hosts,
      async dispose() {
        await fixture.source?.dispose();
      },
      async removeStores() {
        if (Is.str(fixture.root)) await removeStores(fixture.root);
      },
      async removeRoot() {
        if (Is.str(fixture.root)) await Fs.remove(fixture.root);
      },
    });
  });
});

async function buildProjectCapture(root: string, name: Revision): Promise<RevisionRecord> {
  const paths = Vite.Config.paths({ cwd: root, app: { entry: './index.html', base } });
  const build = await Vite.build({
    paths,
    silent: true,
    spinner: false,
    exitOnError: false,
    dependencyPolicy: 'frozen-cache',
  });
  if (!build.ok) throw new Error(build.toString());
  expect(stripAnsi(build.toString({ width: 500 })))
    .to.include(stripAnsi(HashFmt.digest(build.pin.digest)));
  const dirs = { private: `${name}.private`, public: `${name}.public` };
  const projected = await Pkg.Dist.project({
    root,
    source: { dir: 'dist', pin: build.pin },
    outputs: dirs,
    select: (content) => ({
      private: ['index.html'],
      public: Obj.keys(content.parts).filter((path) => path !== 'index.html'),
    }),
    limits: DIST_LIMITS,
    batch: DIST_BATCH_LIMITS,
  });
  if (projected.kind !== 'projected') throw new Error(Json.stringify(projected));
  // Independent producer output is recorded locally, never learned from HTTP.
  const recordPath = Fs.join(root, `${name}.pins.json`);
  await Fs.writeJson(recordPath, { pins: projected.pins }, { throw: true });
  const selection = Pkg.Dist.Pins.capture((await Fs.readJson(recordPath)).data, {
    names: { private: true, public: true },
  });
  expect(selection.pins).to.eql(projected.pins);
  return { name, build, selection, dirs };
}

async function materializeServeAttest(
  root: string,
  revision: RevisionRecord,
  transport: Transport,
): Promise<HostedRevision> {
  const verified = await Pkg.Dist.Pins.verify({
    root,
    selection: revision.selection,
    dirs: revision.dirs,
    limits: DIST_LIMITS,
    batch: DIST_BATCH_LIMITS,
  });
  if (verified.kind !== 'verified') throw new Error(Json.stringify(verified));
  const attest = async (audience: Audience): Promise<HostedAudience> => {
    const evidence = verified.evidence[audience];
    const pin = revision.selection.pins[audience];
    const dir = Fs.join(root, revision.dirs[audience]);
    expect(pin).to.eql({ scheme: evidence.content.scheme, digest: evidence.content.digest });
    for (const path of [...Obj.keys(evidence.content.parts), 'dist.json']) {
      transport.responses.set(
        `/${revision.name}/${audience}/${path}`,
        await readBytes(Fs.join(dir, path)),
      );
    }
    const args: DistContract.MaterializeArgs = {
      manifestUrl: new URL(`${revision.name}/${audience}/dist.json`, transport.origin).href,
      pin,
      storeDir: Fs.join(root, 'stores', revision.name, audience),
      policy: transport.policy,
    };
    await Fs.ensureDir(args.storeDir);
    const materialized = await Dist.materialize(args);
    if (materialized.kind !== 'promoted') throw new Error(Json.stringify(materialized));
    expect(materialized.dir).to.eql(Fs.join(args.storeDir, 'sys.dist-v2', pin.digest));
    expect(materialized.pin).to.eql(pin);
    expect(materialized.verification).to.eql(evidence);
    const host = await DistServer.start({
      dir: materialized.dir,
      pin,
      limits: DIST_LIMITS,
      silent: true,
      keyboard: false,
    });
    transport.hosts.push(host); // Own the host before any attestation can fail.
    expect(host.authority).to.eql({ kind: 'pinned', pin });
    const hidden = await fetch(`${host.origin}/dist.json`);
    await hidden.arrayBuffer();
    expect(hidden.status).to.eql(404);
    for (const [path, part] of Obj.entries(evidence.content.parts)) {
      const response = await fetch(`${host.origin}/${path}`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      expect(response.status).to.eql(200);
      expect(Hash.sha256(bytes)).to.eql(Pkg.Dist.Part.hash(part));
      expect(bytes.byteLength).to.eql(Pkg.Dist.Part.size(part));
    }
    return { dir, pin, evidence, storeDir: args.storeDir, host };
  };
  return { private: await attest('private'), public: await attest('public') };
}

async function verifySri(revision: HostedRevision): Promise<void> {
  // SRI names hosted JS/CSS bytes, not the Dist pin or document checksum.
  const response = await fetch(`${revision.private.host.origin}/index.html`);
  const html = await response.text();
  expect(response.status).to.eql(200);
  const tags = [...html.matchAll(/<(?:script|link)\b[^>]*\sintegrity="([^"]+)"[^>]*>/g)];
  expect(tags).to.have.length(3);
  const assets = tags.map(([tag, integrity]) => {
    const url = /\s(?:src|href)="([^"]+)"/.exec(tag)?.[1];
    if (!Is.str(url) || !url.startsWith(base)) throw new Error('Missing asset base.');
    return { tag, integrity, url, path: url.slice(base.length) };
  });
  const entries = assets.filter(({ tag }) => /^<script\b/.test(tag) && /\stype="module"/.test(tag));
  const styles = assets.filter(({ tag }) => /^<link\b/.test(tag) && /\srel="stylesheet"/.test(tag));
  const preloads = assets.filter(({ tag }) =>
    /^<link\b/.test(tag) && /\srel="modulepreload"/.test(tag)
  );
  expect(entries, 'module entry').to.have.length(1);
  expect(styles, 'stylesheet').to.have.length(1);
  expect(preloads, 'overlapping modulepreload').to.have.length(1);
  expect(entries[0].path.endsWith('.js')).to.eql(true);
  expect(styles[0].path.endsWith('.css')).to.eql(true);
  expect(preloads[0].url).to.eql(entries[0].url);
  expect(preloads[0].integrity).to.eql(entries[0].integrity);
  for (const { path, integrity } of assets) {
    const response = await fetch(`${revision.public.host.origin}/${path}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect(response.status).to.eql(200);
    expect(Hash.sha256(bytes, { encoding: 'base64' })).to.eql(integrity);
  }
}

async function readBytes(path: string): Promise<Uint8Array<ArrayBuffer>> {
  const { data } = await Fs.read(path);
  if (!data) throw new Error(`Missing pipeline fixture: ${path}`);
  return Uint8Array.from(data);
}

function transportPolicy(origin: string): DistContract.Policy {
  const response = {
    maxBytes: DIST_LIMITS.fileBytes,
    timeout: 5_000,
    progressInterval: 10,
    maxRedirects: 0,
    sourceOrigins: [origin],
    credentialOrigins: [],
  };
  return {
    manifest: { ...response, maxBytes: DIST_LIMITS.manifestBytes },
    resources: {
      response,
      maxResources: DIST_LIMITS.entries,
      concurrency: 2,
      maxAttempts: 1,
      retryDelay: 0,
      maxRetryElapsed: 5_000,
      maxTotalBytes: DIST_LIMITS.totalBytes,
      totalTimeout: 10_000,
    },
    verification: DIST_LIMITS,
  };
}
