import { describe, expect, it } from '../../-test.ts';
import { parseArgs } from '../u.args.ts';

describe('m.tmpl/u.args', () => {
  it('parses positional template and generic flags', () => {
    const res = parseArgs([
      'pkg',
      '--dir',
      './code/ns/foo',
      '--dry-run',
      '--force',
      '--pkgName',
      '@my-scope/foo',
    ]);

    expect(res.tmpl).to.eql('pkg');
    expect(res.dir).to.eql('./code/ns/foo');
    expect(res.dryRun).to.eql(true);
    expect(res.force).to.eql(true);
    expect(res.pkgName).to.eql('@my-scope/foo');
    expect(res.interactive).to.eql(true);
    expect(res._).to.eql(['pkg']);
  });

  it('accepts --dryRun as a compatibility alias', () => {
    const res = parseArgs(['pkg', '--dryRun']);
    expect(res.dryRun).to.eql(true);
  });

  it('parses --non-interactive and template name flags', () => {
    const res = parseArgs(['m.mod.ui', '--name', 'Button', '--dir', 'src/ui/Button', '--non-interactive']);

    expect(res.tmpl).to.eql('m.mod.ui');
    expect(res.name).to.eql('Button');
    expect(res.dir).to.eql('src/ui/Button');
    expect(res.interactive).to.eql(false);
    expect(res._).to.eql(['m.mod.ui']);
  });

  it('parses bundle mode', () => {
    const res = parseArgs(['--bundle']);
    expect(res.bundle).to.eql(true);
    expect(res.tmpl).to.eql(undefined);
  });
});
