import { describe, expect, it, Path } from '../../-test.ts';
import { ShellStructure } from '../mod.ts';
import { Fixture } from './u.fixture.ts';

const SAMPLE = 'shell.yaml';
const root = Path.resolve(import.meta.dirname ?? '.', '../../../-sample/app');

describe('ShellStructure sample app shell over Files<T>', () => {
  it('loads the minimal authored Shell.Structure sample through Files<T>', async () => {
    const yaml = await Fixture.Files.readText({ root, path: SAMPLE });
    const structure = ShellStructure.parse(yaml);
    const resolved = ShellStructure.resolve(structure);

    expect(structure).to.eql({ kind: 'shell.structure', version: 1, name: 'Sample Shell' });
    expect(resolved).to.eql(structure);
  });
});
