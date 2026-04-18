import { describe, expect, it } from '../-test.ts';
import { start } from './mod.ts';
import { parseArgs } from './u.args.ts';
import { resolveKeyboard } from './u.start.ts';

describe('@sys/http/serve', () => {
  it('API', async () => {
    const m = await import('@sys/http/serve');
    expect(m.start).to.equal(start);
  });

  it('args → parses --non-interactive as keyboardless mode', () => {
    const res = parseArgs(['--non-interactive', '--dir', 'dist', '--port', '1234']);

    expect(res['non-interactive']).to.eql(true);
    expect(res.dir).to.eql('dist');
    expect(res.port).to.eql(1234);
  });

  it('keyboard → defaults on and --non-interactive turns it off', () => {
    expect(resolveKeyboard({})).to.eql(true);
    expect(resolveKeyboard({ 'non-interactive': true })).to.eql(false);
    expect(resolveKeyboard({ keyboard: false })).to.eql(false);
    expect(resolveKeyboard({ keyboard: true, 'non-interactive': true })).to.eql(true);
  });
});
