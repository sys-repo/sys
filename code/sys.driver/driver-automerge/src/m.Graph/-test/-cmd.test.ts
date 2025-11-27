import {
  type t,
  afterAll,
  beforeAll,
  describe,
  expect,
  expectTypeOf,
  it,
  makeWorkerFixture,
} from '../../-test.ts';

import { CrdtCmd } from '../../m.Cmd/mod.ts';
import { CrdtGraph } from '../mod.ts';

describe(`Crdt.Graph: using commands`, () => {
  let env: t.TestWorkerFixture;
  let cmd: t.CrdtCmdClient;

  beforeAll(async () => {
    env = await makeWorkerFixture();
    cmd = CrdtCmd.fromRepo(env.repo);
  });

  afterAll(() => env?.dispose());

  it('walks a simple A → B chain via command-backed loader', async () => {
    const { repo } = env;
    type T = { next?: string };

    // 1. Seed documents via the repo (ground truth).
    const A = (await repo.create<T>({ next: '' })).doc!;
    const B = (await repo.create<{ value: number }>({ value: 123 })).doc!;

    // A → B using the default `crdt:` scheme.
    A.change((d) => {
      d.next = `crdt:${B.id}`;
    });

    /**
     * 2. Command-backed loader:
     *    cmd.send('doc:read', { doc: id }) → { value: T }
     *    Adapt into the immutable Graph doc shape: { current: T }.
     */
    const loadViaCmd: t.CrdtGraphLoadDoc<T> = async (id) => {
      const result = await cmd.send('doc:read', { doc: id });
      const current = result.value;
      return !current ? undefined : ({ current } as t.ImmutableSnapshot<T>);
    };

    /**
     * 3. Walk via CrdtGraph using the command-backed loader.
     */
    const seen: t.Crdt.Id[] = [];

    const res = await CrdtGraph.walk<T>({
      id: A.id,
      load: loadViaCmd,
      onDoc: ({ id }) => {
        seen.push(id);
      },
    });

    // 4. Assertions.
    expect(res.processed).to.eql([A.id, B.id]);
    expect(seen).to.eql([A.id, B.id]);
    expectTypeOf(res.processed).toEqualTypeOf<readonly t.Crdt.Id[]>();
  });
});
