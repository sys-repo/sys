import { describe, expect, Fs, it, Str, Testing } from '../../-test.ts';
import { Cli, stripAnsi, type t } from '../common.ts';
import { StartReporter } from '../u.lifecycle/u.start.reporter.ts';
import { createShutdownSignal } from '../u.lifecycle/u.shutdown.ts';
import { loadStartCell, startCell, type StartCellReady } from '../u.lifecycle/u.start.ts';
import { withRuntimeDir } from './u.fixture.kill.ts';
import { HttpFixture } from './u.fixture.service-http.ts';

const target = `\x1b]8;;${HttpFixture.href}\x1b\\`;

describe('@sys/cell/cli start owner presentation', () => {
  it('ordinary HTTP endpoint → owner links reach onReady with Cell identity and resize budgets', async () => {
    const { cell, runtime } = await fixture();
    const shutdown = createShutdownSignal();
    const screen = screenReporter(shutdown);
    HttpFixture.reset();
    let ready = false;
    try {
      const onReady = (input: StartCellReady) => {
        ready = true;
        expect(HttpFixture.silent).to.eql(true);
        expect(input.text).to.contain(target);
        expect(stripAnsi(input.text)).to.contain('selected');
        expect(stripAnsi(input.text)).to.contain('./owner.ts');
        expect(stripAnsi(input.text)).not.to.contain('owner-http');
        expect(HttpFixture.reads).to.eql(1);
        expect(HttpFixture.calls).to.have.length(1);
        expect(HttpFixture.calls[0].detail).to.equal(HttpFixture.details[0]);
        expect(HttpFixture.calls[0].receiver).to.eql(undefined);

        for (const width of [24, 100]) {
          const text = input.render({ width, hyperlinks: false });
          expect(text).to.contain(target);
          for (const line of text.split('\n')) {
            expect(Cli.Fmt.Text.Width.measure(line)).to.be.at.most(width);
          }
        }
        expect(HttpFixture.calls).to.have.length(3);
        expect(HttpFixture.calls[1].maxWidth).to.be.lessThan(HttpFixture.calls[2].maxWidth!);
        screen.reporter.open();
        screen.reporter.ready(input);
        screen.resize(24);
        const frame = screen.frames.at(-1)!;
        expect(frame).to.contain(target);
        for (const line of frame.split('\n')) {
          expect(Cli.Fmt.Text.Width.measure(line)).to.be.at.most(24);
        }
        expect(HttpFixture.calls).to.have.length(5);
        expect(HttpFixture.reads).to.eql(1);
        shutdown.interrupt();
      };
      await withRuntimeDir(runtime, () => startCell(cell, { shutdown, onReady }));
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

  it('owner formatter failure → exact error survives and the HTTP listener is released', async () => {
    const { cell, runtime } = await fixture();
    const shutdown = createShutdownSignal();
    const cause = new Error('owner presentation failed');
    let thrown: unknown;
    HttpFixture.reset();
    HttpFixture.failure = cause;
    try {
      try {
        const onReady = () => shutdown.interrupt();
        await withRuntimeDir(runtime, () => startCell(cell, { shutdown, onReady }));
      } catch (error) {
        thrown = error;
      }
      expect(thrown).to.equal(cause);
      expect(HttpFixture.calls).to.have.length(1);
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
    let thrown: unknown;
    HttpFixture.reset();
    try {
      try {
        const onReady = (input: StartCellReady) => {
          screen.reporter.open();
          screen.reporter.ready(input);
          HttpFixture.failure = cause;
          screen.resize(24);
        };
        await withRuntimeDir(runtime, () => startCell(cell, { shutdown, onReady }));
      } catch (error) {
        thrown = error;
      }
      expect(thrown).to.equal(cause);
      expect(HttpFixture.calls).to.have.length(3);
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
  }, {
    until: shutdown.done,
    onInterrupt: () => {
      shutdown.interrupt();
    },
    onFailure: (cause) => shutdown.failPresentation(cause),
  });
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
  `);
  await Fs.write(Fs.join(fs.dir, '-config/@sys.cell/cell.yaml'), descriptor);
  return { cell: await loadStartCell(fs.dir), runtime: Fs.join(fs.dir, 'runtime') };
}

function expectPortReleased() {
  const port = HttpFixture.server!.addr.port;
  const listener = Deno.listen({ hostname: '127.0.0.1', port });
  listener.close();
}
