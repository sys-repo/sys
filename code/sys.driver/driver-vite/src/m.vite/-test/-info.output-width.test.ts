import { c, describe, expect, it, stripAnsi, type t } from '../../-test/common.ts';
import { ViteLog } from '../../m.fmt/mod.ts';

const HASH = `sha256-${'88f8e3e041df504c3177b35ad742f4aebf99951a0c832fb64c1e1b2edef'}ccd11`;

function expectBounded(text: string, width: number) {
  stripAnsi(text).split('\n').forEach((line) => expect(line.length <= width).to.eql(true));
}

function outputLine(text: string, token: string) {
  return stripAnsi(text).split('\n').find((line) => line.includes(token)) ?? '';
}

function rawOutputLine(text: string, token: string) {
  return text.split('\n').find((line) => stripAnsi(line).includes(token)) ?? '';
}

describe('ViteLog.Dist info output formatting', () => {
  it('collapses the dist row digest before clipping the path', () => {
    const full = outputLine(ViteLog.Dist.toString(dist(), { dirs: dirs(), width: 72 }), 'dist:');
    const algorithm = outputLine(
      ViteLog.Dist.toString(dist(), { dirs: dirs(), width: 58 }),
      'dist:',
    );
    const shortText = ViteLog.Dist.toString(dist(), { dirs: dirs(), width: 48 });
    const short = outputLine(shortText, 'dist:');
    const rawShort = rawOutputLine(shortText, 'dist:');
    const none = outputLine(ViteLog.Dist.toString(dist(), { dirs: dirs(), width: 40 }), 'dist:');

    expect(full).to.include('dist/dist.json ← digest:sha256:#ccd11');
    expect(algorithm).to.include('dist/dist.json ← sha256:#ccd11');
    expect(algorithm).to.not.include('digest:sha256');
    expect(short).to.include('dist/dist.json ← #ccd11');
    expect(short).to.not.include('sha256');
    expect(rawShort).to.include(c.green('#ccd11'));
    expect(none).to.include('dist/dist.json');
    expect(none).to.not.include('←');
    expect(full.length <= 72).to.eql(true);
    expect(algorithm.length <= 58).to.eql(true);
    expect(short.length <= 48).to.eql(true);
    expect(none.length <= 40).to.eql(true);
  });

  it('keeps full hash, timestamp, and builder rows bounded at narrow widths', () => {
    const width = 44;
    const text = ViteLog.Dist.toString(dist(), { dirs: dirs(), width });
    const plain = stripAnsi(text);
    const hash = outputLine(text, 'sha256-');
    const rawHash = rawOutputLine(text, 'sha256-');
    const timestamp = outputLine(text, 'timestamp:');
    const builder = outputLine(text, 'builder:');

    expectBounded(text, width);
    expect(hash).to.include('sha256-');
    expect(hash).to.not.include('digest:');
    expect(hash).to.include('…');
    expect(hash).to.include('ccd11');
    expect(rawHash).to.include(c.gray('ccd11'));
    expect(rawHash).to.not.include(c.green('digest:'));
    expect(timestamp).to.include(' • ');
    expect(timestamp).to.not.include(' | ');
    expect(timestamp).to.include('ago');
    expect(builder).to.include('driver-vite@0.0.460');
    expect(plain).to.include('Production Bundle');
  });

  it('renders wide timestamps in day-month-year order', () => {
    const text = ViteLog.Dist.toString(dist(), { dirs: dirs(), width: 80 });
    const timestamp = outputLine(text, 'timestamp:');

    expectBounded(text, 80);
    expect(timestamp).to.match(/timestamp:\s+\d{1,2} [A-Z][a-z]{2} \d{4}, /);
    expect(timestamp).to.not.match(/timestamp:\s+\d{4} [A-Z][a-z]{2} \d{1,2}, /);
    expect(timestamp).to.include(' • ');
  });

  it('drops module hash and scoped package detail before clipping identity', () => {
    const text = ViteLog.Dist.toString(dist(), { dirs: dirs(), width: 28 });
    const lines = stripAnsi(text).split('\n');
    const module = lines.find((line) => line.includes('ui-components')) ?? '';

    expectBounded(text, 28);
    expect(module).to.include('ui-components');
    expect(module).to.not.include('#ccd11');
  });

  it('keeps every row bounded even at ultra-narrow widths', () => {
    const width = 8;
    const text = ViteLog.Dist.toString(dist(), { dirs: dirs(), width });

    expectBounded(text, width);
  });
});

function dirs(): t.ViteLog.Bundle.IO {
  return { in: './src/index.html', out: './dist' };
}

function dist(): t.DistPkg {
  const now = Date.now() - 12 * 60 * 1000;
  return {
    type: 'https://sys.dev/dist/pkg',
    pkg: { name: '@sys/ui-components', version: '0.0.319' },
    build: {
      time: now,
      size: { total: 2_350_000, pkg: 1_820_000 },
      builder: '@sys/driver-vite@0.0.460',
      runtime: 'deno://test',
      hash: { policy: 'jsr:@sys/driver-vite/hash-policy' },
    },
    hash: { digest: HASH, parts: {} },
  } as t.DistPkg;
}
