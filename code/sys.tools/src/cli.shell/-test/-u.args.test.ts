import { describe, expect, it } from '../../-test.ts';
import { parseArgs, shellFlag, stringFlag } from '../u.args.ts';

describe('cli.shell args', () => {
  it('parses doctor command', () => {
    const args = parseArgs(['doctor']);
    expect(args.command).to.eql('doctor');
  });

  it('parses alias list command', () => {
    const args = parseArgs(['alias', 'list']);
    expect(args.command).to.eql('alias');
    expect(args.alias).to.eql({ command: 'list' });
  });

  it('parses alias enable target', () => {
    const args = parseArgs(['alias', 'enable', 'common', '--dry-run']);
    expect(args.command).to.eql('alias');
    expect(args.alias).to.eql({ command: 'enable', target: 'common' });
    expect(args['dry-run']).to.eql(true);
  });

  it('rejects unknown alias enable targets', () => {
    const args = parseArgs(['alias', 'enable', 'cp']);
    expect(args.alias).to.eql({ command: 'enable', target: undefined });
  });

  it('parses init command', () => {
    const args = parseArgs(['init', '--dry-run']);
    expect(args.command).to.eql('init');
    expect(args['dry-run']).to.eql(true);
  });

  it('parses apply as a hidden compatibility alias', () => {
    const args = parseArgs(['apply', '--dry-run']);
    expect(args.command).to.eql('apply');
    expect(args['dry-run']).to.eql(true);
  });

  it('parses path list command', () => {
    const args = parseArgs(['path', 'list']);
    expect(args.command).to.eql('path');
    expect(args.path).to.eql({ command: 'list' });
  });

  it('parses path add target', () => {
    const args = parseArgs(['path', 'add', 'deno', '--dry-run']);
    expect(args.command).to.eql('path');
    expect(args.path).to.eql({ command: 'add', target: 'deno' });
    expect(args['dry-run']).to.eql(true);
  });

  it('rejects unknown path add targets', () => {
    const args = parseArgs(['path', 'add', 'node']);
    expect(args.path).to.eql({ command: 'add', target: undefined });
  });

  it('normalizes supported shell and string flags', () => {
    expect(shellFlag('zsh')).to.eql('zsh');
    expect(shellFlag('fish')).to.eql(undefined);
    expect(stringFlag('  /tmp/profile  ')).to.eql('/tmp/profile');
    expect(stringFlag('  ')).to.eql(undefined);
  });
});
