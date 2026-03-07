import { describe, expect, it } from '../../-test.ts';
import { Open } from '../mod.ts';

describe('Open.resolveCommand', () => {
  it('maps darwin to open', () => {
    const res = Open.resolveCommand('https://example.com', 'darwin');
    expect(res).eql({ cmd: 'open', args: ['https://example.com'] });
  });

  it('maps windows to explorer.exe', () => {
    const res = Open.resolveCommand('https://example.com', 'windows');
    expect(res).eql({ cmd: 'explorer.exe', args: ['https://example.com'] });
  });

  it('maps linux to xdg-open', () => {
    const res = Open.resolveCommand('https://example.com', 'linux');
    expect(res).eql({ cmd: 'xdg-open', args: ['https://example.com'] });
  });

  it('falls back to open for other platforms', () => {
    const res = Open.resolveCommand('https://example.com', 'freebsd');
    expect(res).eql({ cmd: 'open', args: ['https://example.com'] });
  });
});
