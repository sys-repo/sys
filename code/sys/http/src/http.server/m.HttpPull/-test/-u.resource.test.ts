import { describe, expect, expectTypeOf, Fs, it, type t, Testing } from '../../../-test.ts';
import { Hash } from '../../common.ts';
import { HttpPull } from '../mod.ts';
import { resourceOptions as options } from './u.fixture.ts';

const encoder = new TextEncoder();
const roots = new Set<t.StringAbsoluteDir>();

function resource(
  source: t.StringUrl,
  target: t.StringRelativePath,
  content: string,
  expectedBytes: t.NumberBytes | undefined = encoder.encode(content).byteLength,
): t.HttpPull.Resource {
  return {
    source,
    target,
    checksum: Hash.sha256(encoder.encode(content)),
    expectedBytes,
  };
}

async function rooted(prefix = 'http-pull-rooted-'): Promise<t.Fs.Rooted.Instance> {
  const dir = await Fs.makeTempDir({ prefix });
  const root = await Fs.realPath(dir.absolute);
  roots.add(root);
  return await Fs.Capability.Rooted.create({ root });
}

function localhost(input: t.StringUrl): t.StringUrl {
  const url = new URL(input);
  if (url.hostname === '0.0.0.0') url.hostname = '127.0.0.1';
  return url.href;
}

function asFailure(record: t.HttpPull.Record): t.HttpPull.RecordFailure {
  if (record.ok) throw new Error('Expected pull failure record');
  return record;
}

function rootedFailure(
  operation: t.Fs.Rooted.Operation,
  kind: t.Fs.Rooted.FailureKind,
  message: string,
): t.Fs.Rooted.Failure {
  const error = new Error(message) as t.Fs.Rooted.Failure;
  Object.defineProperties(error, {
    name: { value: 'FsRootedError' },
    operation: { value: operation },
    kind: { value: kind },
    committed: { value: false },
  });
  return error;
}

describe('HttpPull secure resources', () => {
  Testing.Bdd.afterEach(async () => {
    const paths = [...roots];
    roots.clear();
    await Promise.all(paths.map((path) => Fs.remove(path, { recursive: true })));
  });

  it('exposes the checksum-bound resource contract', () => {
    const value: t.HttpPull.Resource = {
      source: 'https://example.test/file',
      target: 'file',
      checksum: `sha256-${'0'.repeat(64)}`,
    };
    expectTypeOf(value).toEqualTypeOf<{
      readonly source: t.StringUrl;
      readonly target: t.StringRelativePath;
      readonly checksum: t.StringHash;
      readonly expectedBytes?: t.NumberBytes;
    }>();
    expectTypeOf(options([value])).toEqualTypeOf<{
      readonly until?: t.UntilInput;
      readonly concurrency?: never;
      readonly retry?: never;
      readonly map?: never;
      readonly client?: undefined;
      readonly policy: t.HttpFetch.ResponsePolicy;
    }>();
  });

  it('publishes authenticated bytes only at the explicit root-relative target', async () => {
    const content = 'rooted-content';
    const server = Testing.Http.server((req) => Testing.Http.text(req, content));
    try {
      const source = localhost(server.url.join('url-derived', 'ignored.txt'));
      const input = [resource(source, './assets//explicit.bin', content)];
      const root = await rooted();

      const result = await HttpPull.toDir(input, root, options(input));

      expect(result.ok).to.eql(true);
      expect(result.ops).to.have.length(1);
      expect(result.ops[0].path).to.eql({ source, target: 'assets/explicit.bin' });
      expect(await Fs.readText(Fs.join(root.path, 'assets/explicit.bin'))).to.include({
        ok: true,
        data: content,
      });
      expect(await Fs.exists(Fs.join(root.path, 'url-derived', 'ignored.txt'))).to.eql(false);
    } finally {
      await server.dispose();
    }
  });

  it('completes full target admission before the first request', async () => {
    let admitted = false;
    let requestedBeforeAdmission = false;
    const server = Testing.Http.server((req) => {
      requestedBeforeAdmission ||= !admitted;
      return Testing.Http.text(req, 'content');
    });
    try {
      const source = localhost(server.url.join('content.txt'));
      const input = [resource(source, 'admitted/content.txt', 'content')];
      const owner = await rooted();
      const destination: t.Fs.Rooted.Instance = Object.freeze({
        path: owner.path,
        admit: async (targets, operationOptions) => {
          const admission = await owner.admit(targets, operationOptions);
          admitted = true;
          return admission;
        },
        publishFile: owner.publishFile,
        createStage: owner.createStage,
        discardStage: owner.discardStage,
        promoteStage: owner.promoteStage,
      });

      const result = await HttpPull.toDir(input, destination, options(input));

      expect(result.ok).to.eql(true);
      expect(admitted).to.eql(true);
      expect(requestedBeforeAdmission).to.eql(false);
    } finally {
      await server.dispose();
    }
  });

  it('snapshots resources before asynchronous admission and transport work', async () => {
    const server = Testing.Http.server((req) => Testing.Http.text(req, 'stable'));
    try {
      const source = localhost(server.url.join('stable.txt'));
      const mutable = { ...resource(source, 'stable.txt', 'stable') };
      const input: readonly t.HttpPull.Resource[] = [mutable];
      const root = await rooted();
      const pending = HttpPull.toDir(input, root, options(input));

      mutable.source = 'https://example.test/mutated.txt';
      mutable.target = '../mutated.txt';
      mutable.checksum = Hash.sha256(encoder.encode('mutated'));
      mutable.expectedBytes = 1;

      const result = await pending;

      expect(result.ok).to.eql(true);
      expect(result.ops[0].path).to.eql({ source, target: 'stable.txt' });
      expect(await Fs.readText(Fs.join(root.path, 'stable.txt'))).to.include({
        ok: true,
        data: 'stable',
      });
    } finally {
      await server.dispose();
    }
  });

  it('fails closed on hostile resource getters before network work', async () => {
    let requests = 0;
    const server = Testing.Http.server((req) => {
      requests++;
      return Testing.Http.text(req, 'content');
    });
    try {
      const source = localhost(server.url.join('content.txt'));
      const authority = [resource(source, 'authority.txt', 'content')];
      const hostile = Object.defineProperty({}, 'source', {
        enumerable: true,
        get(): never {
          throw new Error('RESOURCE-SECRET');
        },
      }) as t.HttpPull.Resource;
      const root = await rooted();

      const result = await HttpPull.toDir([hostile], root, options(authority));

      expect(result.ok).to.eql(false);
      expect(result.ops).to.have.length(1);
      expect(result.ops[0].error).to.eql('Invalid secure pull resource');
      expect(JSON.stringify(result).includes('RESOURCE-SECRET')).to.eql(false);
      expect(requests).to.eql(0);
    } finally {
      await server.dispose();
    }
  });

  it('does not trust Rooted failure messages as HTTP diagnostics', async () => {
    let requests = 0;
    const server = Testing.Http.server((req) => {
      requests++;
      return Testing.Http.text(req, 'content');
    });
    try {
      const source = localhost(server.url.join('content.txt'));
      const input = [resource(source, 'content.txt', 'content')];
      const owner = await rooted();
      const admissionFailure: t.Fs.Rooted.Instance = Object.freeze({
        path: owner.path,
        admit: () => Promise.reject(rootedFailure('admit', 'invalid-target', 'ADMISSION-SECRET')),
        publishFile: owner.publishFile,
        createStage: owner.createStage,
        discardStage: owner.discardStage,
        promoteStage: owner.promoteStage,
      });
      const publicationFailure: t.Fs.Rooted.Instance = Object.freeze({
        path: owner.path,
        admit: owner.admit,
        publishFile: () =>
          Promise.reject(rootedFailure('publish-file', 'io-failure', 'PUBLICATION-SECRET')),
        createStage: owner.createStage,
        discardStage: owner.discardStage,
        promoteStage: owner.promoteStage,
      });

      const admission = await HttpPull.toDir(input, admissionFailure, options(input));
      const publication = await HttpPull.toDir(input, publicationFailure, options(input));

      expect(admission.ok).to.eql(false);
      expect(admission.ops[0].error).to.eql('Secure pull target admission failed');
      expect(asFailure(admission.ops[0]).filesystem).to.eql({
        operation: 'admit',
        kind: 'invalid-target',
        committed: false,
      });
      expect(publication.ok).to.eql(false);
      expect(publication.ops[0].error).to.eql('Secure pull publication failed');
      expect(asFailure(publication.ops[0]).filesystem).to.eql({
        operation: 'publish-file',
        kind: 'io-failure',
        committed: false,
      });
      expect(JSON.stringify([admission, publication]).includes('SECRET')).to.eql(false);
      expect(requests).to.eql(1);
    } finally {
      await server.dispose();
    }
  });

  it('rejects every invalid source before admission effects or network work', async () => {
    let requests = 0;
    const server = Testing.Http.server((req) => {
      requests++;
      return Testing.Http.text(req, 'valid');
    });
    try {
      const valid = localhost(server.url.join('valid.txt'));
      const input = [
        resource(valid, 'safe/valid.txt', 'valid'),
        resource('ftp://example.test/invalid.txt', 'safe/invalid.txt', 'invalid'),
        resource('/relative.txt', 'safe/relative.txt', 'invalid'),
        resource(
          'https://TRANSPORT-SECRET@example.test/credentialed.txt',
          'safe/credentialed.txt',
          'invalid',
        ),
      ];
      const root = await rooted();

      const result = await HttpPull.toDir(input, root, options(input));

      expect(result.ok).to.eql(false);
      expect(result.ops).to.have.length(input.length);
      expect(result.ops.every((record) => !record.ok)).to.eql(true);
      expect(result.ops.every((record) => record.error === 'Invalid secure pull source')).to.eql(
        true,
      );
      expect(JSON.stringify(result).includes('TRANSPORT-SECRET')).to.eql(false);
      expect(result.ops.slice(1).every((record) => record.path.source === '')).to.eql(true);
      expect(result.ops.every((record) => record.path.target === '')).to.eql(true);
      expect(requests).to.eql(0);
      expect(await Fs.exists(Fs.join(root.path, 'safe'))).to.eql(false);
    } finally {
      await server.dispose();
    }
  });

  it('rejects unsafe targets and complete-batch collisions before network work', async () => {
    let requests = 0;
    const server = Testing.Http.server((req) => {
      requests++;
      return Testing.Http.text(req, 'content');
    });
    try {
      const source = `${localhost(server.url.join('content.txt'))}?token=TARGET-SECRET`;
      const cases: readonly (readonly t.HttpPull.Resource[])[] = [
        [resource(source, '../outside.txt', 'content')],
        [resource(source, '/absolute.txt', 'content')],
        [resource(source, 'C:/drive.txt', 'content')],
        [resource(source, 'nested\\backslash.txt', 'content')],
        [
          resource(source, './same.txt', 'content'),
          resource(source, 'same.txt', 'content'),
        ],
        [
          resource(source, 'pkg', 'content'),
          resource(source, 'pkg/entry.js', 'content'),
        ],
      ];

      for (const input of cases) {
        const root = await rooted();
        const result = await HttpPull.toDir(input, root, options(input));
        expect(result.ok).to.eql(false);
        expect(result.ops).to.have.length(input.length);
        expect(result.ops.every((record) => !record.ok)).to.eql(true);
        expect(
          result.ops.every((record) => record.error === 'Secure pull target admission failed'),
        ).to.eql(true);
        expect(result.ops.every((record) => record.path.target === '')).to.eql(true);
        expect(
          result.ops.every((record) => {
            const failure = asFailure(record);
            return failure.filesystem?.operation === 'admit' &&
              failure.filesystem.committed === false;
          }),
        ).to.eql(true);
        expect(JSON.stringify(result).includes('TARGET-SECRET')).to.eql(false);
        expect(requests).to.eql(0);
      }
    } finally {
      await server.dispose();
    }
  });

  it('preflights canonical checksums and exact byte sizes before network work', async () => {
    let requests = 0;
    const server = Testing.Http.server((req) => {
      requests++;
      return Testing.Http.text(req, 'content');
    });
    try {
      const source = localhost(server.url.join('content.txt'));
      const root = await rooted();
      const invalid = [
        { ...resource(source, 'bad-hash.txt', 'content'), checksum: 'sha256-NOT-CANONICAL' },
        { ...resource(source, 'bad-size.txt', 'content'), expectedBytes: -1 },
      ] as readonly t.HttpPull.Resource[];

      const result = await HttpPull.toDir(invalid, root, options(invalid));

      expect(result.ok).to.eql(false);
      expect(result.ops).to.have.length(invalid.length);
      expect(result.ops.every((record) => !record.ok)).to.eql(true);
      expect(requests).to.eql(0);
      expect(await Fs.exists(Fs.join(root.path, 'bad-hash.txt'))).to.eql(false);
      expect(await Fs.exists(Fs.join(root.path, 'bad-size.txt'))).to.eql(false);
    } finally {
      await server.dispose();
    }
  });

  it('rejects checksum and exact-size mismatches before immutable publication', async () => {
    const content = 'actual-content';
    const server = Testing.Http.server((req) => Testing.Http.text(req, content));
    try {
      const source = localhost(server.url.join('content.txt'));
      const root = await rooted();
      const checksumMismatch = [resource(source, 'checksum.txt', 'different-content')];
      const sizeMismatch = [resource(source, 'size.txt', content, 1)];

      const checksum = await HttpPull.toDir(
        checksumMismatch,
        root,
        options(checksumMismatch),
      );
      const size = await HttpPull.toDir(sizeMismatch, root, options(sizeMismatch));

      expect(checksum.ok).to.eql(false);
      expect(checksum.ops[0].status).to.eql(412);
      expect(checksum.ops[0].error).to.eql(
        'Fetched resource checksum does not match expected checksum',
      );
      expect(size.ok).to.eql(false);
      expect(size.ops[0].error).to.eql(
        'Fetched resource byte size does not match expected bytes',
      );
      expect(await Fs.exists(Fs.join(root.path, 'checksum.txt'))).to.eql(false);
      expect(await Fs.exists(Fs.join(root.path, 'size.txt'))).to.eql(false);
    } finally {
      await server.dispose();
    }
  });

  it('does not retry secure resources before bounded retry policy exists', async () => {
    let requests = 0;
    const server = Testing.Http.server(() => {
      requests++;
      return Testing.Http.error(503, 'TEMP');
    });
    try {
      const source = localhost(server.url.join('retry.txt'));
      const input = [resource(source, 'retry.txt', 'never-published')];
      const root = await rooted();

      const result = await HttpPull.toDir(input, root, options(input));

      expect(result.ok).to.eql(false);
      expect(result.ops[0].error).to.eql('Secure pull request failed');
      expect(requests).to.eql(1);
      expect(await Fs.exists(Fs.join(root.path, 'retry.txt'))).to.eql(false);
    } finally {
      await server.dispose();
    }
  });

  it('never replaces an occupied target', async () => {
    const server = Testing.Http.server((req) => Testing.Http.text(req, 'challenger'));
    try {
      const source = localhost(server.url.join('occupied.txt'));
      const input = [resource(source, 'occupied.txt', 'challenger')];
      const root = await rooted();
      await Fs.write(Fs.join(root.path, 'occupied.txt'), 'winner');

      const result = await HttpPull.toDir(input, root, options(input));

      expect(result.ok).to.eql(false);
      expect(result.ops[0].error).to.eql('Secure pull publication failed');
      expect(asFailure(result.ops[0]).filesystem).to.eql({
        operation: 'publish-file',
        kind: 'occupied',
        committed: false,
      });
      expect(await Fs.readText(Fs.join(root.path, 'occupied.txt'))).to.include({
        ok: true,
        data: 'winner',
      });
    } finally {
      await server.dispose();
    }
  });

  it('permits exactly one winner across concurrent batches targeting the same file', async () => {
    const server = Testing.Http.server((req) => {
      const content = new URL(req.url).pathname.endsWith('/alpha.txt') ? 'alpha' : 'bravo';
      return Testing.Http.text(req, content);
    });
    try {
      const alphaSource = localhost(server.url.join('alpha.txt'));
      const bravoSource = localhost(server.url.join('bravo.txt'));
      const alpha = [resource(alphaSource, 'winner.txt', 'alpha')];
      const bravo = [resource(bravoSource, 'winner.txt', 'bravo')];
      const root = await rooted();

      const results = await Promise.all([
        HttpPull.toDir(alpha, root, options(alpha)),
        HttpPull.toDir(bravo, root, options(bravo)),
      ]);

      expect(results.filter((result) => result.ok)).to.have.length(1);
      expect(results.filter((result) => !result.ok)).to.have.length(1);
      const content = await Fs.readText(Fs.join(root.path, 'winner.txt'));
      expect(content.ok).to.eql(true);
      expect(['alpha', 'bravo']).to.include(content.data);
    } finally {
      await server.dispose();
    }
  });

  it('surfaces foreign capability handles without publishing', async () => {
    const server = Testing.Http.server((req) => Testing.Http.text(req, 'content'));
    try {
      const source = localhost(server.url.join('foreign.txt'));
      const input = [resource(source, 'foreign.txt', 'content')];
      const owner = await rooted('http-pull-owner-');
      const foreign = await rooted('http-pull-foreign-');
      const crossed: t.Fs.Rooted.Instance = Object.freeze({
        path: owner.path,
        admit: owner.admit,
        publishFile: foreign.publishFile,
        createStage: owner.createStage,
        discardStage: owner.discardStage,
        promoteStage: owner.promoteStage,
      });

      const result = await HttpPull.toDir(input, crossed, options(input));

      expect(result.ok).to.eql(false);
      expect(result.ops[0].error).to.eql('Secure pull publication failed');
      expect(asFailure(result.ops[0]).filesystem).to.eql({
        operation: 'publish-file',
        kind: 'foreign-handle',
        committed: false,
      });
      expect(await Fs.exists(Fs.join(owner.path, 'foreign.txt'))).to.eql(false);
      expect(await Fs.exists(Fs.join(foreign.path, 'foreign.txt'))).to.eql(false);
    } finally {
      await server.dispose();
    }
  });

  it('supports the secure stream overload with root-relative records', async () => {
    const server = Testing.Http.server((req) => Testing.Http.text(req, 'streamed'));
    try {
      const source = localhost(server.url.join('mapped', 'source.txt'));
      const input = [resource(source, 'stream/target.txt', 'streamed')];
      const root = await rooted();
      const stream = HttpPull.stream(input, root, options(input));
      const events: t.HttpPull.Event.Any[] = [];

      for await (const event of stream) events.push(event);
      const result = await stream.done;

      expect(result.ok).to.eql(true);
      expect(result.ops[0].path.target).to.eql('stream/target.txt');
      expect(events.some((event) => event.kind === 'done')).to.eql(true);
      expect(await Fs.readText(Fs.join(root.path, 'stream/target.txt'))).to.include({
        ok: true,
        data: 'streamed',
      });
    } finally {
      await server.dispose();
    }
  });

  it('contains hostile secure stream batches within sanitized preflight', async () => {
    let requests = 0;
    const server = Testing.Http.server((req) => {
      requests++;
      return Testing.Http.text(req, 'content');
    });
    try {
      const source = localhost(server.url.join('content.txt'));
      const authority = [resource(source, 'content.txt', 'content')];
      const input = new Proxy([] as t.HttpPull.Resource[], {
        get(target, property, receiver) {
          if (property === 'length') throw new Error('BATCH-SECRET');
          return Reflect.get(target, property, receiver);
        },
      });
      const root = await rooted();
      const stream = HttpPull.stream(input, root, options(authority));
      const events: t.HttpPull.Event.Any[] = [];

      for await (const event of stream) events.push(event);
      const result = await stream.done;

      expect(result.ok).to.eql(false);
      expect(result.ops).to.have.length(0);
      expect(events).to.have.length(0);
      expect(JSON.stringify(result).includes('BATCH-SECRET')).to.eql(false);
      expect(requests).to.eql(0);
    } finally {
      await server.dispose();
    }
  });

  it('preflights the secure stream batch before network work', async () => {
    let requests = 0;
    const server = Testing.Http.server((req) => {
      requests++;
      return Testing.Http.text(req, 'streamed');
    });
    try {
      const source = localhost(server.url.join('source.txt'));
      const input = [resource(source, '../invalid.txt', 'streamed')];
      const root = await rooted();
      const stream = HttpPull.stream(input, root, options(input));
      const events: t.HttpPull.Event.Any[] = [];

      for await (const event of stream) events.push(event);
      const result = await stream.done;

      expect(result.ok).to.eql(false);
      expect(result.ops).to.have.length(1);
      expect(result.ops[0].path.target).to.eql('');
      expect(events.filter((event) => event.kind === 'error')).to.have.length(1);
      expect(requests).to.eql(0);
    } finally {
      await server.dispose();
    }
  });
});
