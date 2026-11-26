import {
  Cli,
  describe,
  expect,
  expectError,
  Fs,
  it,
  Str,
  stripAnsi,
  type t,
  Testing,
} from './common.ts';
import { StartReporter } from '../u.lifecycle/u.start.reporter.ts';
import { createShutdownSignal } from '../u.lifecycle/u.shutdown.ts';
import { loadStartCell, startCell, type StartCellReady } from '../u.lifecycle/u.start.ts';
import { withRuntimeDir } from './u.fixture.kill.ts';
import { HttpFixture } from './u.fixture.service-http.ts';

const target = `\x1b]8;;${HttpFixture.href}\x1b\\`;

describe('@sys/cell/cli start owner presentation', () => {
  it('selected HTTP variant → links and browser targets share the captured owner status', async () => {
    const { cell, runtime } = await fixture();
    const shutdown = createShutdownSignal();
    const screen = screenReporter(shutdown);
    HttpFixture.reset();
    let urlsReads = 0;
    let hrefReads = 0;
    HttpFixture.projectStatus = (snapshot) => ({
      ...snapshot,
      get urls() {
        if (++urlsReads > 1) throw new Error('owner urls read twice');
        return [{
          get href() {
            if (++hrefReads > 1) throw new Error('owner href read twice');
            return snapshot.urls![0].href;
          },
        }];
      },
    });
    let ready = false;
    try {
      const onReady = (input: StartCellReady) => {
        ready = true;
        expect(HttpFixture.silent).to.eql(true);
        expect(input.text).to.contain(target);
        expect(stripAnsi(input.text)).to.contain('selected --mode=dev');
        expect(stripAnsi(input.text)).to.contain('./owner.ts');
        expect(stripAnsi(input.text)).not.to.contain('owner-http');
        expect(HttpFixture.reads).to.eql(1);
        expect(HttpFixture.calls[0].detail).to.equal(HttpFixture.details[0]);
        expect(HttpFixture.calls[0].receiver).to.eql(undefined);
        const server = HttpFixture.server!;
        const href = `${server.origin}/`;
        const browser = {
          targets: [{ service: 'selected', pathname: '/', href }],
          diagnostics: [],
        };
        expect(input.browser).to.eql(browser);
        const status = server.status;
        server.status = () => ({ state: status().state, urls: [{ href: 'http://changed.test/' }] });

        for (const [width, label] of [[24, 'shell'], [100, 'owner shell link']] as const) {
          const text = input.render({ width, hyperlinks: false });
          expect(text).to.contain(Cli.Fmt.hyperlink(label, new URL(HttpFixture.href)));
          for (const line of text.split('\n')) {
            expect(Cli.Fmt.Text.Width.measure(line)).to.be.at.most(width);
          }
        }
        screen.reporter.open();
        screen.reporter.ready(input);
        const displayedHref = href.replace('127.0.0.1', 'localhost');
        const lines = stripAnsi(screen.frames.at(-1)!).split('\n');
        const markedUrls = lines.flatMap((line) => line.split(/⦿ +/).slice(1));
        expect(markedUrls).to.eql([displayedHref]);
        screen.resize(24);
        const frame = screen.frames.at(-1)!;
        expect(frame).to.contain(target);
        for (const line of frame.split('\n')) {
          expect(Cli.Fmt.Text.Width.measure(line)).to.be.at.most(24);
        }
        expect(HttpFixture.reads).to.eql(1);
        expect({ urlsReads, hrefReads }).to.eql({ urlsReads: 1, hrefReads: 1 });
        expect(input.browser).to.eql(browser);
        expect(frame).not.to.contain('changed.test');
        shutdown.interrupt();
      };
      await withRuntimeDir(runtime, () => startCell(cell, { mode: 'dev', shutdown, onReady }));
      expect(ready).to.eql(true);
      expect(HttpFixture.server?.status().state).to.eql('stopped');
      expectPortReleased();
    } finally {
      await screen.reporter.dispose();
      shutdown.dispose();
      await HttpFixture.server?.close();
      HttpFixture.reset();
    }
  });

  it('uses the same indexed URL entries for display and ambiguity in either order', async () => {
    class PublishedUrls extends Array<t.Service.Url> {
      override [Symbol.iterator]() {
        return [this[0]].values();
      }
    }
    const a = { href: 'https://a.test/' };
    const b = { href: 'https://b.test/' };
    for (const urls of [new PublishedUrls(a, b), new PublishedUrls(b, a)]) {
      const { cell, runtime } = await fixture();
      const shutdown = createShutdownSignal();
      HttpFixture.reset();
      HttpFixture.projectStatus = (snapshot) => ({ ...snapshot, urls });
      let ready: StartCellReady | undefined;
      try {
        const onReady = (input: StartCellReady) => {
          ready = input;
          shutdown.interrupt();
        };
        await withRuntimeDir(runtime, () => startCell(cell, { shutdown, onReady }));
        if (!ready) throw new Error('Cell did not publish a ready snapshot.');
        const text = stripAnsi(ready.render({ width: 100, hyperlinks: false }));
        expect(text).to.contain(a.href);
        expect(text).to.contain(b.href);
        expect(ready.browser).to.eql({
          targets: [],
          diagnostics: [{ service: 'selected', pathname: '/', matches: 2 }],
        });
        expect(HttpFixture.reads).to.eql(1);
        expectPortReleased();
      } finally {
        shutdown.dispose();
        await HttpFixture.server?.close();
        HttpFixture.reset();
      }
    }
  });

  it('owner formatter failure → exact error survives and the HTTP listener is released', async () => {
    const { cell, runtime } = await fixture();
    const shutdown = createShutdownSignal();
    const cause = new Error('owner presentation failed');
    HttpFixture.reset();
    HttpFixture.failure = cause;
    try {
      const failure = await expectError(() =>
        withRuntimeDir(runtime, () => startCell(cell, { shutdown, onReady: shutdown.interrupt }))
      );
      expect(failure).to.equal(cause);
      expect(HttpFixture.server?.status().state).to.eql('stopped');
      expectPortReleased();
    } finally {
      shutdown.dispose();
      await HttpFixture.server?.close();
      HttpFixture.reset();
    }
  });

  it('owner failure during screen resize → reporter closes the Cell lifecycle with the same cause', async () => {
    const { cell, runtime } = await fixture();
    const shutdown = createShutdownSignal();
    const screen = screenReporter(shutdown);
    const cause = new Error('resize presentation failed');
    HttpFixture.reset();
    try {
      const onReady = (input: StartCellReady) => {
        screen.reporter.open();
        screen.reporter.ready(input);
        HttpFixture.failure = cause;
        screen.resize(24);
      };
      const failure = await expectError(() =>
        withRuntimeDir(runtime, () => startCell(cell, { shutdown, onReady }))
      );
      expect(failure).to.equal(cause);
      expect(HttpFixture.server?.status().state).to.eql('stopped');
      expectPortReleased();
    } finally {
      await screen.reporter.dispose();
      shutdown.dispose();
      await HttpFixture.server?.close();
      HttpFixture.reset();
    }
  });
});

/** Only terminal effects are supplied; status, capture, rendering, and endpoint loading stay real. */
function screenReporter(shutdown: ReturnType<typeof createShutdownSignal>) {
  const frames: string[] = [];
  let onResize = (_size: t.Cli.Screen.Size) => {};
  const reporter = StartReporter.create('screen', {
    isInteractive: () => true,
    isTerminal: () => true,
    header: () => '',
    size: () => ({ width: 100, height: 24 }),
    observeResize(handler) {
      onResize = handler;
      return () => {
        onResize = () => {};
      };
    },
    repaint: (frame) => frames.push(frame),
    bindKeyboard: () => undefined,
  }, shutdown);
  return { reporter, frames, resize: (width: number) => onResize({ width, height: 24 }) };
}

async function fixture() {
  const fs = await Testing.dir('CellCli.start.owner-presentation');
  const endpoint = new URL('./u.fixture.service-http.ts', import.meta.url).href;
  await Fs.write(Fs.join(fs.dir, 'owner.ts'), `export { HttpOwner } from '${endpoint}';\n`);
  const descriptor = Str.dedent(`
    kind: cell
    version: 1
    services:
      - name: selected
        use: HttpOwner
        from: ./owner.ts
        config: ./owner.yaml
        browser: '/'
        variants:
          dev:
            use: HttpOwner
            from: ./owner.ts
            config: ./owner.dev.yaml
  `);
  await Fs.write(Fs.join(fs.dir, '-config/@sys.cell/cell.yaml'), descriptor);
  return { cell: await loadStartCell(fs.dir), runtime: Fs.join(fs.dir, 'runtime') };
}

function expectPortReleased() {
  const port = HttpFixture.server!.addr.port;
  const listener = Deno.listen({ hostname: '127.0.0.1', port });
  listener.close();
}
