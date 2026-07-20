import { describe, expect, it, type t } from '../../-test.ts';
import { DevOutputLog } from '../u.dev.output.ts';

describe('DevOutputLog', () => {
  it('assembles process chunks into bounded stdout and stderr lines', () => {
    const log = DevOutputLog.create({ maxLines: 3 });

    log.push(event('stdout', 'one\nt'));
    log.push(event('stdout', 'wo\nthree\n'));
    log.push(event('stderr', 'warn\n\n\n'));

    expect(log.lines()).to.eql([
      { source: 'stdout', text: 'two' },
      { source: 'stdout', text: 'three' },
      { source: 'stderr', text: 'warn' },
    ]);
    expect(log.stderr()).to.eql('warn\n\n\n');
    expect(log.tailText()).to.eql(' out   two\n out   three\n err   warn');
  });

  it('includes pending partial output in snapshots without committing it twice', () => {
    const log = DevOutputLog.create({ maxLines: 5 });

    log.push(event('stdout', 'ready'));
    expect(log.tailText()).to.eql(' out   ready');

    log.push(event('stdout', ' now\n'));
    expect(log.tailText()).to.eql(' out   ready now');
  });

  it('strips ANSI from diagnostic tail text', () => {
    const log = DevOutputLog.create();

    log.push(event('stderr', '\u001b[31mfailed\u001b[39m\n'));

    expect(log.tailText()).to.eql(' err   failed');
  });

  it('keeps zero max lines as an empty visible tail', () => {
    const log = DevOutputLog.create({ maxLines: 0 });

    log.push(event('stdout', 'ready\n'));
    log.push(event('stderr', 'failed'));

    expect(log.lines()).to.eql([]);
    expect(log.tailText()).to.eql('');
    expect(log.stderr()).to.eql('failed');
  });

  it('bounds retained raw stderr diagnostics', () => {
    const log = DevOutputLog.create({ maxStderrChars: 7 });

    log.push(event('stderr', 'first\n'));
    log.push(event('stderr', 'second\n'));

    expect(log.stderr()).to.eql('second\n');
  });
});

function event(source: t.Process.StdStream, text: string): t.Process.Event {
  return {
    source,
    data: new TextEncoder().encode(text),
    toString: () => text,
  };
}
