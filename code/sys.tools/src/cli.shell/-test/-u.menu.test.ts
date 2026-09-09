import { c, Cli, describe, expect, it } from '../../-test.ts';
import { shellMenuItems, shellMenuOptions } from '../u.menu.ts';

describe('cli.shell menu', () => {
  it('renders shell submenu actions with a cyan back arrow', () => {
    const options = shellMenuOptions();
    const values = options.map((option) => option.value);

    expect(values).to.eql([
      'doctor',
      'alias:list',
      'path:list',
      'init:dry-run',
      'alias:enable/sys/dry-run',
      'alias:enable/common/dry-run',
      'path:add/deno/dry-run',
      'back',
    ]);

    const back = options.find((option) => option.value === 'back');
    expect(back?.name).to.contain(c.cyan('←'));
    expect(Cli.stripAnsi(back?.name ?? '')).to.eql('← back');
  });

  it('maps each shell submenu command to the argv it executes', () => {
    const items = shellMenuItems().map(({ value, argv }) => [value, argv]);

    expect(items).to.eql([
      ['doctor', ['doctor']],
      ['alias:list', ['alias', 'list']],
      ['path:list', ['path', 'list']],
      ['init:dry-run', ['init', '--dry-run']],
      ['alias:enable/sys/dry-run', ['alias', 'enable', 'sys', '--dry-run']],
      ['alias:enable/common/dry-run', ['alias', 'enable', 'common', '--dry-run']],
      ['path:add/deno/dry-run', ['path', 'add', 'deno', '--dry-run']],
    ]);
  });
});
