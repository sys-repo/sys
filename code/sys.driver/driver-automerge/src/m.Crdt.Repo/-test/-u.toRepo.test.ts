import {
  type Message,
  NetworkAdapter,
  type PeerId,
  type PeerMetadata,
} from '@automerge/automerge-repo';
import {
  afterAll,
  AutomergeRepo,
  describe,
  expect,
  it,
  repoCleanup,
  Rx,
  type t,
  Time,
} from '../../-test.ts';
import { toRepo as toRepoBase } from '../mod.ts';

const Repos = repoCleanup(afterAll); // NB: register the global cleanup hook before the root suite.

describe('CrdtRepo.toRepo construction', () => {
  it('native disposal entrypoints share one completion under await using', async () => {
    const repo = toRepo(new AutomergeRepo());
    const fired: t.DisposeAsyncEvent[] = [];
    repo.dispose$.subscribe((event) => fired.push(event));

    {
      await using resource = repo;
      expect(resource.disposed).to.eql(false);
    }

    const completion = repo.dispose('direct:later');
    expect(repo[Symbol.asyncDispose]()).to.equal(completion);
    await completion;
    expect(repo.disposed).to.eql(true);
    expect(fired.map((event) => event.payload.stage)).to.eql(['start', 'complete']);
    expect(fired.map((event) => event.payload.reason)).to.eql([undefined, undefined]);
  });

  it('synchronous until → constructs before shutdown starts', async () => {
    const repo = toRepo(new AutomergeRepo(), {
      until: Rx.of({ reason: 'synchronous:until' }),
    });
    const fired: t.DisposeAsyncEvent[] = [];
    repo.dispose$.subscribe((event) => fired.push(event));

    expect(repo.disposed).to.eql(false);
    await waitForTerminal(repo);

    expect(repo.disposed).to.eql(true);
    expect(fired.map((event) => event.payload.stage)).to.eql(['start', 'complete']);
    expect(fired[0].payload.reason).to.eql('synchronous:until');
  });

  it('synchronous until → setup failure rolls back repo ownership', async () => {
    const network = [new TestNetworkAdapter('wss://sync.db.team')];
    const base = Repos.automerge(new AutomergeRepo({ network }));
    const shutdown = base.shutdown.bind(base);
    let shutdowns = 0;
    Object.defineProperty(base, 'shutdown', {
      value: async () => {
        shutdowns++;
        await shutdown();
      },
    });

    const failure = new Error('CrdtRepo:test:setup-failure');
    const options = {
      until: Rx.of({ reason: 'synchronous:until' }),
      get peerId(): string {
        throw failure;
      },
    };

    let caught: unknown;
    try {
      toRepoBase(base, options);
    } catch (error) {
      caught = error;
    }

    expect(caught).to.equal(failure);
    expect(shutdowns).to.eql(1);

    await Time.wait(0);
    expect(shutdowns).to.eql(1);
  });

  it('network listener setup failure → rolls back partial registration', () => {
    const adapter = new TestNetworkAdapter('wss://sync.db.team');
    const base = Repos.automerge(new AutomergeRepo({ network: [adapter] }));
    const failure = new Error('CrdtRepo:test:listener-setup-failure');
    const on = adapter.on.bind(adapter);
    const off = adapter.off.bind(adapter);
    let registrations = 0;
    let removals = 0;
    let firstEvent: string | symbol | undefined;
    let firstListener: unknown;

    Object.defineProperties(adapter, {
      on: {
        value(event: string | symbol, listener: unknown) {
          registrations++;
          if (registrations === 2) throw failure;
          firstEvent = event;
          firstListener = listener;
          return Reflect.apply(on, adapter, [event, listener]);
        },
      },
      off: {
        value(event: string | symbol, listener: unknown) {
          if (event === firstEvent && listener === firstListener) removals++;
          return Reflect.apply(off, adapter, [event, listener]);
        },
      },
    });

    let caught: unknown;
    try {
      toRepoBase(base);
    } catch (error) {
      caught = error;
    }

    expect(caught).to.equal(failure);
    expect(registrations).to.eql(2);
    expect(removals).to.eql(1);
  });
});

/**
 * Helpers:
 */
const toRepo = (...args: Parameters<typeof toRepoBase>) => Repos.crdt(toRepoBase(...args));

async function waitForTerminal(life: t.LifecycleAsync) {
  if (life.disposed) return;

  const terminal = Promise.withResolvers<void>();
  const subscription = life.dispose$.subscribe((event) => {
    if (event.payload.is.done) terminal.resolve();
  });
  if (life.disposed) terminal.resolve();

  const timeout = Time.delay(1_000);
  const waitForDispose = async () => {
    await terminal.promise;
    return true;
  };
  const waitForTimeout = async () => {
    await timeout;
    return false;
  };

  try {
    const completed = await Promise.race([waitForDispose(), waitForTimeout()]);
    if (!completed) throw new Error('Timed out waiting for repo disposal');
  } finally {
    subscription.unsubscribe();
    timeout.cancel();
  }
}

class TestNetworkAdapter extends NetworkAdapter {
  readonly url: t.StringUrl;

  constructor(url: t.StringUrl) {
    super();
    this.url = url;
  }

  isReady() {
    return true;
  }

  async whenReady() {}

  connect(peerId: PeerId, peerMetadata?: PeerMetadata) {
    this.peerId = peerId;
    this.peerMetadata = peerMetadata;
  }

  send(_message: Message) {}
  disconnect() {}
}
